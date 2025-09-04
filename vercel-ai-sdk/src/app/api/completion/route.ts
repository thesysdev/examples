import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = streamText({
    model: createOpenAI({
      apiKey: process.env.THESYS_API_KEY,
      baseURL: "https://api.thesys.dev/v1/embed",
    }).chat("c1/anthropic/claude-sonnet-4/v-20250815"),
    prompt,
  });

  return result.toUIMessageStreamResponse();
}
