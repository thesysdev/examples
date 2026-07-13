/**
 * In-memory message store for conversation threads.
 *
 * NOTE: This is for demonstration purposes only. In production,
 * use a persistent database (PostgreSQL, Redis, etc.) to store messages.
 */

/** Unique identifier for a conversation thread */
export type ThreadId = string;

/** A message stored in the conversation history */
export interface StoredMessage {
  /** Unique identifier for this message */
  id: string;
  /** The role of the message sender */
  role: "system" | "user" | "assistant" | "tool";
  /** The text content of the message */
  content: string;
  /** C1 artifact markup (stored separately from text content) */
  artifactContent?: string;
}

// In-memory stores - these reset on server restart
const messageStore = new Map<ThreadId, StoredMessage[]>();
const artifactStore = new Map<string, string>();

/**
 * Retrieves all messages for a given thread.
 * @param threadId - The unique identifier of the conversation thread
 * @returns Array of stored messages, or empty array if thread doesn't exist
 */
export function getMessages(threadId: ThreadId): StoredMessage[] {
  return messageStore.get(threadId) || [];
}

/**
 * Adds one or more messages to a thread's history.
 * Also indexes any artifact content for quick lookup during edits.
 * @param threadId - The unique identifier of the conversation thread
 * @param messages - The messages to add to the thread
 */
export function addMessages(
  threadId: ThreadId,
  ...messages: StoredMessage[]
): void {
  const existing = messageStore.get(threadId) || [];

  // Index artifact content by message ID for quick lookup during edits
  for (const msg of messages) {
    if (msg.artifactContent) {
      artifactStore.set(msg.id, msg.artifactContent);
    }
  }

  messageStore.set(threadId, [...existing, ...messages]);
}

/**
 * Retrieves artifact content by message ID.
 * Used when editing an existing artifact to get its previous content.
 * @param messageId - The ID of the message containing the artifact
 * @returns The artifact markup content, or null if not found
 */
export function getArtifactContent(messageId: string): string | null {
  return artifactStore.get(messageId) || null;
}

/**
 * Initializes a new conversation thread with a system prompt.
 * Does nothing if the thread already exists.
 * @param threadId - The unique identifier for the new thread
 * @param systemPrompt - The system prompt to initialize the conversation with
 */
export function initThread(threadId: ThreadId, systemPrompt: string): void {
  if (!messageStore.has(threadId)) {
    messageStore.set(threadId, [
      { id: "system", role: "system", content: systemPrompt },
    ]);
  }
}
