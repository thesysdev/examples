import type { Message } from "@crayonai/react-core";

export interface DBMessage {
  id: number;
  threadId: number;
  message: string; // Serialized Message data
  created_at: Date;
  updated_at: Date;
}

export function serializeMessage(
  message: Message,
  threadId: number
): Omit<DBMessage, "id" | "created_at" | "updated_at"> {
  return {
    threadId,
    message: JSON.stringify(message),
  };
}

export function deserializeMessage(dbMessage: DBMessage): Message {
  if (!dbMessage.message) {
    throw new Error("Message data is required");
  }

  const message = JSON.parse(dbMessage.message) as Message;
  return {
    ...message,
    id: dbMessage.id.toString(),
  };
}
