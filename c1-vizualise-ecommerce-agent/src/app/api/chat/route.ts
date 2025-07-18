import { NextRequest } from "next/server";
import OpenAI from "openai";
import {
  addMessages,
  getAIThreadMessages,
  AIMessage,
  UIMessage,
} from "@/src/services/threadService";
import { transformStream } from "@crayonai/stream";
import { tools } from "./tools";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

type ThreadId = string;

// Standard OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Thesys Visualize client
const thesysClient = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/visualize",
  apiKey: process.env.THESYS_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly and helpful e-commerce assistant specializing in clothing. Your goal is to help users find products, learn about them, and manage their shopping cart.

**Your Workflow:**
1.  **Greet & Suggest:** Start the conversation with a warm greeting. You can proactively call the 'listProducts' tool to list all products.
2.  **List Products:** Use the 'listProducts' tool when the user asks for specific types of clothing (e.g., "black t-shirts", "jeans"). Show the summary results including name, ID, price, and imageUrl. Add the imageUrl to the response if it is provided in the tool call response.
3.  **Details & Variants:** When a user expresses interest in a specific product (or asks for details using an ID), *always* use the 'getProductDetails' tool first. Present the full details, including the description, price, imageUrl, and crucially, the *available variants* (sizes, colors, and current stock). Add the imageUrl to the response if it is provided in the tool call response.
4.  **Guide Selection:** Explicitly ask the user to confirm the exact size and color they want from the available variants before proceeding.
5.  **Add to Cart:** Only use the 'addToCart' tool *after* the user confirms the product ID, size, color, and quantity, and you have confirmed availability via 'getProductDetails'.
6.  **Manage Cart:** Use the 'getCart' tool to show the user their current cart contents when asked.

**Important Notes:**
*   Be clear about product availability (stock levels for variants).
*   Inform users that the only payment method available is **Cash on Delivery**.
*   Your final response is processed by another assistant to generate a user interface (e.g., product lists, forms). Structure your responses clearly for this purpose.
*   If user asks for output in a specific component for example a graph, table, etc, try your best to generate the output in the requested format, so that the other assistant can use it to generate the UI.
`;

export async function POST(req: NextRequest) {
  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: AIMessage;
    threadId: ThreadId;
    responseId: string;
  };

  // --- Step 1: Call Standard OpenAI API ---

  const previousAiMessages = await getAIThreadMessages(threadId);
  // Use the runTools helper for standard OpenAI call to handle tool logic
  const runner = openai.beta.chat.completions.runTools({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...previousAiMessages,
      { role: "user", content: prompt.content! } as ChatCompletionMessageParam,
    ],
    temperature: 0.1,
    stream: false,
    tools: tools,
  });

  // Wait for the OpenAI call to complete (including potential tool calls)
  await runner.done();
  const finalMessages = runner.messages;

  // Find the user message and the final assistant message(s) from the run
  const newAiMessagesToStore: AIMessage[] = [];
  const newUIMessagesToStore: UIMessage[] = [];

  // Add the original user prompt with its ID
  newAiMessagesToStore.push(prompt);
  newUIMessagesToStore.push(prompt);

  // Add messages generated during the OpenAI run (assistant responses, tool calls/results)
  finalMessages.forEach((msg) => {
    if (
      !previousAiMessages.some(
        (prevMsg) => JSON.stringify(prevMsg) === JSON.stringify(msg)
      )
    ) {
      if (msg.role !== "user") {
        newAiMessagesToStore.push({
          ...msg,
          id: crypto.randomUUID(),
        } as AIMessage);
      }
    }
  });

  // --- Step 3: Extract Final Assistant Content for Thesys ---

  // Find the last assistant message that is intended for the user
  const finalAssistantMessageForUI = finalMessages
    .filter((m) => m.role === "assistant" && m.content)
    .pop();

  if (
    !finalAssistantMessageForUI ||
    typeof finalAssistantMessageForUI.content !== "string"
  ) {
    console.error("No final assistant message content found after OpenAI run.");
    return new Response("", { status: 200 });
  }

  console.log("finalAssistantMessageForUI", finalAssistantMessageForUI.content);

  // --- Step 4: Call Thesys  API and Stream to Client ---
  const thesysStreamRunner = thesysClient.beta.chat.completions.runTools({
    model: "c1/anthropic/claude-3.5-sonnet/v-20250617", // available models: https://docs.thesys.dev/guides/models-pricing#model-table
    messages: [
      ...previousAiMessages,
      { role: "user", content: prompt.content! } as ChatCompletionMessageParam,
      { role: "assistant", content: finalAssistantMessageForUI.content },
    ],
    stream: true,
    tools: [],
  });

  const allThesysMessages: ChatCompletionMessageParam[] = [];

  thesysStreamRunner.on("message", (message) => {
    allThesysMessages.push(message);
  });

  thesysStreamRunner.on("end", async () => {
    // --- Step 5: Store Final UI Message ---
    const finalUIMessageFromStream =
      allThesysMessages[allThesysMessages.length - 1];

    if (finalUIMessageFromStream) {
      const uiMessageToStore: UIMessage = {
        ...finalUIMessageFromStream,
        id: responseId,
      };
      newUIMessagesToStore.push(uiMessageToStore);
      await addMessages(threadId, newAiMessagesToStore, newUIMessagesToStore);
    }
  });

  const llmStream = await thesysStreamRunner;

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
