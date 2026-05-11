"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Chat } from "@thesysai/genui-sdk";
import { c1AppToolProvider } from "@/src/c1AppToolProvider";

export default function Home() {
  return (
    <C1Chat
      processMessage={async ({ messages, threadId, responseId, abortController }) => {
        return fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, threadId, responseId }),
          signal: abortController.signal,
        });
      }}
      customizeC1={{
        toolProvider: c1AppToolProvider,
        enableArtifactEdit: true,
      }}
    />
  );
}
