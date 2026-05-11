import { NextRequest } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import { MOCK_C1_APP_TOOL_DEFINITIONS } from "./mock-c1-app-tools";

type ClientMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  const { messages, threadId } = (await req.json()) as {
    messages: ClientMessage[];
    threadId: string;
    responseId: string;
  };

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/artifact",
    apiKey: process.env.THESYS_API_KEY,
  });

  const appId = `dashboard-${threadId}`;

  console.log(messages)

  const llmStream = await client.chat.completions.create({
    model: "c1/google/gemini-3.1-pro/v-20260331", // Model can be changed: https://docs.thesys.dev/api-reference/models-and-compatibility#model-coverage
    messages: [
      {
        role: "system",
        content:
          "You are a helpful analytics assistant. Generate dashboards by calling the provided tools. When the user asks to modify an existing dashboard, patch it in place rather than regenerating it from scratch.",
      },
      ...messages.map(({ role, content }) => ({ role, content })),
    ],
    stream: true,
    metadata: {
      thesys: JSON.stringify({
        c1_artifact_type: "c1app",
        app: {
          tools: MOCK_C1_APP_TOOL_DEFINITIONS,
          appId,
          title: "Usage Analytics Dashboard",
        },
      }),
    },
    reasoning_effort: "medium",
  });

  const responseStream = transformStream(llmStream, (chunk) => {
    return chunk.choices[0]?.delta?.content;
  }) as ReadableStream<string>;

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
