import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface DBMessage {
  id: number;
  threadId: number;
  message: string; // Serialized OpenAI message data
  created_at: Date;
  updated_at: Date;
}

export function serializeMessage(
  message: ChatCompletionMessageParam,
  threadId: number
): Omit<DBMessage, "id" | "created_at" | "updated_at"> {
  return {
    threadId,
    message: JSON.stringify(message),
  };
}

export function deserializeMessage(
  dbMessage: DBMessage
): ChatCompletionMessageParam {
  if (!dbMessage.message) {
    throw new Error("Message data is required");
  }

  const message = JSON.parse(dbMessage.message) as ChatCompletionMessageParam;
  return message;
}
