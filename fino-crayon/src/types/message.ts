import { Message } from "@crayonai/react-core";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import invariant from "tiny-invariant";

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

export function toCrayonMessage(dbMessage: DBMessage): Message {
  const message = deserializeMessage(dbMessage);

  invariant(
    message.role === "user" || message.role === "assistant",
    "Invalid message role"
  );

  if (message.role === "user") {
    return {
      id: dbMessage.id.toString(),
      role: "user",
      type: "prompt",
      message: message.content as string,
    };
  }

  const msg = JSON.parse(message.content as string).response;
  return {
    id: dbMessage.id.toString(),
    role: message.role,
    message: msg.type === "text" ? msg.text : msg,
  };
}
