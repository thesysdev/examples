import { NextRequest } from "next/server";
import OpenAI from "openai";
import { addMessage, getLLMThreadMessages } from "@/src/services/threadService";
import { transformStream } from "@crayonai/stream";

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

  const runToolsResponse = client.chat.completions.create({
    model: "c1-nightly",
    messages: [
      ...(await getLLMThreadMessages(threadId)),
      {
        role: "user",
        content: prompt.content!,
      },
    ],
    stream: true,
  });

  const llmStream = await runToolsResponse;

  const responseStream = transformStream(
    llmStream,
    (chunk) => {
      return chunk.choices[0]?.delta?.content;
    },
    {
      onEnd: async ({ accumulated }) => {
        const messageContent = accumulated.filter((m) => m).join("");
        if (messageContent) {
          // store the messages in thread after the stream is complete
          await addMessage(threadId, prompt);
          await addMessage(threadId, {
            role: "assistant",
            content: messageContent,
            id: responseId,
          });
        }
      },
    }
  );

  return new Response(responseStream as ReadableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
