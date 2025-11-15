import type { ChatCompletionMessageParam } from "openai/resources.mjs";

export type ThreadId = string;
export type StoredMessage = ChatCompletionMessageParam & { id?: string };

// In-memory message store
const messageStore = new Map<ThreadId, StoredMessage[]>();

// Helper functions
function getMessages(threadId: ThreadId): ChatCompletionMessageParam[] {
  const messages = messageStore.get(threadId) || [];
  return messages.map(({ id, ...msg }) => msg); // Remove IDs for LLM
}

function addMessages(threadId: ThreadId, ...msgs: StoredMessage[]) {
  const existing = messageStore.get(threadId) || [];
  messageStore.set(threadId, [...existing, ...msgs]);
}

function getMessageContent(threadId: ThreadId, messageId: string): string {
  const messages = messageStore.get(threadId) || [];
  const message = messages.find((m) => m.id === messageId);
  return message && "content" in message ? (message.content as string) : "";
}

export { messageStore, getMessages, addMessages, getMessageContent };
