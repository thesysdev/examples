"use client";

import { Loader } from "@/app/components/Loader";
import type { Message } from "@crayonai/react-core";
import { C1ChatViewer } from "@thesysai/genui-sdk";
import { use, useEffect, useState } from "react";
import "@crayonai/react-ui/styles/index.css";

export default function ViewSharedMessage({
  params,
}: {
  params: Promise<{ threadId: string; messageId: string }>;
}) {
  const { threadId, messageId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(`/api/share/${threadId}/${messageId}`);
      const messageResponse = (await response.json()) as {
        message: Message;
      };
      setMessages([messageResponse.message]);
    };
    fetchMessages();
  }, [messageId, threadId]);

  if (!messages || !messages.length) return <Loader fullScreen />;

  return <C1ChatViewer messages={messages} />;
}
