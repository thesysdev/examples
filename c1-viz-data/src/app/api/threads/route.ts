import { NextResponse } from "next/server";
import { getThreadList } from "../../../services/threadService";

export async function GET() {
  try {
    const threads = await getThreadList();
    return NextResponse.json(threads);
  } catch (error) {
    console.error("Error fetching thread list:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
