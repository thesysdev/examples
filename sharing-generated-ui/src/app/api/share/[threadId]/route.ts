import { NextRequest, NextResponse } from "next/server";
import { getMessageStore } from "@/lib/messageStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;

  if (!threadId) {
    return NextResponse.json(
      { error: "Thread ID is required" },
      { status: 400 }
    );
  }

  const messageStore = getMessageStore(threadId);

  return NextResponse.json(messageStore.messageList);
}
