import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { transformStream } from "@crayonai/stream";
import { DBMessage, getMessageStore } from "./messageStore";
import { tableTools, executeTool } from "../../../lib/tableTools";

const SYSTEM_PROMPT = `You are a helpful assistant that manages a data table. 

At the start of every conversation, you MUST first call view_table to fetch and display the current table data.

You can only:
1. View the table using view_table
2. Update rows using update_row (by ID, you can change name, email, or status)

Only use the EditableTable component to display the table data.
When updating, confirm what was changed and show the updated row.`;

export async function POST(req: NextRequest) {
  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: DBMessage;
    threadId: string;
    responseId: string;
  };
  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed/",
    apiKey: process.env.THESYS_API_KEY,
  });
  const messageStore = getMessageStore(threadId);

  messageStore.addMessage(prompt);

  // Get messages and prepend system prompt
  let messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messageStore.getOpenAICompatibleMessageList(),
  ];

  // First, make a non-streaming call to check for tool calls
  let response = await client.chat.completions.create({
    model: "c1/openai/gpt-5/v-20251130",
    messages,
    tools: tableTools,
    metadata: {
      thesys: JSON.stringify({
        c1_included_components: ["EditableTable"],
      }),
    },
  });

  // Handle tool calls in a loop until we get a final response
  while (response.choices[0]?.message?.tool_calls) {
    const toolCalls = response.choices[0].message.tool_calls;

    // Add assistant message with tool calls to messages
    messages = [
      ...messages,
      {
        role: "assistant" as const,
        content: response.choices[0].message.content,
        tool_calls: toolCalls,
      },
    ];

    // Execute each tool and add results
    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = executeTool(toolCall.function.name, args);

      messages = [
        ...messages,
        {
          role: "tool" as const,
          tool_call_id: toolCall.id,
          content: result,
        },
      ];
    }

    // Make another call with tool results
    response = await client.chat.completions.create({
      model: "c1/openai/gpt-5/v-20251130",
      messages,
      tools: tableTools,
      metadata: {
        thesys: JSON.stringify({
          c1_included_components: ["EditableTable"],
        }),
      },
    });
  }

  // Now stream the final response
  const llmStream = await client.chat.completions.create({
    model: "c1/openai/gpt-5/v-20251130",
    messages,
    stream: true,
    metadata: {
      thesys: JSON.stringify({
        c1_included_components: ["EditableTable"],
      }),
    },
  });

  const responseStream = transformStream(
    llmStream,
    (chunk) => {
      return chunk.choices?.[0]?.delta?.content ?? "";
    },
    {
      onEnd: ({ accumulated }) => {
        const message = accumulated.filter((message) => message).join("");
        messageStore.addMessage({
          role: "assistant",
          content: message,
          id: responseId,
        });
      },
    },
  ) as ReadableStream<string>;

  return new NextResponse(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
