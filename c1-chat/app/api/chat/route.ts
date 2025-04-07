import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { tools } from "./tools";
import { systemPrompt } from "./systemPrompt";
import { transformStream } from "@crayonai/stream";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as {
    messages: ChatCompletionMessageParam[];
  };
  const client = new OpenAI({
    baseURL: "http://localhost:3102/v1/embed",
    apiKey: process.env.THESYS_API_KEY,
  });

  const runToolsResponse = client.beta.chat.completions.runTools({
    model: "c1-nightly",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
    stream: true,
    parallelToolCalls: true,
    tools: tools,
  });

  const llmStream = await runToolsResponse;

  const responseStream = transformStream(llmStream, (chunk) => {
    return chunk.choices[0]?.delta?.content;
  });

  return new Response(responseStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
