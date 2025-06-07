import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DBMessage, getMessageStore } from "./messageStore";
import { MCPClient } from "./mcp";
import { makeC1Response } from "@thesysai/genui-sdk/server";
import { JSONSchema } from "openai/lib/jsonschema.mjs";

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
    await mcpClient.connect();
  }
}

/**
 * Create OpenAI client with configured settings
 */
function createThesysClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed/",
    apiKey: process.env.THESYS_API_KEY,
  });
}

/**
 * Process the conversation using OpenAI's runTools
 */
async function processConversationWithRunTools(
  client: OpenAI,
  messages: OpenAI.ChatCompletionMessageParam[],
  messageStore: ReturnType<typeof getMessageStore>,
  c1Response: ReturnType<typeof makeC1Response>
): Promise<void> {
  try {
    c1Response.writeThinkItem({
      title: "Processing your request...",
      description: "Analyzing your message and determining the best approach.",
    });

    // Use OpenAI's beta runTools method to handle tool execution automatically
    const runner = client.beta.chat.completions
      .runTools({
        model: "c1-nightly",
        messages: messages,
        tools: mcpClient.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.function.name,
            description: tool.function.description || "",
            parameters: tool.function.parameters as unknown as JSONSchema,
            parse: JSON.parse,
            function: async (args: unknown) => {
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
      })
      .on("functionCall", (functionCall) => {
        // Add thinking state when tools are being called
        c1Response.writeThinkItem({
          title: `Using tool: ${functionCall.name}`,
          description:
            "Executing external tools to gather the information you need.",
        });
      })
      .on("functionCallResult", () => {
        // Add thinking state when processing tool results
        c1Response.writeThinkItem({
          title: "Processing results...",
          description:
            "Analyzing the information gathered from tools to provide you with a comprehensive response.",
        });
      })
      .on("message", (message) => {
        // Add messages to store as they're created
        messageStore.addMessage(message);
      })
      .on("content", (delta: string) => {
        // Stream content as it comes
        c1Response.writeContent(delta);
      })
      .on("error", (error) => {
        console.error("RunTools error:", error);
        c1Response.writeContent(
          "Sorry, I encountered an error processing your request."
        );
      });

    await runner.finalChatCompletion();
  } catch (error) {
    console.error("Error in conversation processing:", error);
    c1Response.writeContent(
      "Sorry, I encountered an error processing your request."
    );
  } finally {
    c1Response.end();
  }
}

/**
 * Create streaming response using OpenAI's runTools
 */
async function createStreamingResponse(
  client: OpenAI,
  messages: OpenAI.ChatCompletionMessageParam[],
  messageStore: ReturnType<typeof getMessageStore>
): Promise<ReadableStream<string>> {
  const c1Response = makeC1Response();

  // Start the conversation processing with runTools
  processConversationWithRunTools(
    client,
    messages,
    messageStore,
    c1Response
  ).catch((error) => {
    console.error("Error in conversation processing:", error);
    c1Response.writeContent(
      "Sorry, I encountered an error processing your request."
    );
    c1Response.end();
  });

  return c1Response.responseStream;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const { prompt, threadId } = (await req.json()) as RequestBody;

    // Initialize dependencies
    const client = createThesysClient();
    const messageStore = getMessageStore(threadId);

    // Add user message to conversation
    messageStore.addMessage(prompt);

    // Ensure MCP connection is established
    await ensureMCPConnection();

    // Get conversation history
    const messages = messageStore.getOpenAICompatibleMessageList();

    // Create streaming response with runTools
    const responseStream = await createStreamingResponse(
      client,
      messages,
      messageStore
    );

    return new NextResponse(responseStream, {
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
