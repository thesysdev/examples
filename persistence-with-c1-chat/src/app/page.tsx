"use client";

import "@crayonai/react-ui/styles/index.css";
import {
  C1Chat,
  useThreadListManager,
  useThreadManager,
} from "@thesysai/genui-sdk";
import * as apiClient from "@/src/apiClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const searchParams = useSearchParams();
  const threadIdInUrl = searchParams.get("threadId");
  const pathname = usePathname();
  const { replace } = useRouter();

  const threadListManager = useThreadListManager({
    fetchThreadList: () => apiClient.getThreadList(),
    deleteThread: (threadId) => apiClient.deleteThread(threadId),
    updateThread: (t) => apiClient.updateThread(t),
    onSwitchToNew: () => {
      replace(`${pathname}`);
    },
    onSelectThread: (threadId) => {
      const newSearch = `?threadId=${threadId}`;
      replace(`${pathname}${newSearch}`);
    },
    createThread: (message) => {
      return apiClient.createThread(message.message!);
    },
  });

  const threadManager = useThreadManager({
    threadListManager,
    loadThread: (threadId) => apiClient.getMessages(threadId),
    onUpdateMessage: ({ message }) => {
      apiClient.updateMessage(threadListManager.selectedThreadId!, message);
    },
    apiUrl: "/api/chat",
  });

  useEffect(() => {
    // at the first render, if there is a threadId in the url, select the thread
    if (threadIdInUrl && threadListManager.selectedThreadId !== threadIdInUrl) {
      threadListManager.selectThread(threadIdInUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <C1Chat
      threadManager={threadManager}
      threadListManager={threadListManager}
    />
  );
}
