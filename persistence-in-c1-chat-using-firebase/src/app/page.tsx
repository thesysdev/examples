"use client";

import "@crayonai/react-ui/styles/index.css";
import {
  C1Chat,
  useThreadListManager,
  useThreadManager,
  Message,
} from "@thesysai/genui-sdk";
import {
  createThread,
  deleteThread,
  getThreadList,
  getUIThreadMessages,
  updateMessage,
  updateThread,
  Message as ServiceMessage,
} from "@/src/services/threadService";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const searchParams = useSearchParams();
  const threadIdInUrl = searchParams.get("threadId");
  const pathname = usePathname();
  const { replace } = useRouter();

  const threadListManager = useThreadListManager({
    fetchThreadList: () => getThreadList(),
    deleteThread: (threadId) => deleteThread(threadId),
    updateThread: (t) => updateThread({ threadId: t.threadId, name: t.title }),
    onSwitchToNew: () => {
      replace(`${pathname}`);
    },
    onSelectThread: (threadId) => {
      const newSearch = `?threadId=${threadId}`;
      replace(`${pathname}${newSearch}`);
    },
    createThread: (message) => {
      return createThread(message.message!);
    },
  });

  const threadManager = useThreadManager({
    threadListManager,
    loadThread: async (threadId) => await getUIThreadMessages(threadId),
    onUpdateMessage: async ({ message }) => {
      await updateMessage(threadListManager.selectedThreadId!, message);
    },
    apiUrl: "/api/chat",
  });

  useEffect(() => {
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
