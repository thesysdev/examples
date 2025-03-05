import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  fromOpenAICompletion,
  TextResponseSchema,
  toOpenAIMessages,
} from "@crayonai/stream";
import { Message } from "@crayonai/react-core";

const TemplatesJsonSchema = {
  type: "object",
  properties: {
    response: {
      type: "array",
      items: {
        oneOf: [TextResponseSchema],
      },
    },
  },
} as const;

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: Message[] };
  const client = new OpenAI();
  const llmStream = await client.chat.completions.create({
    model: "gpt-4o",
    messages: toOpenAIMessages(messages),
    stream: true,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "json_schema",
        schema: TemplatesJsonSchema,
      },
    },
  });
  const responseStream = fromOpenAICompletion(llmStream);
  // @ts-expect-error fix this
  return new NextResponse(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
