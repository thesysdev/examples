import Anthropic from "@anthropic-ai/sdk";
import {
  MessageParam as AnthropicMessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Message } from "@crayonai/react-core";
import {
  templatesToResponseFormat,
  toAnthropicAIMessages,
  crayonStream,
} from "@crayonai/stream";
import { PersonProps } from "../../../types/person";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}
if (!TAVILY_API_KEY) {
  throw new Error("TAVILY_API_KEY is not set");
}

const schema = templatesToResponseFormat({
  schema: PersonProps,
  name: "person",
  description: "Use this template to display a person's information.",
});

const SYSTEM_PROMPT = `
You’re a search AI that can answer questions and let users browse the web.
Always use tavily search when answering questions related to a person.
Based on what the user asks output a JSON object that matches the schema described below.

Either call a tool or output a JSON object that matches the schema described below.
If you're returning a reponse, your response must begin with
{
  "response": [...]
}

<schema>
${JSON.stringify(schema.json_schema)}
</schema>

CRITICAL INSTRUCTION:
- DO NOT INCLUDE any text before or after the JSON object.
- ALWAYS output the JSON object with the key "response".
`;

export class MCPClient {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private anthropic: Anthropic;
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({ name: "cryon-mcp-client", version: "1.0.0" });
  }

  async connect() {
    try {
      if (process.platform === "win32") {
        throw new Error("Not tested on windows");
      }
      const command = "pnpx";
      const args = ["tavily-mcp@0.1.3"];
      const env = {
        ...process.env,
        TAVILY_API_KEY: TAVILY_API_KEY!,
      } as Record<string, string>;

      this.transport = new StdioClientTransport({
        command,
        args,
        env,
      });
      this.mcp.connect(this.transport);

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });
    } catch (e) {
      console.error("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async callTool(toolUse: ToolUseBlock) {
    console.debug("Calling tool", toolUse.name);
    const result = await this.mcp.callTool({
      name: toolUse.name,
      arguments: toolUse.input as { [x: string]: unknown } | undefined,
    });
    console.debug("Tool result", JSON.stringify(result));
    return result;
  }

  async processQuery(uiMessages: Message[]) {
    const messages: AnthropicMessageParam[] = toAnthropicAIMessages(uiMessages);
    const { stream, onText, onEnd, onError, onLLMEnd } = crayonStream();

    const streamResponseWithToolCalls = async (
      messages: AnthropicMessageParam[]
    ): Promise<void> => {
      console.debug("Calling LLM");
      const stream = this.anthropic.messages
        .stream({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 1000,
          messages: [
            {
              role: "assistant",
              content: SYSTEM_PROMPT,
            },
            ...messages,
          ],
          tools: this.tools,
        })
        .on("text", onText)
        .on("error", onError)
        .on("end", onLLMEnd);

      const message = await stream.finalMessage();
      messages.push({
        role: message.role,
        content: message.content,
      });
      const toolCallResults: ToolResultBlockParam[] = [];
      await Promise.all(
        message.content.map(async (content) => {
          if (content.type === "tool_use") {
            const result = await this.callTool(content);
            toolCallResults.push({
              tool_use_id: content.id,
              type: "tool_result",
              content: JSON.stringify(result.content),
            });
          }
        })
      );
      if (toolCallResults.length > 0) {
        messages.push({
          role: "user",
          content: toolCallResults,
        });
        await streamResponseWithToolCalls(messages);
        return;
      }
      // If there are no tool calls, we can end the stream
      onEnd();
    };

    streamResponseWithToolCalls(messages);
    return stream;
  }
}
