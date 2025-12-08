import { NextRequest } from "next/server";
import OpenAI from "openai";
import {
  addMessages,
  getAIThreadMessages,
  AIMessage,
  UIMessage,
} from "@/src/services/threadService";
import { transformStream } from "@crayonai/stream";
// import { tools } from "./tools"; // Currently commented out in tools.ts
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
// import { JSONSchema } from "openai/lib/jsonschema.mjs";

type ThreadId = string;

export interface MCPTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export class MCPClient {
  private mcp: Client;
  private transport: StreamableHTTPClientTransport | null = null;
  public tools: OpenAI.ChatCompletionTool[] = [];
  private currentServerUrl: string | null = null;

  constructor() {
    this.mcp = new Client({ name: "supabase", version: "1.0.0" });
  }

  async connect(serverUrl: string) {
    try {
      // Reuse existing transport if connecting to the same server
      if (this.transport && this.currentServerUrl === serverUrl) {
        return;
      }

      // Close existing transport if switching servers
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }

      console.log(`Connecting to MCP server at ${serverUrl}...`);

      // Create transport with authentication
      this.transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
        requestInit: {
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          },
        },
      });

      await this.mcp.connect(this.transport);
      this.currentServerUrl = serverUrl;

      // List available tools from the MCP server
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map(
        (tool: {
          name: string;
          description?: string;
          inputSchema: Record<string, unknown>;
        }) => ({
          type: "function" as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
        })
      );

      console.log(
        `Connected to MCP server with ${this.tools.length} tools:`,
        this.tools.map((t) => t.function.name).join(", ")
      );
    } catch (e) {
      console.error("Failed to connect to MCP server:", e);
      throw e;
    }
  }

  async runTool({
    tool_call_id,
    name,
    args,
  }: {
    tool_call_id: string;
    name: string;
    args: Record<string, unknown>;
  }) {
    console.log(`Calling tool ${name} with args: '${JSON.stringify(args)}'`);

    try {
      const result = await this.mcp.callTool({
        name,
        arguments: args,
      });

      console.log(`Tool ${name} result:`, result);

      return {
        tool_call_id,
        role: "tool" as const,
        content: JSON.stringify(result.content),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error calling tool ${name}:`, error);

      return {
        tool_call_id,
        role: "tool" as const,
        content: JSON.stringify({
          error: `Tool call failed: ${errorMessage}`,
        }),
      };
    }
  }

  async disconnect() {
    if (this.mcp) {
      await this.mcp.close();
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.currentServerUrl = null;
  }
}

// Standard OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Thesys Visualize client
const thesysClient = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/visualize",
  apiKey: process.env.THESYS_API_KEY,
});

// Initialize MCP client
const mcpClient = new MCPClient();

const SYSTEM_PROMPT = `You are a friendly and helpful e-commerce assistant specializing in clothing. Your goal is to help users find products, learn about them, and manage their shopping cart. You also have access to Supabase database tools for advanced data operations.

**Your Workflow:**
1.  **Greet & Suggest:** Start the conversation with a warm greeting. You can proactively call the 'listProducts' tool to list all products.
2.  **List Products:** Use the 'listProducts' tool when the user asks for specific types of clothing (e.g., "black t-shirts", "jeans"). Show the summary results including name, ID, price, and imageUrl. Add the imageUrl to the response if it is provided in the tool call response.
3.  **Details & Variants:** When a user expresses interest in a specific product (or asks for details using an ID), *always* use the 'getProductDetails' tool first. Present the full details, including the description, price, imageUrl, and crucially, the *available variants* (sizes, colors, and current stock). Add the imageUrl to the response if it is provided in the tool call response.
4.  **Guide Selection:** Explicitly ask the user to confirm the exact size and color they want from the available variants before proceeding.
5.  **Add to Cart:** Only use the 'addToCart' tool *after* the user confirms the product ID, size, color, and quantity, and you have confirmed availability via 'getProductDetails'.
6.  **Manage Cart:** Use the 'getCart' tool to show the user their current cart contents when asked.
7.  **Database Operations:** Use Supabase tools for advanced data queries, analytics, and database operations when requested.

**Important Notes:**
*   Be clear about product availability (stock levels for variants).
*   Inform users that the only payment method available is **Cash on Delivery**.
*   Your final response is processed by another assistant to generate a user interface (e.g., product lists, forms). Structure your responses clearly for this purpose.
*   If user asks for output in a specific component for example a graph, table, etc, try your best to generate the output in the requested format, so that the other assistant can use it to generate the UI.
*   Use Supabase tools for complex data operations, reporting, and analytics when appropriate.
`;

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

export async function POST(req: NextRequest) {
  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: AIMessage;
    threadId: ThreadId;
    responseId: string;
  };

  try {
    // Ensure MCP connection is established
    await ensureMCPConnection();

    // --- Step 1: Call Standard OpenAI API ---

    const previousAiMessages = await getAIThreadMessages(threadId);

    // Use standard OpenAI completion with MCP tools available
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...previousAiMessages,
        {
          role: "user",
          content: prompt.content!,
        } as ChatCompletionMessageParam,
      ],
      temperature: 0.1,
      tools: mcpClient.tools,
      tool_choice: "auto",
    });

    let finalMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...previousAiMessages,
      { role: "user", content: prompt.content! } as ChatCompletionMessageParam,
      completion.choices[0].message,
    ] as ChatCompletionMessageParam[];

    // Handle tool calls if present
    if (completion.choices[0].message.tool_calls) {
      const toolResults = await Promise.all(
        completion.choices[0].message.tool_calls.map(async (toolCall) => {
          const result = await mcpClient.runTool({
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments),
          });
          return result;
        })
      );

      // Add tool results to messages
      finalMessages = [...finalMessages, ...toolResults];

      // Get final response after tool calls
      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: finalMessages,
        temperature: 0.1,
      });

      finalMessages.push(finalCompletion.choices[0].message);
    }

    // Messages are already prepared above

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
      console.error(
        "No final assistant message content found after OpenAI run."
      );
      return new Response("", { status: 200 });
    }

    console.log(
      "finalAssistantMessageForUI",
      finalAssistantMessageForUI.content
    );

    // --- Step 4: Call Thesys  API and Stream to Client ---
    const thesysStreamRunner = thesysClient.beta.chat.completions.runTools({
      model: "c1/anthropic/claude-sonnet-4/v-20250915",
      messages: [
        ...previousAiMessages,
        {
          role: "user",
          content: prompt.content!,
        } as ChatCompletionMessageParam,
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
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
