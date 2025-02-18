import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { fromOpenAICompletion, TextResponseSchema } from "@crayonai/stream";
import { CreateMessage } from "@crayonai/react-core";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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

function mapCreateMessageToOpenAIMessage(
  message: CreateMessage
): ChatCompletionMessageParam {
  return {
    role: "user",
    content: message.message,
  };
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const client = new OpenAI();
  const llmStream = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [mapCreateMessageToOpenAIMessage(message)],
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
