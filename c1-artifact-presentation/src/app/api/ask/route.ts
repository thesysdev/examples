import OpenAI from "openai";
import { NextRequest } from "next/server";
import { makeC1Response } from "@thesysai/genui-sdk/server";
import { transformStream } from "@crayonai/stream";

export async function POST(req: NextRequest) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) {
    return new Response("Missing THESYS_API_KEY", { status: 500 });
  }

  const { prompt, presentation } = (await req.json()) as {
    prompt?: string;
    presentation?: string;
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

  if (typeof presentation === "string" && presentation.trim().length > 0) {
    messages.push({ role: "assistant", content: presentation });
  }

  messages.push({ role: "user", content: prompt });

  const stream = client.chat.completions.runTools({
    model: "c1/artifact/v-20250831",
    stream: true,
    messages,
    abortSignal: req.signal,
    tools: [
      {
        type: "function",
        function: {
          name: "get_decorative_images",
          description: "Get the decorative images for presentation",
          parameters: {
            type: "object",
          },
          function: () => {
            return {
              images: [
                "https://images.unsplash.com/photo-1503455637927-730bce8583c0?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                "https://images.unsplash.com/photo-1487147264018-f937fba0c817?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                "https://images.unsplash.com/photo-1547623641-d2c56c03e2a7?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              ],
            };
          },
        },
      },
    ],
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
