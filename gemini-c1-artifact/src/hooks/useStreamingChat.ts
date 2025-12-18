"use client";

import { useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { Message } from "@/types/message";
import { parseSSEEvents, processEvents } from "@/utils/sse";

export function useStreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(() => nanoid());
  const abortRef = useRef<AbortController | null>(null);

  const updateMessage = useCallback(
    (id: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const startNewThread = useCallback(() => {
    if (isLoading) return;
    setMessages([]);
    setThreadId(nanoid());
    setInput("");
  }, [isLoading]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      textContent: input.trim(),
      artifactContent: "",
    };

    const responseId = nanoid();
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: {
            id: userMessage.id,
            role: "user",
            content: userMessage.textContent,
          },
          threadId,
          responseId,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to send message");
      }

      // Add placeholder for assistant message
      setMessages((prev) => [
        ...prev,
        { id: responseId, role: "assistant", textContent: "", artifactContent: "" },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = { text: "", artifact: "" };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSSEEvents(buffer);
        buffer = remaining;

        accumulated = processEvents(events, accumulated);
        updateMessage(responseId, {
          textContent: accumulated.text,
          artifactContent: accumulated.artifact,
        });
      }

      // Process any remaining buffer
      buffer += decoder.decode();
      if (buffer) {
        const { events } = parseSSEEvents(buffer + "\n\n");
        accumulated = processEvents(events, accumulated);
        updateMessage(responseId, {
          textContent: accumulated.text,
          artifactContent: accumulated.artifact,
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Request was cancelled
      } else {
        console.error("Error sending message:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: responseId,
            role: "assistant",
            textContent: "Sorry, something went wrong. Please try again.",
            artifactContent: "",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, threadId, updateMessage]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    startNewThread,
  };
}

