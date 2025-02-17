"use client";

import type { CreateMessage } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";

const processMessage = async ({
  threadId,
  message,
  abortController,
}: {
  threadId: string;
  message: CreateMessage;
  abortController: AbortController;
}) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ threadId, message }),
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    signal: abortController.signal,
  });
  return response;
};

export default function Home() {
  return <CrayonChat processMessage={processMessage} />;
}
