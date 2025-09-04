import { convertToModelMessages, streamText, UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const model = createOpenAI({
    apiKey: process.env.THESYS_API_KEY,
    baseURL: "https://api.thesys.dev/v1/embed",
  }).chat("c1/anthropic/claude-sonnet-4/v-20250815");
  const result = streamText({
    model: model,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
