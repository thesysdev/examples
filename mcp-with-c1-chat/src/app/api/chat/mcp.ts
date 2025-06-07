import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";

export interface MCPTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export class MCPClient {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  public tools: OpenAI.ChatCompletionTool[] = [];

  constructor() {
    this.mcp = new Client({ name: "c1-chat-mcp-client", version: "1.0.0" });
  }

  async connect() {
    try {
      if (process.platform === "win32") {
        throw new Error("Windows platform not fully tested");
      }

      // Connect to filesystem MCP server (no authentication required)
      const command = "pnpx";
      const args = [
        "@modelcontextprotocol/server-filesystem@latest",
        process.cwd(),
      ];

      console.log("Connecting to filesystem MCP server...");

      this.transport = new StdioClientTransport({
        command,
        args,
      });

      await this.mcp.connect(this.transport);

      // List available tools from the MCP server
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));

      console.log(
        `Connected to filesystem MCP server with ${this.tools.length} tools:`,
        this.tools.map((t) => t.function.name).join(", ")
      );
    } catch (e) {
      console.error("Failed to connect to MCP server:", e);
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
    if (this.transport) {
      await this.transport.close();
    }
  }
}
