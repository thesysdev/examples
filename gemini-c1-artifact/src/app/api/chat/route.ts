import { GoogleGenAI, FunctionCallingConfigMode, Content } from "@google/genai";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { toolDeclarations } from "./tools";
import { handleCreateArtifact, handleEditArtifact } from "./artifact";
import {
  addMessages,
  getArtifactContent,
  getMessages,
  initThread,
  StoredMessage,
} from "./messageStore";
import { systemPrompt } from "./systemPrompt";
import { GEMINI_MODEL, C1_API_BASE_URL } from "./constants";

/** SSE event types for streaming responses */
type SSEEventType = "text" | "artifact";

/**
 * Creates a Server-Sent Events (SSE) stream with separate channels for text and artifacts.
 *
 * The stream uses the SSE protocol format:
 * - `event: text` for chat text content
 * - `event: artifact` for C1 artifact markup
 *
 * Each event contains JSON data: `{ content: string }`
 *
 * @returns An object with methods to write events and manage the stream
 */
function createSSEStream() {
  const encoder = new TextEncoder();
  let accumulatedText = "";
  let accumulatedArtifact = "";
  let isClosed = false;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const writeEvent = async (eventType: SSEEventType, content: string) => {
    if (isClosed) return;
    try {
      const data = JSON.stringify({ content });
      const event = `event: ${eventType}\ndata: ${data}\n\n`;
      await writer.write(encoder.encode(event));
    } catch {
      // Stream was closed by client, ignore write errors
      isClosed = true;
    }
  };

  return {
    stream: readable,
    writeText: (content: string) => {
      accumulatedText += content;
      writeEvent("text", content);
    },
    writeArtifact: (content: string) => {
      accumulatedArtifact += content;
      writeEvent("artifact", content);
    },
    getAccumulatedText: () => accumulatedText,
    getAccumulatedArtifact: () => accumulatedArtifact,
    end: async () => {
      if (isClosed) return;
      try {
        await writer.close();
      } catch {
        // Already closed, ignore
      }
      isClosed = true;
    },
  };
}

export async function POST(req: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const thesysApiKey = process.env.THESYS_API_KEY;

  if (!geminiApiKey) {
    return new Response("Missing GEMINI_API_KEY", { status: 500 });
  }
  if (!thesysApiKey) {
    return new Response("Missing THESYS_API_KEY", { status: 500 });
  }

  // Parse and validate request body
  const body = await req.json();
  const { prompt, threadId, responseId } = body as {
    prompt: { role: "user"; content: string; id: string };
    threadId: string;
    responseId: string;
  };

  // Validate required fields
  if (!prompt?.content || !prompt?.id || !threadId || !responseId) {
    return new Response(
      JSON.stringify({
        error:
          "Missing required fields: prompt (with content and id), threadId, responseId",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Initialize thread with system prompt if new
  initThread(threadId, systemPrompt);

  // Initialize Gemini client
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Initialize OpenAI client for C1 Artifacts API
  const artifactsClient = new OpenAI({
    apiKey: thesysApiKey,
    baseURL: C1_API_BASE_URL,
  });

  // Create custom SSE stream
  const sse = createSSEStream();

  // Convert prompt to StoredMessage format and store synchronously
  // This ensures it's available for subsequent requests
  const userMessage: StoredMessage = {
    id: prompt.id,
    role: "user",
    content: prompt.content,
  };
  addMessages(threadId, userMessage);

  // Build conversation history from server-side storage (includes artifact data)
  // Format as Gemini Content[] type for proper type safety
  const history = getMessages(threadId);
  const conversationHistory: Content[] = history
    .filter((m) => m.role !== "system" && m.role !== "tool") // Skip system and tool messages
    .map((m) => {
      // For assistant messages, combine text and artifact content
      const fullContent = m.artifactContent
        ? `${m.content}\n\n${m.artifactContent}`
        : m.content;
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: fullContent }],
      };
    });

  // Start streaming in background - don't await!
  (async () => {
    try {
      // Call Gemini with streaming enabled
      const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: conversationHistory,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: toolDeclarations }],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
        },
      });

      let functionCalls: any[] = [];

      // Stream the response chunks
      for await (const chunk of stream) {
        // Handle text chunks - send as text event
        if (chunk.text) {
          sse.writeText(chunk.text);
        }

        // Collect function calls
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          functionCalls.push(...chunk.functionCalls);
        }
      }

      // Handle function calls after streaming text
      const toolCallResults: string[] = [];
      if (functionCalls.length > 0) {
        for (const functionCall of functionCalls) {
          const args = functionCall.args as Record<string, string>;

          if (functionCall.name === "create_artifact") {
            const result = await handleCreateArtifact(
              args.instructions,
              args.artifactType as "slides" | "report",
              artifactsClient,
              sse.writeArtifact,
              responseId
            );
            toolCallResults.push(
              `Tool: create_artifact\nArgs: ${JSON.stringify(
                args
              )}\nResult: ${result}`
            );
          } else if (functionCall.name === "edit_artifact") {
            const result = await handleEditArtifact(
              args.artifactId,
              args.version,
              args.instructions,
              (version) => {
                // Look up artifact content from server-side storage
                return Promise.resolve(getArtifactContent(version));
              },
              artifactsClient,
              sse.writeArtifact,
              responseId
            );
            toolCallResults.push(
              `Tool: edit_artifact\nArgs: ${JSON.stringify(
                args
              )}\nResult: ${result}`
            );
          }
        }
      }

      // Store assistant message after streaming is done
      // Include tool results in the assistant message content so the model knows what it did
      let textContent = sse.getAccumulatedText();
      if (toolCallResults.length > 0) {
        textContent = textContent
          ? `${textContent}\n\n[Tool Results]\n${toolCallResults.join("\n\n")}`
          : `[Tool Results]\n${toolCallResults.join("\n\n")}`;
      }

      const assistantMessage: StoredMessage = {
        id: responseId,
        role: "assistant",
        content: textContent,
        artifactContent: sse.getAccumulatedArtifact() || undefined,
      };

      addMessages(threadId, assistantMessage);

      // End the response after everything completes
      await sse.end();
    } catch (error) {
      console.error("Error in chat route:", error);
      sse.writeText("Sorry, an error occurred while processing your request.");
      await sse.end();
    }
  })();

  // Return response immediately - streaming happens in background
  return new NextResponse(sse.stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
