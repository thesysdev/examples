import { NextRequest } from "next/server";
import OpenAI from "openai";
import {
  fromOpenAICompletion,
  toOpenAIMessages,
  templatesToResponseFormat,
} from "@crayonai/stream";
import { Message } from "@crayonai/react-core";
import { RecipeTemplateSchema } from "@/types/recipe";

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: Message[] };
  const client = new OpenAI();
  const responseFormat = templatesToResponseFormat({
    schema: RecipeTemplateSchema,
    name: "recipe",
    description: "Use this template to generate a recipe",
  });
  const llmStream = await client.chat.completions.create({
    model: "gpt-4o",
    messages: toOpenAIMessages(
      messages
    ) as OpenAI.Chat.ChatCompletionMessageParam[],
    stream: true,
    response_format: responseFormat,
  });
  const responseStream = fromOpenAICompletion(llmStream);
  return new Response(responseStream as unknown as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
