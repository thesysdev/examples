import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DBMessage, getMessageStore } from "./messageStore";
import { MCPClient } from "./mcp";
import { makeC1Response } from "@thesysai/genui-sdk/server";
import { JSONSchema } from "openai/lib/jsonschema.mjs";
import { transformStream } from "@crayonai/stream";

// Initialize MCP client
const mcpClient = new MCPClient();

interface RequestBody {
  prompt: DBMessage;
  threadId: string;
  responseId: string;
}

/**
 * Initialize MCP client connection if not already connected
 */
async function ensureMCPConnection(): Promise<void> {
  if (mcpClient.tools.length === 0) {
    const serverUrl = process.env.MCP_SERVER_URL;
    if (!serverUrl) {
      throw new Error("MCP_SERVER_URL environment variable is required");
    }
    await mcpClient.connect(serverUrl);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const { prompt, threadId, responseId } = (await req.json()) as RequestBody;

    // Initialize dependencies
    const client = new OpenAI({
      baseURL: "https://api.thesys.dev/v1/embed/",
      apiKey: process.env.THESYS_API_KEY,
    });
    const messageStore = getMessageStore(threadId);

    // Add user message to conversation
    messageStore.addMessage(prompt);

    // Ensure MCP connection is established
    await ensureMCPConnection();

    // Get conversation history
    const messages = messageStore.getOpenAICompatibleMessageList();
    const c1Response = makeC1Response();
    c1Response.writeThinkItem({
      title: "Processing your request...",
      description: "Analyzing your message and determining the best approach.",
    });

    const llmStream = await client.beta.chat.completions.runTools({
      model: "c1/anthropic/claude-sonnet-4/v-20250930", // available models: https://docs.thesys.dev/guides/models-pricing#model-table
      messages: messages,
      tools: mcpClient.tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.function.name,
          description: tool.function.description!,
          parameters: tool.function.parameters as unknown as JSONSchema,
          parse: JSON.parse,
          function: async (args: unknown) => {
            c1Response.writeThinkItem({
              title: `Using tool ${tool.function.name}`,
              description:
                "Executing external tools to gather the information you need.",
            });
            const results = await mcpClient.runTool({
              tool_call_id: tool.function.name + Date.now().toString(),
              name: tool.function.name,
              args: args as Record<string, unknown>,
            });
            return results.content;
          },
        },
      })),
      stream: true,
    });

    transformStream(
      llmStream,
      (chunk) => {
        return chunk.choices[0].delta.content;
      },
      {
        onTransformedChunk: (chunk) => {
          if (chunk) {
            c1Response.writeContent(chunk);
          }
        },
        onError: (error) => {
          console.error("Error in chat route:", error);
          c1Response.writeContent(
            "Sorry, I encountered an error processing your request."
          );
        },
        onEnd: ({ accumulated }) => {
          const message = accumulated.filter((message) => message).join("");
          messageStore.addMessage({
            role: "assistant",
            content: message,
            id: responseId,
          });
          c1Response.end();
        },
      }
    );

    return new NextResponse(c1Response.responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
