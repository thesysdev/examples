"use client";

import type { Message, ResponseTemplate } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { SimpleForm } from "./templates/simpleform";

const responseTemplates: ResponseTemplate[] = [
  {
    Component: SimpleForm,
    name: "subscribe_form",
  },
];

const processMessage = async ({
  threadId,
  messages,
  abortController,
}: {
  threadId: string;
  messages: Message[];
  abortController: AbortController;
}) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ threadId, messages }),
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    signal: abortController.signal,
  });
  return response;
};

export default function Home() {
  return (
    <CrayonChat
      processMessage={processMessage}
      responseTemplates={responseTemplates}
    />
  );
}
