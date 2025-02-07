import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { deserializeMessage, serializeMessage } from "@/types/message";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { CreateMessage } from "@crayonai/react-core";
import OpenAI from "openai";
import {
  BudgetArgsSchema,
  execute_sql,
  set_budget,
  SQLArgsSchema,
} from "./executors";
import { TemplatesJsonSchema } from "@/types/responseTemplates/templates";
import zodToJsonSchema from "zod-to-json-schema";
import { CrayonDataStreamTransformer } from "./util";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const SYSTEM_MESSAGE: ChatCompletionMessageParam = {
  role: "system",
  content:
    "You are Fino, an AI financial advisor. " +
    "You help users understand their finances, analyze transactions, and provide personalized financial advice. " +
    "Be concise, professional, and focus on providing actionable insights. " +
    "IMPORTANT: Your response must ALWAYS follow this structure:\n" +
    "1. Start with an explanatory text string in the response array\n" +
    "2. Follow with the appropriate template object\n" +
    "3. End with additional insights or recommendations as text string\n" +
    "You have access to tools to analyze transaction data and set budgets. " +
    "Use these tools when appropriate to provide data-driven insights. " +
    "Always respond with a single JSON object containing a 'response' array which contains string or template object " +
    "Example response structure:\n" +
    '{"response": [\n' +
    '  "Let me analyze your expenses for you.",\n' +
    '  {"name": "breakdown_expenses", "templateProps": {...},\n' +
    '  "Based on this breakdown, your highest spending is in Food category. Consider setting a budget to reduce these expenses."\n' +
    "]}\n" +
    "Available templates and their uses:\n" +
    "- breakdown_expenses: Use for summarizing financial situation with expenses by category\n" +
    "- user_consent: Always use when asking for budget-related permissions\n" +
    "- trends: Use for showing financial patterns over time\n" +
    "- breakdown_2d: Use for multi-dimensional analysis (e.g., expenses by category and month)\n",
};

export async function GET() {
  return NextResponse.json({
    message: "Hello from Fino Crayon API!",
  });
}

function mapCreateMessageToOpenAIMessage(
  message: CreateMessage
): ChatCompletionMessageParam {
  if (message.role === "user" && typeof message.message === "string") {
    return {
      role: "user",
      content: message.message,
    };
  }

  throw new Error("Invalid message");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const threadId = +body.threadId;
    delete body.threadId;
    const messageData = body;

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

    // Create a new ReadableStream for SSE
    const stream = streamResponse(openAIUserMessage, messageHistory, threadId);

    // Return the stream with appropriate headers
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
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

const streamResponse = (
  userMessage: ChatCompletionMessageParam,
  historicalMessages: ChatCompletionMessageParam[],
  threadId: number
) => {
  // structured streaming logic
  // on "content" and on "end" are the 2 triggers that are used to stream data
  // response_format: { response: (string | templateObject)[] }
  //
  // best effort parse previously streamed content and current streamed content
  // 1. if the response array length is same for previous streamed content and current streamed content, then we assume text or template is still being streamed
  //     case 1: the last item is a string, then we stream the delta of the string.
  //     case 2: the last item is a template, then we ignore it for now, since it can be a partial template
  // 2. if the response array length is changed:
  //     case 1: the last item in the previous parsed content is a template, then we stream template part since it is complete
  //     case 2: the last item in the currently parsed content is a string, then we stream that string.
  // 3. when the stream ends, we parse the entire streamed content:
  //     case 1: the last item in the parsed content is a template, then we stream that template
  //     case 2: the last item in the parsed content is a string, then we ignore it since it is already streamed in step 1.

  const completion = openai.beta.chat.completions.runTools({
    model: "gpt-4o",
    messages: [SYSTEM_MESSAGE, ...historicalMessages, userMessage],
    temperature: 0.5,
    max_tokens: 1000,
    stream: true,
    tools: [
      {
        type: "function",
        function: {
          function: execute_sql,
          description:
            "Execute SQL lite queries on the Transaction table. \n" +
            `id              Int      @id @default(autoincrement())
              date            DateTime
              amount          Float
              balance         Float
              category        String
              transaction_type "credit" | "debit"`
              .split("\n")
              .map((line) => line.trim())
              .join("\n"),
          parameters: zodToJsonSchema(SQLArgsSchema) as object,
          parse: (params: string) => {
            return SQLArgsSchema.parse(JSON.parse(params));
          },
          strict: true,
        },
      },
      {
        type: "function",
        function: {
          function: set_budget,
          description: "Set a budget for a category.",
          parameters: zodToJsonSchema(BudgetArgsSchema) as object,
          parse: (params: string) => {
            return BudgetArgsSchema.parse(JSON.parse(params));
          },
          strict: true,
        },
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "json_schema",
        schema: TemplatesJsonSchema,
      },
    },
  });

  const onFinish = async () => {
    const result = completion
      .allChatCompletions()
      .flatMap((c) => {
        return c.choices.map((c) => {
          if (!c.message.tool_calls?.length) {
            delete c.message.tool_calls;
          }

          return c.message;
        });
      })
      .filter((message) => !message.tool_calls);

    const messagesToStore = [userMessage, ...result];

    await prisma.messages.createMany({
      data: messagesToStore.map((msg) => serializeMessage(msg, threadId)),
    });
  };
  return completion
    .toReadableStream()
    .pipeThrough(new CrayonDataStreamTransformer({ onFinish: onFinish }));
};
