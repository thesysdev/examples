import { NextRequest, NextResponse } from "next/server";
import { getMessageStore, MastraMessage } from "./messageStore";
import { mastra } from "../../../server";

export async function POST(req: NextRequest) {
  const { prompt, threadId } = (await req.json()) as {
    prompt: { content: string };
    threadId: string;
  };
  const messageStore = getMessageStore(threadId);
  const agent = mastra.getAgent("weatherAgent");

  // Prepare messages including history and current user message
  const userMessage = {
    id: crypto.randomUUID(),
    role: "user" as const,
    content: prompt.content,
    createdAt: new Date(),
  };
  const messages = [
    ...messageStore.getMastraCompatibleMessageList(),
    userMessage,
  ];

  // Add the user message to the store first
  messageStore.addMessage(userMessage);

  // Use streaming for the response
  const stream = await agent.streamVNext(messages);

  // Create a readable stream that processes the agent stream
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = "";

        for await (const chunk of stream.fullStream) {
          if (chunk.type === "text-delta") {
            const text = chunk.payload.text;
            if (text) {
              fullContent += text;
              // Send the text chunk to the client
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        }

        // After streaming is complete, save the assistant message
        const assistantMessage: MastraMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullContent,
          createdAt: new Date(),
        };
        messageStore.addMessage(assistantMessage);

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
