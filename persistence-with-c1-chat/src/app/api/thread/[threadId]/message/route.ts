import { NextRequest, NextResponse } from "next/server";
import {
  addMessages,
  updateMessage,
  Message,
} from "@/src/services/threadService";

interface Params {
  threadId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const message = (await request.json()) as Message;
    const { threadId } = await params;
    await addMessages(threadId, message);
    return NextResponse.json({ message: "Message added" }, { status: 200 });
  } catch (error) {
    console.error("Error adding message:", error);
    return NextResponse.json(
      { message: "Error adding message" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const updatedMessage = (await request.json()) as Message;
    const { threadId } = await params;
    await updateMessage(threadId, updatedMessage);
    return NextResponse.json({ message: "Message updated" }, { status: 200 });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { message: "Error updating message" },
      { status: 500 }
    );
  }
}
