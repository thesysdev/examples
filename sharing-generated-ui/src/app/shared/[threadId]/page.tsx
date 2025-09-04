"use client";

import type { Message } from "@crayonai/react-core";
import { C1ChatViewer } from "@thesysai/genui-sdk";
import { use, useEffect, useState } from "react";
import "@crayonai/react-ui/styles/index.css";
import { Loader } from "@/app/components/Loader";

export default function ViewSharedPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(`/api/share/${threadId}`);
      const messages = await response.json();
      setMessages(messages);
    };
    fetchMessages();
  }, [threadId]);

  if (!messages || !messages.length) return <Loader fullScreen />;

  return <C1ChatViewer messages={messages} />;
}
