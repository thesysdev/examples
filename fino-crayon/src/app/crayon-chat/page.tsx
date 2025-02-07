"use client";
import { templates } from "../responseTemplates/templates";
import { CrayonChat } from "@crayonai/react-ui";
const logoUrl = "/thesysdev_logo.jpeg";

const Index = () => {
  return (
    <CrayonChat
      logoUrl={logoUrl}
      agentName="Crayon"
      responseTemplates={templates}
      processMessage={({ threadId, message, abortController }) => {
        return fetch("/api/ask", {
          method: "POST",
          body: JSON.stringify({ threadId, ...message }),
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          signal: abortController.signal,
        });
      }}
      createThread={(firstMessage) => {
        return fetch("/api/threads", {
          method: "POST",
          body: JSON.stringify({
            title: firstMessage.message!,
          }),
        }).then((res) => res.json());
      }}
    />
  );
};

export default Index;
