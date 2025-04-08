import { NextRequest } from "next/server";
import OpenAI from "openai";
import { tools } from "./tools";
import { systemPrompt } from "./systemPrompt";
import { transformStream } from "@crayonai/stream";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";
import type { ChatCompletionStreamingRunner } from "openai/lib/ChatCompletionStreamingRunner.mjs";

type ThreadId = string;

// A basic, in-memory message history store
const messageStore: Map<ThreadId, ChatCompletionMessageParam[]> = new Map();

export async function POST(req: NextRequest) {
  const { messages, threadId } = (await req.json()) as {
    messages: ChatCompletionMessageParam[];
    threadId: ThreadId;
  };

  if (!messageStore.has(threadId)) {
    messageStore.set(threadId, [{ role: "system", content: systemPrompt }]);
  }

  pushLatestMessageToStore(threadId, messages);

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: process.env.THESYS_API_KEY,
  });

  const runToolsResponse = client.beta.chat.completions.runTools({
    model: "c1-nightly",
    messages: messageStore.get(threadId)!,
    stream: true,
    parallelToolCalls: true,
    tools: tools,
  });

  updateMessageHistoryStore(threadId, runToolsResponse);

  const llmStream = await runToolsResponse;

  const responseStream = transformStream(llmStream, (chunk) => {
    return chunk.choices[0]?.delta?.content;
  });

  return new Response(responseStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

/**
 * Frontend sends the entire message history maintained on the FE. However, this does not include tool call messages as FE does not receive them.
 * Extract only the latest user message from the request and push it to the backend message history store to generate a response with full context.
 *
 * @param messages - The message history maintained on the FE
 */
const pushLatestMessageToStore = (
  threadId: ThreadId,
  messages: ChatCompletionMessageParam[]
) => {
  const latestMessage = messages[messages.length - 1];

  if (latestMessage.role === "user") {
    pushMessageToThread(threadId, latestMessage);
  }
};

/**
 * Push the newly generated messages by the agent into the message history store
 *
 * @param runner - The runner object
 */
const updateMessageHistoryStore = (
  threadId: ThreadId,
  runner: ChatCompletionStreamingRunner<null>
) => {
  runner.on("message", (event) => {
    pushMessageToThread(threadId, event);
  });
};

const pushMessageToThread = (
  threadId: ThreadId,
  message: ChatCompletionMessageParam
) => {
  messageStore.set(threadId, [...messageStore.get(threadId)!, message]);
};
