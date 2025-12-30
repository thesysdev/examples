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
  API_BASE_URL,
} from "./client";

export default function App() {
  const threadListManager = useThreadListManager({
    fetchThreadList,
    deleteThread,
    updateThread: async (updated: Thread): Promise<Thread> => {
      console.log("updateThreadHookWrapper called with:", updated);
      const result = await updateThreadAPI(updated.threadId, updated.title);
      if (result) {
        return result;
      }
      return updated;
    },
    onSwitchToNew: () => {
      const currentPath = window.location.pathname;
      window.history.replaceState(null, "", currentPath);
    },
    onSelectThread: (threadId: string) => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("threadId", threadId);
      window.history.replaceState(null, "", currentUrl.toString());
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
    processMessage: async ({
      threadId,
      messages,
      responseId,
      abortController,
    }) => {
      const latestMessage = messages[messages.length - 1];
      const response = await fetch(
        `${API_BASE_URL}/threads/${threadId}/runs/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            assistant_id: "app",
            input: {
              messages: [{ role: "user", content: latestMessage.content }],
              response_id: responseId,
            },
            stream_mode: "messages",
          }),
        }
      );

      if (!response.ok) return response;

      // Transform LangGraph SSE stream to raw text chunks for the SDK
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          if (!reader) {
            controller.close();
            return;
          }

          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  // LangGraph "messages" stream mode yields [AIMessageChunk, metadata]
                  if (Array.isArray(data) && data[0]?.content) {
                    controller.enqueue(encoder.encode(data[0].content));
                  }
                } catch (e) {
                  // Ignore non-JSON or heartbeat lines
                }
              }
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain" },
      });
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const threadIdFromUrl = searchParams.get("threadId");

    if (
      threadIdFromUrl &&
      threadListManager.selectedThreadId !== threadIdFromUrl
    ) {
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
