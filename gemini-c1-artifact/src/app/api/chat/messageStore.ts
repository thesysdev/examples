export type ThreadId = string;

export interface StoredMessage {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

// In-memory message store (use a database in production)
export const messageStore = new Map<ThreadId, StoredMessage[]>();

export function getMessages(threadId: ThreadId): StoredMessage[] {
  return messageStore.get(threadId) || [];
}

export function addMessages(
  threadId: ThreadId,
  ...messages: StoredMessage[]
): void {
  const existing = messageStore.get(threadId) || [];
  messageStore.set(threadId, [...existing, ...messages]);
}

export function getMessageContent(
  threadId: ThreadId,
  messageId: string
): string | null {
  const messages = messageStore.get(threadId) || [];
  const message = messages.find((m) => m.id === messageId);
  return message?.content || null;
}

export function initThread(threadId: ThreadId, systemPrompt: string): void {
  if (!messageStore.has(threadId)) {
    messageStore.set(threadId, [
      { id: "system", role: "system", content: systemPrompt },
    ]);
  }
}
