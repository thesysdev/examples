"use client";

import "@crayonai/react-ui/styles/index.css";
import {
  C1Chat,
  useThreadListManager,
  useThreadManager,
} from "@thesysai/genui-sdk";
import { useEffect } from "react";
import {
  Thread,
  Message,
  UserMessage,
  fetchThreadList,
  deleteThread,
  updateThreadAPI,
  createThreadAPI,
  loadThread,
  updateMessage,
  API_BASE_URL
} from "./client";

export default function App() {
  const threadListManager = useThreadListManager({
    fetchThreadList,
    deleteThread,
    updateThread: async (updated: Thread): Promise<Thread> => {
      console.log("updateThreadHookWrapper called with:", updated);
      const result = await updateThreadAPI(updated.threadId, updated.title);
      if (result) {
        return { ...updated, title: result.title, createdAt: result.createdAt };
      }
      return updated;
    },
    onSwitchToNew: () => {
      const currentPath = window.location.pathname;
      window.history.replaceState(null, '', currentPath);
    },
    onSelectThread: (threadId: string) => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("threadId", threadId);
      window.history.replaceState(null, '', currentUrl.toString());
    },
    createThread: (firstMessage: UserMessage) => {
      return createThreadAPI(firstMessage.message ?? null);
    },
  });

  const threadManager = useThreadManager({
    threadListManager,
    loadThread,
    onUpdateMessage: ({ message }: { message: Message }) => {
      if (threadListManager.selectedThreadId) {
        updateMessage(threadListManager.selectedThreadId, message);
      }
    },
    apiUrl: `${API_BASE_URL}/chat`,
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const threadIdFromUrl = searchParams.get("threadId");

    if (threadIdFromUrl && threadListManager.selectedThreadId !== threadIdFromUrl) {
      console.log("Selecting thread from URL:", threadIdFromUrl);
      threadListManager.selectThread(threadIdFromUrl);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Render Component ---

  return (
    <C1Chat
      threadManager={threadManager}
      threadListManager={threadListManager}
    />
  );
}
