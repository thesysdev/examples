import { NextRequest, NextResponse } from "next/server";
import { createThread } from "@/src/services/threadService";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    const newThread = await createThread(name);
    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error("Error creating thread:", error);
    // Consider more specific error handling based on error type
    return NextResponse.json(
      { message: "Error creating thread" },
      { status: 500 }
    );
  }
}
