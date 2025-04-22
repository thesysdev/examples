import { PrismaClient, Prisma } from "../generated/prisma";
import { Thread } from "@crayonai/react-core";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";

const prisma = new PrismaClient();

// AIMessage stores the raw message from OpenAI including tool calls
export type AIMessage = ChatCompletionMessageParam & {
  id: string;
};

// UIMessage stores the message sent by Thesys Visualize API
export type UIMessage = ChatCompletionMessageParam & {
  id: string;
};

export type Message = AIMessage | UIMessage;

// Function 1: Create Thread
export const createThread = async (name: string): Promise<Thread> => {
  const newThread = await prisma.thread.create({
    data: {
      name: name,
      aiMessages: [], // Initialize aiMessages
      uiMessages: [], // Initialize uiMessages
    },
  });

  return {
    threadId: newThread.id,
    title: newThread.name,
    createdAt: newThread.createdAt,
  };
};

export const getThreadList = async (): Promise<Thread[]> => {
  const threads = await prisma.thread.findMany();
  return threads.map((thread) => ({
    threadId: thread.id,
    title: thread.name,
    createdAt: thread.createdAt,
  }));
};

// Add raw AI messages (including user prompts, assistant responses, tool calls)
export const addMessages = async (threadId: string, aiMessages: AIMessage[], uiMessages: UIMessage[]) => {
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
    select: { aiMessages: true, uiMessages: true },
  });

  const aiNewMessages = ((thread.aiMessages as unknown as AIMessage[]) ?? []).concat(
    aiMessages
  );

  const uiNewMessages = ((thread.uiMessages as unknown as UIMessage[]) ?? []).concat(
    uiMessages
  );

  await prisma.thread.update({
    where: { id: threadId },
    data: { aiMessages: aiNewMessages as unknown as Prisma.InputJsonValue, uiMessages: uiNewMessages as unknown as Prisma.InputJsonValue },
  });
};



export const getUIThreadMessages = async (
  threadId: string
): Promise<UIMessage[]> => {
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
    select: { uiMessages: true }, // Select uiMessages
  });

  // Directly return uiMessages, filtering is no longer needed here
  const messages = (thread.uiMessages as unknown as UIMessage[]) ?? [];
  return messages;
};

// Renamed from getLLMThreadMessages
export const getAIThreadMessages = async (
  threadId: string
): Promise<ChatCompletionMessageParam[]> => {
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
    select: { aiMessages: true }, // Select aiMessages
  });

  const messages = (thread.aiMessages as unknown as AIMessage[]) ?? [];

  // Strip IDs before returning for OpenAI API compatibility
  const llmMessages = messages.map((msg) => {
    const mappedMsg = { ...msg };
    delete (mappedMsg as any).id; // Remove id property
    return mappedMsg as ChatCompletionMessageParam;
  });

  return llmMessages;
};

// It updated a message by ID within the single, combined messages array.
// We might need separate updateAIMessage/updateUIMessage functions if needed later.
export const updateMessage = async (
  threadId: string,
  updatedMessage: Message // This type would need changing too
): Promise<void> => {
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
  });

  // This logic assumes a single 'messages' array and the old 'Message' type
  const uiMessages = (thread.uiMessages as unknown as Message[]) ?? [];
  const aiMessages = (thread.aiMessages as unknown as Message[]) ?? [];


  const uiMessageIndex = uiMessages.findIndex(
    (msg) => msg.id === updatedMessage.id
  );

  const aiMessageIndex = aiMessages.findIndex(
    (msg) => msg.id === updatedMessage.id && msg.role === "user"
  );

  if (uiMessageIndex !== -1) {
    uiMessages[uiMessageIndex] = updatedMessage;
    // aiMessageIndex could be -1 if it is an assistant message
    if (aiMessageIndex !== -1) {
      aiMessages[aiMessageIndex] = updatedMessage;
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: { uiMessages: uiMessages as unknown as Prisma.InputJsonValue, aiMessages: aiMessages as unknown as Prisma.InputJsonValue },
    });
  } else {
    console.warn(
      `Message with id ${updatedMessage.id} not found in thread ${threadId}.`
    );
  }
};

export const deleteThread = async (threadId: string): Promise<void> => {
  await prisma.thread.delete({
    where: { id: threadId },
  });
};

export const updateThread = async (thread: {
  threadId: string;
  name: string;
}): Promise<Thread> => {
  const updatedPrismaThread = await prisma.thread.update({
    where: { id: thread.threadId },
    data: { name: thread.name }, // Explicitly update only name
  });

  return {
    threadId: updatedPrismaThread.id,
    title: updatedPrismaThread.name,
    createdAt: updatedPrismaThread.createdAt,
  };
};
