import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { transformStream } from "@crayonai/stream";
import { systemPrompt } from "./systemPrompt";
import { tools } from "./tools";
import { handleCreateArtifact, handleEditArtifact } from "./artifact";
import { makeC1Response } from "@thesysai/genui-sdk/server";
import { nanoid } from "nanoid";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";
import { addMessages, getMessageContent, getMessages, messageStore, StoredMessage, ThreadId } from "./messageStore";


export async function POST(req: NextRequest) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) {
    return new Response("Missing THESYS_API_KEY", { status: 500 });
  }

  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: { role: "user"; content: string; id: string };
    threadId: ThreadId;
    responseId: string;
  };

  // Initialize thread with system prompt
  if (!messageStore.has(threadId)) {
    messageStore.set(threadId, [{ role: "system", content: systemPrompt }]);
  }

  // embed client for the LLM
  const embedClient = new OpenAI({
    apiKey,
    baseURL: "https://api.thesys.dev/v1/embed",
  });

  // artifacts client for the artifacts API to create and edit artifacts
  const artifactsClient = new OpenAI({
    apiKey,
    baseURL: "https://api.thesys.dev/v1/artifact",
  });

  const c1Response = makeC1Response();

  try {
    const runner = embedClient.chat.completions.runTools({
      model: "c1/openai/gpt-5/v-20250930",
      messages: [...getMessages(threadId), { role: "user", content: prompt.content }],
      stream: true,
      tools: tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
          function: async (args: string) => {
            const parsedArgs = JSON.parse(args);
            const toolName = tool.function.name;

            // Handle create tools
            if (toolName === "create_presentation" || toolName === "create_report") {
              return await handleCreateArtifact(
                parsedArgs.instructions,
                toolName === "create_presentation" ? "slides" : "report",
                artifactsClient,
                c1Response,
                responseId
              );
            }

            // Handle edit tools
            if (toolName === "edit_presentation" || toolName === "edit_report") {
              return await handleEditArtifact(
                parsedArgs.artifactId,
                parsedArgs.version,
                parsedArgs.instructions,
                (version) => Promise.resolve(getMessageContent(threadId, version)),
                artifactsClient,
                c1Response,
                responseId
              );
            }

            return "Tool not implemented";
          },
        },
      })),
    });

    const allMessages: ChatCompletionMessageParam[] = [];
    let isError = false;

    runner.on("error", () => {
      isError = true;
    });

    runner.on("message", (message: ChatCompletionMessageParam) => {
      allMessages.push(message);
    });

    runner.on("end", async () => {
      if (isError) return;

      // Assign IDs to messages
      const messagesWithIds = allMessages.map((m, index) => {
        const isLast = index === allMessages.length - 1;
        return {
          ...m,
          id: isLast ? responseId : nanoid(),
          content: isLast ? c1Response.getAssistantMessage().content : m.content,
        };
      });

      // Save all messages
      addMessages(threadId, prompt, ...(messagesWithIds as StoredMessage[]));
    });

    const llmStream = await runner;

    // Stream final response
    const responseStream = transformStream(
      llmStream,
      (chunk: any) => {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          c1Response.writeContent(content);
        }
        return content;
      },
      {
        onEnd: () => {
          c1Response.end();
        },
      }
    );

    return new NextResponse(c1Response.responseStream as ReadableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    c1Response.end();
    return new Response("Error processing request", { status: 500 });
  }
}
