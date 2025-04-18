import { NextRequest, NextResponse } from "next/server";
import { getUIThreadMessages } from "@/src/services/threadService";

interface Params {
  threadId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { threadId } = await params;
    const messages = await getUIThreadMessages(threadId);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Error fetching UI messages:", error);
    return NextResponse.json(
      { message: "Error fetching UI messages" },
      { status: 500 }
    );
  }
}
