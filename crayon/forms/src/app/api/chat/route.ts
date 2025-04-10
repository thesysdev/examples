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
import { applyToJob, subscribeToNewsletter } from "./tools";
import { JobApplicationSchema } from "../../types/application";

const zodParse = (zodSchema: z.ZodSchema) => (data: string) => {
  return zodSchema.parse(JSON.parse(data));
};

const responseTemplates = [
  {
    schema: z.object({}),
    name: "subscribe_form",
    description: "A simple form that asks for a name and email address.",
  },
  {
    schema: z.object({}),
    name: "personal_information_form",
    description: "A form that asks for a name and email address.",
  },
  {
    schema: z.object({}),
    name: "professional_details_form",
  },
  {
    schema: z.object({}),
    name: "education_form",
    description: "A form that asks for a school and degree.",
  },
];

const SYSTEM_PROMPT = `
You are a helpful assistant on Acme Inc's website that can help users
- subscribe to a newsletter (use the subscribeToNewsletter tool)
- apply to a job (use the applyToJob tool)

When subscribing to a newsletter:
- if the user enters invalid information, you should ask them to enter
  valid information and present them with the form again.

When applying to a job:
- if the user enters invalid information, you should ask them to enter valid information
  and present them with the form again.
- Professional details are optional so if the user doesn't want to provide them, skip the form.
- Personal information is required so if the user doesn't provide it, ask them to enter it.
- Education is required so if the user doesn't provide it, ask them to enter it.
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
    response_format: templatesToResponseFormat(...responseTemplates),
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
      {
        type: "function",
        function: {
          name: "applyToJob",
          description: "Apply to a job",
          parameters: zodToJsonSchema(JobApplicationSchema) as JSONSchema,
          function: applyToJob,
          parse: zodParse(JobApplicationSchema),
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
