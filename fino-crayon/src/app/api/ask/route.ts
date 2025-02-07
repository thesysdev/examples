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
import { parse } from "best-effort-json-parser";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function escapeString(s: string) {
  return s.replaceAll('"', '\\"').replaceAll("\n", "\\n");
}

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
    "Always respond with a single JSON object containing a 'response' array which contains text or template object " +
    "Example response structure:\n" +
    '{"response": [\n' +
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

function encodeTextPartForSSE(text: string) {
  return `0:${escapeString(text)}\n`;
}

function encodeResponseTemplateForSSE(template: object) {
  return `1:${escapeString(JSON.stringify(template))}\n`;
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
    const stream = new ReadableStream({
      start: (controller) =>
        streamResponse(controller, openAIUserMessage, messageHistory, threadId),
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
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

const streamResponse = async (
  controller: ReadableStreamDefaultController,
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

  let streamedContent = "";

  const completion = openai.beta.chat.completions
    .runTools({
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
    })
    .on("content", (content) => {
      const previousParsed = parse(streamedContent);
      streamedContent += content;
      const parsed = parse(streamedContent);

      if (previousParsed.response && parsed.response) {
        if (previousParsed.response.length === parsed.response.length) {
          const newContent = parsed.response.pop();
          const lastContent = previousParsed.response.pop();
          if (newContent.type === "text" && newContent.text) {

            const textPart = newContent.text.substring(lastContent.text.length);
            if (textPart.length > 0) {
              console.log("newContent", textPart);

              controller.enqueue(encodeTextPartForSSE(textPart));
            }
          }
        } else {

          const lastTemplate = previousParsed.response.pop();
          if (typeof lastTemplate === "object" && lastTemplate.type !== "text") {
            console.log("lastTemplate in else", lastTemplate);
            controller.enqueue(encodeResponseTemplateForSSE(lastTemplate));
          }

          const newContent = parsed.response.pop();

          if (newContent.type === "text" && newContent.text) {
            console.log("newContent in else", newContent);
            controller.enqueue(encodeTextPartForSSE(newContent.text));
          }

          return;
        }
      }
    })
    .on("end", async () => {
      console.log("streamedContent", streamedContent);
      const parsed = parse(streamedContent);
      if (
        parsed.response &&
        parsed.response[parsed.response.length - 1].type !== "text"
      ) {
        const lastTemplate = parsed.response.pop();
        controller.enqueue(encodeResponseTemplateForSSE(lastTemplate));
      }
      // store messages when the stream ends
      const result = (await completion.allChatCompletions())
        .flatMap((c) => {
          return c.choices.map((c) => {
            if (!c.message.tool_calls?.length) {
              delete c.message.tool_calls;
            }

            return c.message;
          });
        })
        .filter((message) => {
          if (message.tool_calls?.length) {
            console.log(JSON.stringify(message.tool_calls, null, 2));
          }
          // filter out messages which have tool calls
          // tool calls are not required to be stored
          return !message.tool_calls;
        });

      const messagesToStore = [userMessage, ...result];

      await prisma.messages.createMany({
        data: messagesToStore.map((msg) => serializeMessage(msg, threadId)),
      });

      controller.close();
    });
};
