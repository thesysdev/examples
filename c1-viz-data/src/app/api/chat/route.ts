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

const SYSTEM_PROMPT = `You are a helpful data analyst and business intelligence assistant with access to a live Supabase database. Your goal is to help users query, analyze, and visualize business data from our database.

**CRITICAL: You MUST use the available Supabase tools for ALL data queries. Never provide analysis based on assumed or cached data.**

**Available Data (via Supabase tools):**
- **Products**: Electronics, furniture, appliances with pricing and inventory
- **Customers**: Customer information from various countries
- **Sales**: Transaction history with detailed sales metrics

**Your Workflow (MANDATORY):**
1.  **ALWAYS Query First:** For ANY data request, you MUST use Supabase tools (execute_sql, list_tables) to get current data from the database.
2.  **Never Assume Data:** Do not provide analysis based on training data or assumptions. Always query the live database first.
3.  **Analysis & Insights:** After getting real data, provide meaningful analysis of the actual results.
4.  **Visualization Guidance:** Structure your responses to enable rich visualizations based on the actual data retrieved.

**Database Schema:**
- **products**: id, name, category, price, stock_quantity, created_at
- **customers**: id, name, email, city, country, created_at  
- **sales**: id, product_id, customer_id, quantity, unit_price, total_amount, sale_date

**Response Format:**
1. First, query the database using available tools
2. Then provide:
   - **Summary/Insights**: Key findings from the actual data
   - **Visualization Suggestions**: What charts/graphs would best represent this data
   - **Raw Data**: Include the actual query results for table display

**IMPORTANT:**
- You MUST use execute_sql or other Supabase tools for every data request
- Never provide data analysis without first querying the database
- Always base your response on the actual query results, not assumptions
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

    // Store raw data from tool calls for frontend display
    const rawDataForFrontend: Array<{
      toolName: string;
      args: Record<string, unknown>;
      data: unknown;
    }> = [];

    // --- Step 1: Call Standard OpenAI API ---

    const previousAiMessages = await getAIThreadMessages(threadId);

    // Add instruction to force database queries for data requests
    const userContent =
      typeof prompt.content === "string"
        ? prompt.content
        : JSON.stringify(prompt.content);
    const contentLower = userContent.toLowerCase();
    const enhancedUserContent =
      contentLower.includes("data") ||
      contentLower.includes("product") ||
      contentLower.includes("sale") ||
      contentLower.includes("customer") ||
      contentLower.includes("show") ||
      contentLower.includes("top") ||
      contentLower.includes("list")
        ? `${userContent}\n\nIMPORTANT: You must query the database using the available Supabase tools to get current data. Do not use cached or assumed data.`
        : userContent;

    // Use standard OpenAI completion with MCP tools available
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...previousAiMessages,
        {
          role: "user",
          content: enhancedUserContent,
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

    // Debug: Log the completion message
    console.log(
      "OpenAI completion message:",
      JSON.stringify(completion.choices[0].message, null, 2)
    );
    console.log(
      "Tool calls present:",
      !!completion.choices[0].message.tool_calls
    );
    console.log(
      "Number of tool calls:",
      completion.choices[0].message.tool_calls?.length || 0
    );

    // Handle tool calls if present
    if (completion.choices[0].message.tool_calls) {
      const toolResults = await Promise.all(
        completion.choices[0].message.tool_calls.map(async (toolCall) => {
          const result = await mcpClient.runTool({
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments),
          });

          console.log("Tool result:", result);

          // Extract raw data for frontend display if it's a database query
          try {
            // Handle Supabase MCP response format
            let content = result.content;
            console.log("Raw MCP content:", content);

            // Parse the outer JSON structure first
            try {
              const outerParsed = JSON.parse(content);
              if (
                Array.isArray(outerParsed) &&
                outerParsed[0]?.type === "text"
              ) {
                content = outerParsed[0].text;
                console.log("Extracted text content:", content);
              }
            } catch {
              // Content might already be a string, continue
            }

            // Look for the untrusted-data tags that contain the actual JSON
            const startTag = content.indexOf("<untrusted-data-");
            const endTag = content.indexOf("</untrusted-data-");

            if (startTag !== -1 && endTag !== -1) {
              // Find the end of the opening tag
              const openTagEnd = content.indexOf(">", startTag);
              if (openTagEnd !== -1 && openTagEnd < endTag) {
                const rawJsonData = content
                  .substring(openTagEnd + 1, endTag)
                  .trim();

                console.log("Raw JSON data from untrusted tags:", rawJsonData);

                // The data might have extra text before the JSON array
                // Look for the JSON array start
                const jsonArrayStart = rawJsonData.indexOf("[");
                const jsonArrayEnd = rawJsonData.lastIndexOf("]") + 1;

                if (jsonArrayStart !== -1 && jsonArrayEnd > jsonArrayStart) {
                  const cleanJsonData = rawJsonData
                    .substring(jsonArrayStart, jsonArrayEnd)
                    .trim();

                  console.log("Clean JSON data:", cleanJsonData);

                  // Handle multiple levels of JSON escaping
                  try {
                    // The JSON data is double-escaped, so we need to parse it as a JSON string first
                    let actualData;
                    
                    try {
                      // Try parsing the clean data as a JSON-encoded string
                      actualData = JSON.parse(`"${cleanJsonData}"`);
                      console.log("Parsed as JSON string:", actualData);
                      
                      // Now parse the result as actual JSON
                      actualData = JSON.parse(actualData);
                    } catch {
                      console.log("First parsing attempt failed, trying direct parse");
                      // Fallback: try direct parsing with manual quote replacement
                      const manuallyFixed = cleanJsonData.replace(/\\"/g, '"');
                      actualData = JSON.parse(manuallyFixed);
                    }

                    // If it's still a string, it might be double-encoded JSON
                    if (typeof actualData === "string") {
                      actualData = JSON.parse(actualData);
                    }

                    console.log(
                      "Extracted data from MCP response:",
                      actualData
                    );
                    console.log(
                      "Is array:",
                      Array.isArray(actualData),
                      "Length:",
                      actualData?.length
                    );

                    if (Array.isArray(actualData) && actualData.length > 0) {
                      rawDataForFrontend.push({
                        toolName: toolCall.function.name,
                        args: JSON.parse(toolCall.function.arguments),
                        data: actualData,
                      });
                      console.log(
                        "Added data to rawDataForFrontend. New length:",
                        rawDataForFrontend.length
                      );
                    } else {
                      console.log("Data not added - either not array or empty");
                    }
                  } catch (parseError) {
                    console.error(
                      "Failed to parse clean JSON data:",
                      parseError
                    );
                    console.error(
                      "Clean JSON data that failed:",
                      cleanJsonData
                    );
                  }
                } else {
                  console.log(
                    "Could not find JSON array boundaries in:",
                    rawJsonData
                  );
                }
              }
            } else {
              console.log(
                "No untrusted-data tags found, trying fallback parsing"
              );
              // Fallback: try to parse the entire content as JSON
              try {
                const parsedContent = JSON.parse(content);
                if (Array.isArray(parsedContent) && parsedContent.length > 0) {
                  rawDataForFrontend.push({
                    toolName: toolCall.function.name,
                    args: JSON.parse(toolCall.function.arguments),
                    data: parsedContent,
                  });
                  console.log("Added data via fallback method");
                }
              } catch (fallbackError) {
                console.log("Fallback parsing also failed:", fallbackError);
              }
            }
          } catch (outerError) {
            console.error("Content processing failed:", outerError);
          }

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

    // console.log(
    //   "finalAssistantMessageForUI",
    //   finalAssistantMessageForUI.content
    // );

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

    console.log("rawDataForFrontend before Thesys call:", rawDataForFrontend);

    thesysStreamRunner.on("end", async () => {
      // --- Step 5: Store Final UI Message with Raw Data ---
      const finalUIMessageFromStream =
        allThesysMessages[allThesysMessages.length - 1];

      if (finalUIMessageFromStream) {
        const uiMessageToStore: UIMessage = {
          ...finalUIMessageFromStream,
          id: responseId,
          // Add raw data to the UI message for frontend access
          rawData:
            rawDataForFrontend.length > 0 ? rawDataForFrontend : undefined,
        };
        newUIMessagesToStore.push(uiMessageToStore);
        await addMessages(threadId, newAiMessagesToStore, newUIMessagesToStore);
      }
    });

    const llmStream = await thesysStreamRunner;

    // Transform the stream to include content
    const responseStream = transformStream(llmStream, (chunk) => {
      return chunk.choices[0]?.delta?.content || "";
    });

    // Create a new stream that appends raw data at the end
    const enhancedStream = new ReadableStream({
      start(controller) {
        const reader = (responseStream as ReadableStream).getReader();

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Send raw data as the final chunk if available
                if (rawDataForFrontend.length > 0) {
                  const dataChunk = `\n\n__RAW_DATA__${JSON.stringify(
                    rawDataForFrontend
                  )}__END_RAW_DATA__`;
                  controller.enqueue(new TextEncoder().encode(dataChunk));
                }
                controller.close();
                break;
              }

              // Forward the chunk
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        };

        pump();
      },
    });

    return new Response(enhancedStream, {
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
