import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  fromOpenAICompletion,
  templatesToResponseFormat,
  toOpenAIMessages,
} from "@crayonai/stream";
import { Message } from "@crayonai/react-core";

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: Message[] };
  const client = new OpenAI();
  const llmStream = await client.chat.completions.create({
    model: "gpt-4o",
    messages: toOpenAIMessages(
      messages
    ) as OpenAI.Chat.ChatCompletionMessageParam[],
    stream: true,
    response_format: templatesToResponseFormat(),
  });
  const responseStream = fromOpenAICompletion(llmStream);
  return new NextResponse(
    responseStream as unknown as ReadableStream<Uint8Array>,
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );
}
