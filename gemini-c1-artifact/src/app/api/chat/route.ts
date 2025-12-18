import { GoogleGenAI, FunctionCallingConfigMode } from "@google/genai";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { makeC1Response } from "@thesysai/genui-sdk/server";
import { nanoid } from "nanoid";
import { toolDeclarations } from "./tools";
import { handleCreateArtifact, handleEditArtifact } from "./artifact";
import {
  addMessages,
  getMessageContent,
  getMessages,
  initThread,
  StoredMessage,
  ThreadId,
} from "./messageStore";
import { systemPrompt } from "./systemPrompt";

export async function POST(req: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const thesysApiKey = process.env.THESYS_API_KEY;

  if (!geminiApiKey) {
    return new Response("Missing GEMINI_API_KEY", { status: 500 });
  }
  if (!thesysApiKey) {
    return new Response("Missing THESYS_API_KEY", { status: 500 });
  }

  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: { role: "user"; content: string; id: string };
    threadId: ThreadId;
    responseId: string;
  };

  // Initialize thread with system prompt if new
  initThread(threadId, systemPrompt);

  // Initialize Gemini client
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Initialize OpenAI client for C1 Artifacts API
  const artifactsClient = new OpenAI({
    apiKey: thesysApiKey,
    baseURL: "https://api.thesys.dev/v1/artifact",
  });

  // Create C1 response handler for streaming
  const c1Response = makeC1Response();

  try {
    // Get conversation history for context
    const history = getMessages(threadId);
    const conversationHistory = history
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    // Add current user message
    conversationHistory.push({
      role: "user",
      parts: [{ text: prompt.content }],
    });

    // Call Gemini with function calling enabled
    const response = await ai.models.generateContent({
      model: "gemini-3-flash",
      contents: conversationHistory as any,
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

    const messagesToStore: StoredMessage[] = [prompt];
    let finalResponseText = "";

    // Check if Gemini wants to call a function
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const functionCall of response.functionCalls) {
        const args = functionCall.args as Record<string, string>;

        if (functionCall.name === "create_artifact") {
          const result = await handleCreateArtifact(
            args.instructions,
            args.artifactType as "slides" | "report",
            artifactsClient,
            c1Response,
            responseId
          );
          finalResponseText = result;
        } else if (functionCall.name === "edit_artifact") {
          const result = await handleEditArtifact(
            args.artifactId,
            args.version,
            args.instructions,
            (version) => Promise.resolve(getMessageContent(threadId, version)),
            artifactsClient,
            c1Response,
            responseId
          );
          finalResponseText = result;
        }
      }

      // After tool execution, get a follow-up response from Gemini
      const followUpResponse = await ai.models.generateContent({
        model: "gemini-3-flash",
        contents: [
          ...conversationHistory,
          {
            role: "model",
            parts: [
              {
                functionCall: {
                  name: response.functionCalls[0].name,
                  args: response.functionCalls[0].args,
                },
              },
            ],
          },
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: response.functionCalls[0].name,
                  response: { result: finalResponseText },
                },
              },
            ],
          },
        ] as any,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const followUpText = followUpResponse.text || "";
      if (followUpText) {
        c1Response.writeContent("\n\n" + followUpText);
      }
    } else {
      // No function call, just stream the text response
      const text = response.text || "";
      c1Response.writeContent(text);
    }

    // Store messages
    const assistantMessage: StoredMessage = {
      id: responseId,
      role: "assistant",
      content: c1Response.getAssistantMessage().content,
    };
    messagesToStore.push(assistantMessage);
    addMessages(threadId, ...messagesToStore);

    // End the response
    c1Response.end();

    return new NextResponse(c1Response.responseStream as ReadableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    c1Response.writeContent(
      "Sorry, an error occurred while processing your request."
    );
    c1Response.end();
    return new NextResponse(c1Response.responseStream as ReadableStream, {
      status: 500,
      headers: {
        "Content-Type": "text/event-stream",
      },
    });
  }
}
