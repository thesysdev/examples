"use client";

import type { Message } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { RecipeTemplate } from "@/app/templates/recipe";
import { TextTemplate } from "@/app/templates/text";

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
      responseTemplates={[
        {
          name: "recipe",
          Component: RecipeTemplate,
        },
        {
          name: "text",
          Component: TextTemplate,
        },
      ]}
    />
  );
}
