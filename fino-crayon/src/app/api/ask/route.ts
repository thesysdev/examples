import { NextResponse } from "next/server";
import { UserMessage } from "@crayonai/react-core";
import prisma from "@/lib/db";
import { deserializeMessage } from "@/types/message";

export async function GET() {
  return NextResponse.json({
    message: "Hello from Fino Crayon API!",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { threadId, ...messageData } = body as Omit<UserMessage, "id"> & {
      threadId: number;
    };

    if (!threadId || isNaN(threadId)) {
      return NextResponse.json(
        { error: "Valid threadId is required" },
        { status: 400 }
      );
    }

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

    // Store the new message
    const newMessage = await prisma.messages.create({
      data: {
        threadId,
        message: JSON.stringify(messageData),
      },
    });

    // TODO: Send messageHistory + new message to OpenAI
    // The messageHistory array contains all previous messages in chronological order
    // You can now use this to construct the OpenAI request

    return NextResponse.json({
      message: "Received your message!",
      data: deserializeMessage(newMessage),
      history: messageHistory,
    });
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
