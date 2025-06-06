import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DBMessage, getMessageStore } from "./messageStore";
import { MCPClient } from "./mcp";
import { makeC1Response } from "@thesysai/genui-sdk/server";

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
 * Accumulate tool calls from streaming chunks
 */
function accumulateToolCall(
  toolCalls: OpenAI.ChatCompletionMessageToolCall[],
  toolCall: OpenAI.ChatCompletionChunk.Choice.Delta.ToolCall
): void {
  if (toolCall.index === undefined) return;

  // Initialize tool call if it doesn't exist
  if (!toolCalls[toolCall.index]) {
    toolCalls[toolCall.index] = {
      id: toolCall.id || "",
      type: "function",
      function: { name: "", arguments: "" },
    };
  }

  const existingCall = toolCalls[toolCall.index];

  // Accumulate function name
  if (toolCall.function?.name) {
    existingCall.function.name += toolCall.function.name;
  }

  // Accumulate function arguments
  if (toolCall.function?.arguments) {
    existingCall.function.arguments += toolCall.function.arguments;
  }

  // Update ID if provided
  if (toolCall.id) {
    existingCall.id = toolCall.id;
  }
}

/**
 * Process the conversation with iterative tool calling and streaming
 */
async function processConversationWithTools(
  client: OpenAI,
  initialMessages: OpenAI.ChatCompletionMessageParam[],
  messageStore: ReturnType<typeof getMessageStore>,
  baseResponseId: string,
  c1Response: ReturnType<typeof makeC1Response>,
  maxRounds: number = 5
): Promise<void> {
  const currentMessages = [...initialMessages];
  let round = 0;

  while (round < maxRounds) {
    round++;
    console.log(`Starting conversation round ${round}`);

    // Add thinking state for initial processing
    if (round === 1) {
      c1Response.writeThinkItem({
        title: "Processing your request...",
        description:
          "Analyzing your message and determining the best approach.",
      });
    }

    // Create streaming completion
    const llmStream = await client.chat.completions.create({
      model: "c1-nightly",
      messages: currentMessages,
      tools: mcpClient.tools.length > 0 ? mcpClient.tools : undefined,
      stream: true,
    });

    let assistantContent = "";
    const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];

    // Process the streaming response
    for await (const chunk of llmStream) {
      // Handle content streaming
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        assistantContent += content;
        c1Response.writeContent(content); // Stream content to C1 response
      }

      // Accumulate tool calls
      if (chunk.choices[0]?.delta?.tool_calls) {
        chunk.choices[0].delta.tool_calls.forEach((toolCall) => {
          accumulateToolCall(toolCalls, toolCall);
        });
      }
    }

    if (toolCalls.length > 0) {
      console.log(
        `Round ${round}: AI making ${toolCalls.length} tool call(s):`,
        toolCalls.map((tc) => tc.function.name).join(", ")
      );

      // Add thinking state for tool execution
      const toolNames = toolCalls.map((tc) => tc.function.name).join(", ");
      c1Response.writeThinkItem({
        title: `Using ${toolCalls.length > 1 ? "tools" : "tool"}: ${toolNames}`,
        description:
          "Executing external tools to gather the information you need.",
      });

      // Add assistant message with tool calls to message store
      const assistantMessage = {
        role: "assistant" as const,
        content: assistantContent,
        tool_calls: toolCalls,
      };
      messageStore.addMessage(assistantMessage);
      currentMessages.push({
        role: "assistant",
        content: assistantContent,
        tool_calls: toolCalls,
      });

      try {
        // Execute tool calls
        const toolResults = await mcpClient.runTools(toolCalls);

        // Add tool results to message store and current messages
        toolResults.forEach((result) => {
          messageStore.addMessage(result);
          currentMessages.push(result);
        });

        // Add thinking state for processing results
        if (round < maxRounds) {
          c1Response.writeThinkItem({
            title: "Processing results...",
            description:
              "Analyzing the information gathered from tools to provide you with a comprehensive response.",
          });
        }

        // Continue to next round for follow-up response
        continue;
      } catch (error) {
        console.error(`Error executing tools in round ${round}:`, error);
        c1Response.writeContent(
          "\n\nI encountered an error while using tools, but here's what I found so far."
        );
        break;
      }
    } else {
      // No tool calls, this is the final response
      console.log(`Round ${round}: Final response (no tool calls)`);

      // Add final message to store
      messageStore.addMessage({
        role: "assistant",
        content: assistantContent,
      });

      break;
    }
  }

  if (round >= maxRounds) {
    console.warn(`Reached maximum rounds (${maxRounds}). Ending conversation.`);
    c1Response.writeContent(
      "\n\n(Reached maximum tool usage limit for this conversation)"
    );
  }

  c1Response.end(); // End the C1 response stream
}

/**
 * Create streaming response with tool call detection and execution
 */
async function createStreamingResponse(
  client: OpenAI,
  messages: OpenAI.ChatCompletionMessageParam[],
  messageStore: ReturnType<typeof getMessageStore>,
  responseId: string
): Promise<ReadableStream<string>> {
  const c1Response = makeC1Response();

  // Start the conversation processing
  processConversationWithTools(
    client,
    messages,
    messageStore,
    responseId,
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
    const { prompt, threadId, responseId } = (await req.json()) as RequestBody;

    // Initialize dependencies
    const client = createThesysClient();
    const messageStore = getMessageStore(threadId);

    // Add user message to conversation
    messageStore.addMessage(prompt);

    // Ensure MCP connection is established
    await ensureMCPConnection();

    // Get conversation history
    const messages = messageStore.getOpenAICompatibleMessageList();

    // Create streaming response with tool support and thinking states
    const responseStream = await createStreamingResponse(
      client,
      messages,
      messageStore,
      responseId
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
