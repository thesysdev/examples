import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  fromOpenAICompletion,
  TextResponseSchema,
  toOpenAIMessages,
} from "@crayonai/stream";

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
};

export async function POST(req) {
  const { messages } = await req.json();
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
  return new NextResponse(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
