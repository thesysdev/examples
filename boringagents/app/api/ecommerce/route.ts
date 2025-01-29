import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import OpenAI from "openai";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  OpenAIToolCall,
  ToolMessage,
} from "@langchain/core/messages";
import { StructuredTool, tool } from "@langchain/core/tools";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";

/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */

// Define a sample tool
const productSearchTool = {
  name: "search_products",
  description: "Search for products in the catalog",
  schema: z.object({
    productName: z.string().describe("The search query for products"),
    category: z.string().optional().describe("Optional product category"),
  }),
  func: async ({
    productName,
    category,
  }: {
    productName: string;
    category?: string;
  }) => {
    // Mock implementation - replace with actual product search logic
    return JSON.stringify([
      { id: 1, name: productName, category, price: 99.99 },
    ]);
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];

    // Initialize ChatOpenAI with streaming
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming: true,
    });

    // Convert messages to LangChain format
    const formattedMessages = [
      new SystemMessage(
        "You are a helpful e-commerce assistant. You can search for products and provide information about them." +
          "When an user asks for a product, you should use the search_products tool to search for the product and provide information about it. " +
          "DO NOT add any additional information for the products except what is provided by the search_products tool.",
      ),
      ...messages.map((msg: any) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
    ];

    // Create stream
    const stream = await model.stream(formattedMessages, {
      tools: [
        {
          type: "function",
          function: convertToOpenAIFunction(productSearchTool),
        },
      ],
    });

    // Create response stream
    const textEncoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.content) {
            controller.enqueue(textEncoder.encode(chunk.content.toString()));
          }
          // Handle tool calls if present
          if (chunk.tool_calls && chunk.tool_calls.length > 0) {
            const toolResults = await Promise.all(
              chunk.tool_calls.map(async (toolCall) => {
                // Argument passing isn't working. It always sends undefined.
                console.log("toolCall", toolCall.args);
                const result = await productSearchTool.func({
                  productName: toolCall.args.productName,
                  category: toolCall.args.category,
                });
                return {
                  tool_call_id: toolCall.id,
                  function_name: toolCall.name,
                  content: result,
                };
              }),
            );

            // Call the model with tool results
            const toolResponseStream = await model.stream([
              ...formattedMessages,
              new AIMessage({
                content: chunk.content || "",
                tool_calls: chunk.tool_calls,
              }),
              ...toolResults.map(
                (result) =>
                  new ToolMessage({
                    content: result.content,
                    tool_call_id: result.tool_call_id!,
                  }),
              ),
            ]);

            // Stream the response from tool results
            for await (const toolChunk of toolResponseStream) {
              if (toolChunk.content) {
                controller.enqueue(
                  textEncoder.encode(toolChunk.content.toString()),
                );
              }
            }
          }
        }
        controller.close();
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e: any) {
    console.error("Error:", e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
