import { NextRequest } from "next/server";
import OpenAI from "openai";
import {
  addMessages,
  getLLMThreadMessages,
} from "@/src/services/threadService";
import { transformStream } from "@crayonai/stream";
import { tools } from "./tools";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

type ThreadId = string;

export async function POST(req: NextRequest) {
  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: {
      role: "user";
      content: string;
      id: string;
    };
    threadId: ThreadId;
    responseId: string;
  };

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: process.env.THESYS_API_KEY,
  });

  const llmMessages = await getLLMThreadMessages(threadId);

  const runToolsResponse = client.beta.chat.completions.runTools({
    model: "c1-nightly",
    messages: [
      ...llmMessages,
      {
        role: "user",
        content: prompt.content!,
      },
    ],
    stream: true,
    tools,
  });

  const allRunToolsMessages: ChatCompletionMessageParam[] = [];
  let isError = false;

  runToolsResponse.on("error", () => {
    isError = true;
  });

  runToolsResponse.on("message", (message) => {
    allRunToolsMessages.push(message);
  });

  runToolsResponse.on("end", async () => {
    if (isError) {
      return;
    }

    const runToolsMessagesWithId = allRunToolsMessages.map((m, index) => {
      const id =
        allRunToolsMessages.length - 1 === index // for last message (the response shown to user), use the responseId as provided by the UI
          ? responseId
          : crypto.randomUUID();

      return {
        ...m,
        id,
      };
    });

    const messagesToStore = [prompt, ...runToolsMessagesWithId];

    await addMessages(threadId, ...messagesToStore);
  });

  const llmStream = await runToolsResponse;

  const responseStream = transformStream(llmStream, (chunk) => {
    return chunk.choices[0]?.delta?.content;
  });

  return new Response(responseStream as ReadableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
