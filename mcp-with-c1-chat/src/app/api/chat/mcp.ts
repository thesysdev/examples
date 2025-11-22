import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import OpenAI from "openai";

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

      // Create transport without authentication
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
