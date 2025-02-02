import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { deserializeMessage, serializeMessage } from "@/types/message";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { CreateMessage } from "@crayonai/react-core";
import OpenAI from "openai";
import { dataTools } from "./tools";
import { execute_sql, set_budget } from "./executors";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_MESSAGE: ChatCompletionMessageParam = {
  role: "system",
  content:
    "You are Fino, an AI financial advisor. You help users understand their finances, analyze transactions, and provide personalized financial advice. Be concise, professional, and focus on providing actionable insights. You have access to tools to analyze transaction data and set budgets. Use these tools when appropriate to provide data-driven insights.",
};

export async function GET() {
  return NextResponse.json({
    message: "Hello from Fino Crayon API!",
  });
}

function mapCreateMessageToOpenAIMessage(
  message: CreateMessage
): ChatCompletionMessageParam {
  return {
    role: "user",
    content: message.message || "",
  };
}

// Helper function to encode text for SSE
function encodeText(text: string) {
  return `data: ${JSON.stringify({ text })}\n\n`;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolCallResult {
  role: "tool";
  tool_call_id: string;
  content: string;
}

// Execute a tool call and return the result
async function executeToolCalls(
  toolCalls: ToolCall[]
): Promise<ToolCallResult[]> {
  const toolCallResults = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const args = JSON.parse(toolCall.function.arguments);
      switch (toolCall.function.name) {
        case "execute_sql":
          return {
            role: "tool" as const,
            tool_call_id: toolCall.id,
            content: await execute_sql(args),
          };
        case "set_budget":
          return {
            role: "tool" as const,
            tool_call_id: toolCall.id,
            content: await set_budget(args),
          };
        default:
          throw new Error(`Unknown tool: ${toolCall.function.name}`);
      }
    })
  );

  return toolCallResults;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { threadId, ...messageData } = body as CreateMessage & {
      threadId: number;
    };

    if (!threadId || isNaN(threadId)) {
      return NextResponse.json(
        { error: "Valid threadId is required" },
        { status: 400 }
      );
    }

    // Convert Crayon message to OpenAI format
    const openAIUserMessage = mapCreateMessageToOpenAIMessage(messageData);

    // Get all previous messages for context
    const previousMessages = await prisma.messages.findMany({
      where: {
        threadId: threadId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const messageHistory = previousMessages.map((msg) =>
      deserializeMessage(msg)
    );

    // Store the new user message in OpenAI format
    await prisma.messages.create({
      data: serializeMessage(openAIUserMessage, threadId),
    });

    // Create a new ReadableStream for SSE
    const stream = new ReadableStream({
      start: (controller) =>
        streamResponse(
          controller,
          [SYSTEM_MESSAGE, ...messageHistory, openAIUserMessage],
          1
        ),
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

const streamResponse = async (
  controller: ReadableStreamDefaultController,
  messages: ChatCompletionMessageParam[],
  callNumber: number = 1
) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: true,
    tools: dataTools,
  });

  const toolCalls: ToolCall[] = [];

  for await (const chunk of completion) {
    if (chunk.choices[0]?.finish_reason === "tool_calls") {
      const toolCallResults = await executeToolCalls(toolCalls);
      await streamResponse(
        controller,
        [
          ...messages,
          { role: "assistant", tool_calls: toolCalls },
          ...toolCallResults,
        ],
        callNumber + 1
      );
    } else if (chunk.choices[0]?.delta?.tool_calls) {
      // toolcall streaming: https://platform.openai.com/docs/guides/function-calling#streaming
      for (const toolCall of chunk.choices[0].delta.tool_calls) {
        const { index } = toolCall;
        if (!toolCalls[index]) {
          toolCalls[index] = {
            id: toolCall.id!,
            type: "function",
            function: {
              name: toolCall.function?.name || "",
              arguments: toolCall.function?.arguments || "",
            },
          };
        }

        toolCalls[index].function.arguments +=
          toolCall.function?.arguments || "";
      }
    }
    // Handle regular content
    const content = chunk.choices[0]?.delta?.content || "";

    if (content) {
      controller.enqueue(encodeText(content));
    }
  }
  if (callNumber === 1) {
    controller.close();
  }
};
