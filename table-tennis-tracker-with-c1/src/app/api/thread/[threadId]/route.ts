import { deleteThread, updateThread } from "@/src/services/threadService";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { threadId: string } },
) {
  const { threadId } = await params;
  await deleteThread(threadId);
  return NextResponse.json({ message: "Thread deleted successfully" });
}

export async function PUT(request: NextRequest) {
  const thread = await request.json();
  const updatedThread = await updateThread(thread);
  return NextResponse.json(updatedThread);
}
