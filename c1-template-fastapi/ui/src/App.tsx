"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Chat } from "@thesysai/genui-sdk";

export default function App() {
  return (
    <C1Chat
      apiUrl="/api/chat"
      processMessage={({ threadId, messages, abortController, responseId }) => {
        return fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            threadId,
            prompt: messages.slice(-1)[0],
            responseId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        });
      }}
    />
  );
}
