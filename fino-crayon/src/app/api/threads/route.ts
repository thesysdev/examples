import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Thread as CrayonThread } from "@crayonai/react-core";
import { serializeThread, deserializeThread, Thread } from "@/types/thread";

// List threads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status") || "active";

    const threads = await prisma.thread.findMany({
      where: { status },
      take: limit,
      skip: offset,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      threads: threads.map((thread) =>
        deserializeThread({
          ...thread,
          status: thread.status as Thread["status"],
        })
      ),
      total: await prisma.thread.count({ where: { status } }),
    });
  } catch (error) {
    console.error("Failed to fetch threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

// Create thread
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const threadData = body as CrayonThread;

    const serialized = serializeThread(threadData);
    const thread = await prisma.thread.create({
      data: serialized,
    });

    return NextResponse.json(
      deserializeThread({
        ...thread,
        status: thread.status as Thread["status"],
      })
    );
  } catch (error) {
    console.error("Failed to create thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

// Update thread
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const threadData = body as CrayonThread;
    const threadId = parseInt(threadData.threadId);

    if (isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const serialized = serializeThread(threadData);
    const thread = await prisma.thread.update({
      where: { id: threadId },
      data: {
        ...serialized,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      deserializeThread({
        ...thread,
        status: thread.status as Thread["status"],
      })
    );
  } catch (error) {
    console.error("Failed to update thread:", error);
    return NextResponse.json(
      { error: "Failed to update thread" },
      { status: 500 }
    );
  }
}

// Delete thread (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = parseInt(searchParams.get("id") || "");

    if (isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const thread = await prisma.thread.update({
      where: { id: threadId },
      data: { status: "deleted" as const },
    });

    return NextResponse.json(
      deserializeThread({
        ...thread,
        status: thread.status as Thread["status"],
      })
    );
  } catch (error) {
    console.error("Failed to delete thread:", error);
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    );
  }
}
