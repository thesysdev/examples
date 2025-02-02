import type { Thread as CrayonThread } from "@crayonai/react-core";

export interface Thread {
  id: number;
  title: string;
  created_at: Date;
  updated_at: Date;
  status: "active" | "archived" | "deleted";
  data: string; // Serialized CrayonThread data
}

export function serializeThread(
  thread: CrayonThread
): Omit<Thread, "id" | "created_at" | "updated_at"> {
  const { ...threadData } = thread;
  delete threadData.isRunning;

  return {
    title: thread.title,
    data: JSON.stringify(threadData),
    status: "active",
  };
}

export function deserializeThread(thread: Thread): CrayonThread {
  if (!thread.data) {
    throw new Error("Thread data is required");
  }

  const crayonThread = JSON.parse(thread.data) as Omit<
    CrayonThread,
    "isRunning"
  >;
  return {
    ...crayonThread,
    threadId: thread.id.toString(),
    title: thread.title,
  };
}
