import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  fromOpenAICompletion,
  templatesToResponseFormat,
  toOpenAIMessages,
} from "@crayonai/stream";
import { Message } from "@crayonai/react-core";
import { SubscribeToNewsletterSchema } from "../../types/subscribe";
import { zodToJsonSchema } from "zod-to-json-schema";
import { type JSONSchema } from "openai/lib/jsonschema.js";
import { z } from "zod";
import { subscribeToNewsletter } from "./tools";

const zodParse = (zodSchema: z.ZodSchema) => (data: string) => {
  return zodSchema.parse(JSON.parse(data));
};

const SYSTEM_PROMPT = `
You are a helpful assistant that can help users subscribe to a newsletter.
If the user enters invalid information, you should ask them to enter valid information
and present them with the form again.
`;

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: Message[] };
  const client = new OpenAI();
  const llmStream = client.beta.chat.completions.runTools({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...toOpenAIMessages(messages),
    ] as OpenAI.Chat.ChatCompletionMessageParam[],
    stream: true,
    response_format: templatesToResponseFormat({
      schema: z.object({}),
      name: "subscribe_form",
      description: "A simple form that asks for a name and email address.",
    }),
    tools: [
      {
        type: "function",
        function: {
          name: "subscribeToNewsletter",
          description: "Subscribe to the newsletter",
          parameters: zodToJsonSchema(
            SubscribeToNewsletterSchema
          ) as JSONSchema,
          function: subscribeToNewsletter,
          parse: zodParse(SubscribeToNewsletterSchema),
        },
      },
    ],
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
