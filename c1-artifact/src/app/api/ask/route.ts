import OpenAI from "openai";
import { NextRequest } from "next/server";
import { makeC1Response } from "@thesysai/genui-sdk/server";
import { transformStream } from "@crayonai/stream";

export async function POST(req: NextRequest) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) {
    return new Response("Missing THESYS_API_KEY", { status: 500 });
  }

  const { prompt, artifactType, artifactId, artifactContent } = (await req.json()) as {
    prompt?: string;
    artifactType?: "slides" | "report";
    artifactId?: string;
    artifactContent?: string;
  };

  if (!prompt || typeof prompt !== "string") {
    return new Response("Missing 'prompt'", { status: 400 });
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.thesys.dev/v1/artifact",
  });

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [];
  
  // Include previous artifact content if editing
  if (typeof artifactContent === "string" && artifactContent.trim().length > 0) {
    messages.push({ role: "assistant", content: artifactContent });
  }
  messages.push({ role: "user", content: prompt });

  const stream = client.chat.completions.runTools({
    model: "c1/artifact/v-20251030",
    stream: true,
    messages,
    abortSignal: req.signal,
    tools: [],
    metadata: {
      thesys: JSON.stringify({
        id: artifactId,
        c1_artifact_type: artifactType,
      }),
    }
  });

  const c1Response = makeC1Response();

  let isAborted = false;
  req.signal.addEventListener("abort", () => {
    isAborted = true;
  });

  transformStream(
    stream,
    (chunk) => {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        c1Response.writeContent(content);
      }
    },
    {
      onError: (error) => {
        console.error("Error in ask route:", error);
      },
      onEnd: () => {
        if (isAborted) {
          return;
        }
        c1Response.end();
        // if you want to store the response just call
        //  c1Response.getAssistantMessage() to get the assistant message
      },
    }
  );

  return new Response(c1Response.responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
