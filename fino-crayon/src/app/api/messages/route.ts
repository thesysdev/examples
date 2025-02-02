import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { deserializeMessage } from "@/types/message";
import { Message } from "@crayonai/react-core";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");

    if (!threadId || isNaN(parseInt(threadId))) {
      return NextResponse.json(
        { error: "Valid threadId is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.messages.findMany({
      where: {
        threadId: parseInt(threadId),
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json({
      messages: messages.map((msg) => deserializeMessage(msg)),
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...messageData } = body as Message;

    if (!id) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const messageId = parseInt(id);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400 }
      );
    }

    // Check if message exists
    const existingMessage = await prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Update the message
    const updatedMessage = await prisma.messages.update({
      where: { id: messageId },
      data: {
        message: JSON.stringify(messageData),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(deserializeMessage(updatedMessage));
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
