import { db } from "./../firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { Thread } from "@crayonai/react-core";
import { Message as UIMessage } from "@thesysai/genui-sdk";
import type { ChatCompletionMessageParam } from "openai/resources.mjs";

export type Message = ChatCompletionMessageParam & {
  id: string;
};

const THREADS_COLLECTION = "threads";

export const createThread = async (name: string): Promise<Thread> => {
  const newThreadRef = await addDoc(collection(db, THREADS_COLLECTION), {
    name: name,
    messages: [],
    createdAt: serverTimestamp(),
  });
  return {
    threadId: newThreadRef.id,
    title: name,
    createdAt: new Date(),
  };
};

export const getThreadList = async (): Promise<Thread[]> => {
  const threadsCollectionRef = collection(db, THREADS_COLLECTION);
  const q = query(threadsCollectionRef, orderBy("createdAt", "desc")); // Order by creation time
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      threadId: doc.id,
      title: data.name,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    };
  });
};

export const addMessages = async (threadId: string, ...messages: Message[]) => {
  if (!threadId) throw new Error("threadId is required for addMessages");
  const threadRef = doc(db, THREADS_COLLECTION, threadId);
  const threadSnap = await getDoc(threadRef);

  if (!threadSnap.exists()) {
    throw new Error(`Thread with id ${threadId} not found.`);
  }

  const existingMessages = (threadSnap.data()?.messages as Message[]) ?? [];
  const newMessages = existingMessages.concat(messages);

  await updateDoc(threadRef, {
    messages: newMessages,
  });
};

export const getUIThreadMessages = async (
  threadId: string
): Promise<UIMessage[]> => {
  if (!threadId) return [];
  const threadRef = doc(db, THREADS_COLLECTION, threadId);
  const threadSnap = await getDoc(threadRef);

  if (!threadSnap.exists()) {
    console.warn(`Thread with id ${threadId} not found for getUIThreadMessages.`);
    return [];
  }

  const messages = (threadSnap.data()?.messages as any[]) ?? [];

  const uiMessages = messages
    .filter(
      (msg) =>
        !(
          msg.role === "tool" ||
          (msg.role === "assistant" && msg.tool_calls)
        ) && ["user", "assistant"].includes(msg.role)
    );

  return uiMessages;
};

export const getLLMThreadMessages = async (
  threadId: string
): Promise<ChatCompletionMessageParam[]> => {
  if (!threadId) return [];
  const threadRef = doc(db, THREADS_COLLECTION, threadId);
  const threadSnap = await getDoc(threadRef);

  if (!threadSnap.exists()) {
    console.warn(`Thread with id ${threadId} not found for getLLMThreadMessages.`);
    return [];
  }

  const messages = (threadSnap.data()?.messages as Message[]) ?? [];

  const llmMessages = messages.map((msg) => {
    const { id, ...llmMessage } = msg;
    return llmMessage as ChatCompletionMessageParam;
  });

  return llmMessages;
};

export const updateMessage = async (
  threadId: string,
  updatedMessage: UIMessage
): Promise<void> => {
  if (!threadId) throw new Error("threadId is required for updateMessage");
  if (updatedMessage.role !== "assistant") {
    throw new Error("Only assistant messages can be updated");
  }
  const threadRef = doc(db, THREADS_COLLECTION, threadId);
  const threadSnap = await getDoc(threadRef);

  if (!threadSnap.exists()) {
    console.warn(
      `Thread with id ${threadId} not found. Cannot update message.`
    );
    return;
  }

  const messages = (threadSnap.data()?.messages as Message[]) ?? [];
  const messageIndex = messages.findIndex(
    (msg) => msg.id === updatedMessage.id
  );

  if (messageIndex !== -1) {
    messages[messageIndex] = {
      role: updatedMessage.role,
      content: updatedMessage.content,
      id: updatedMessage.id,
    };
    await updateDoc(threadRef, { messages: messages });
  } else {
    console.warn(
      `Message with id ${updatedMessage.id} not found in thread ${threadId}.`
    );
  }
};

export const deleteThread = async (threadId: string): Promise<void> => {
  if (!threadId) throw new Error("threadId is required for deleteThread");
  const threadRef = doc(db, THREADS_COLLECTION, threadId);
  await deleteDoc(threadRef);
};

export const updateThread = async (thread: {
  threadId: string;
  name: string;
}): Promise<Thread> => {
  if (!thread.threadId) throw new Error("thread.threadId is required for updateThread");
  const threadRef = doc(db, THREADS_COLLECTION, thread.threadId);

  const updates: { name: string; updatedAt?: any } = { name: thread.name };

  await updateDoc(threadRef, updates);

  const updatedSnap = await getDoc(threadRef);
  if (!updatedSnap.exists()) {
    throw new Error(`Thread with id ${thread.threadId} not found after update.`);
  }
  const data = updatedSnap.data()!;

  return {
    threadId: updatedSnap.id,
    title: data.name,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
  };
};
