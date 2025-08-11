import { NextRequest, NextResponse } from "next/server";
import { getMessageStore } from "@/lib/messageStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string; messageId: string }> }
) {
  const { threadId, messageId } = await params;

  if (!threadId || !messageId) {
    return NextResponse.json(
      { error: "Thread ID & Message ID are required" },
      { status: 400 }
    );
  }

  const messageStore = getMessageStore(threadId);
  const message = messageStore.messageList.find((m) => m.id === messageId);
  return NextResponse.json({ message: message ?? null });
}
