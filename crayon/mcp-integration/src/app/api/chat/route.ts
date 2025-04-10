import { NextRequest, NextResponse } from "next/server";
import { Message } from "@crayonai/react-core";
import { MCPClient } from "./mcp";

const mcpClient = new MCPClient();
await mcpClient.connect();

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: Message[] };
  const response = await mcpClient.processQuery(messages);
  return new NextResponse(response as unknown as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
