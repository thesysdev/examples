import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import { DBMessage, getMessageStore } from "./messageStore";
import {
  createOrder,
  getOrders,
  getOrderSchema,
  orderSchema,
} from "./orderManagement";
import { zodToJsonSchema } from "zod-to-json-schema";
import { JSONSchema } from "openai/lib/jsonschema.mjs";
import { inventoryQuerySchema } from "./inventory";
import { getInventory } from "./inventory";

const SYSTEM_MESSAGE = `
You are a helpful assistant that can help with placing orders and checking inventory.

<ui_rules>
- When showing inventory use the list component to show the inventory along with its image.
  Always add the imageSrc to the list component.
</ui_rules>
`;

export async function POST(req: NextRequest) {
  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: DBMessage;
    threadId: string;
    responseId: string;
  };
  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed/",
    apiKey: process.env.THESYS_API_KEY,
  });
  const messageStore = getMessageStore(threadId);
  if (messageStore.getOpenAICompatibleMessageList().length === 0) {
    messageStore.addMessage({
      role: "system",
      content: SYSTEM_MESSAGE,
    });
  }

  messageStore.addMessage(prompt);

  const llmStream = client.beta.chat.completions.runTools({
    model: "c1/anthropic/claude-3.5-sonnet/v-20250617", // available models: https://docs.thesys.dev/guides/models-pricing#model-table
    messages: messageStore.getOpenAICompatibleMessageList(),
    stream: true,
    tools: [
      {
        type: "function",
        function: {
          name: "createOrder",
          description: "Create an order",
          parameters: zodToJsonSchema(orderSchema) as JSONSchema,
          function: createOrder,
          parse: JSON.parse,
        },
      },
      {
        type: "function",
        function: {
          name: "getOrders",
          description: "Get all orders",
          parameters: zodToJsonSchema(getOrderSchema) as JSONSchema,
          function: getOrders,
          parse: JSON.parse,
        },
      },
      {
        type: "function",
        function: {
          name: "getInventory",
          description: "Get the current inventory",
          parameters: zodToJsonSchema(inventoryQuerySchema) as JSONSchema,
          function: getInventory,
          parse: JSON.parse,
        },
      },
    ],
  });

  const responseStream = transformStream(
    llmStream,
    (chunk) => {
      return chunk.choices[0].delta.content;
    },
    {
      onEnd: ({ accumulated }) => {
        const message = accumulated.filter((message) => message).join("");
        messageStore.addMessage({
          role: "assistant",
          content: message,
          id: responseId,
        });
      },
    }
  ) as ReadableStream<string>;

  return new NextResponse(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
