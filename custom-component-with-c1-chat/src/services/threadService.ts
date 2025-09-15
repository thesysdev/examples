import { PrismaClient, Prisma } from "../generated/prisma";
import { Thread } from "@crayonai/react-core";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";

const prisma = new PrismaClient();

export type Message = ChatCompletionMessageParam & {
  id: string;
};

// Function 1: Create Thread
export const createThread = async (name: string): Promise<Thread> => {
  const newThread = await prisma.thread.create({
    data: {
      name: name,
      messages: [],
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

export const addMessages = async (threadId: string, ...messages: Message[]) => {
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
  });

  const newMessages = ((thread.messages as unknown as Message[]) ?? []).concat(
    messages
  );

  await prisma.thread.update({
    where: { id: threadId },
    data: { messages: newMessages as unknown as Prisma.InputJsonValue }, // Cast via unknown
  });
};

export const getUIThreadMessages = async (
  threadId: string
): Promise<Message[]> => {
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
    select: { messages: true },
  });

  const messages = (thread.messages as unknown as Message[]) ?? [];

  const uiMessages = messages.filter(
    (msg) =>
      !(
        msg.role === "tool" || // Exclude 'tool' role messages
        (msg.role === "assistant" && // Exclude 'assistant' role messages *if* they have tool_calls
          msg.tool_calls)
      )
  );

  return uiMessages;
};

export const getLLMThreadMessages = async (
  threadId: string
): Promise<any[]> => {
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
    select: { messages: true },
  });

  const messages = (thread.messages as unknown as Message[]) ?? [];

  const llmMessages = messages.map((msg) => {
    const mappedMsg = { ...msg, id: undefined };
    delete mappedMsg.id;
    return mappedMsg;
  });

  return llmMessages;
};

export const updateMessage = async (
  threadId: string,
  updatedMessage: Message
): Promise<void> => {
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
  });

  const messages = (thread.messages as unknown as Message[]) ?? [];

  const messageIndex = messages.findIndex(
    (msg) => msg.id === updatedMessage.id
  );

  if (messageIndex !== -1) {
    messages[messageIndex] = updatedMessage;

    await prisma.thread.update({
      where: { id: threadId },
      data: { messages: messages as unknown as Prisma.InputJsonValue },
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
    data: thread,
  });

  return {
    threadId: updatedPrismaThread.id,
    title: updatedPrismaThread.name,
    createdAt: updatedPrismaThread.createdAt,
  };
};
