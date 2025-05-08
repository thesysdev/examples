import { NextRequest } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import { tools } from "./tools";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as {
    prompt: string;
  };

  const runToolsResponse = client.beta.chat.completions.runTools({
    model: "c1-nightly",
    messages: [
      {
        role: "system",
        content: `You are a business research assistant just like crunchbase. You answer questions about a company or domain.
given a company name or domain, you will search the web for the latest information.

at the end of your response, add a form with single input field to ask for some other company or domain for another query.
`,
      },
      {
        role: "user",
        content: prompt!,
      },
    ],
    stream: true,
    tools: tools,
  });

  const llmStream = await runToolsResponse;

  const responseStream = transformStream(llmStream, (chunk) => {
    return chunk.choices[0]?.delta?.content || "";
  });

  return new Response(responseStream as ReadableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
