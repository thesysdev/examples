"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { C1Component, ThemeProvider, useArtifact } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId] = useState(() => nanoid());
  const abortRef = useRef<AbortController | null>(null);

  // Panel resize state
  const [chatWidth, setChatWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { renderArtifact, isArtifactActive } = useArtifact();

  // Handle drag resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Clamp between 25% and 75%
      setChatWidth(Math.min(75, Math.max(25, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input.trim(),
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
          prompt: userMessage,
          threadId,
          responseId,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to send message");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      // Add placeholder for assistant message
      setMessages((prev) => [
        ...prev,
        { id: responseId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === responseId ? { ...m, content: accumulated } : m
          )
        );
      }

      accumulated += decoder.decode();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === responseId ? { ...m, content: accumulated } : m
        )
      );
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
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, threadId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-dvh bg-zinc-950 text-zinc-100 flex"
    >
      {/* Chat Panel */}
      <div
        className="flex flex-col transition-[width] duration-150 ease-out"
        style={{ width: isArtifactActive ? `${chatWidth}%` : "100%" }}
      >
        {/* Header */}
        <header className="border-b border-zinc-800 px-6 py-4">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Gemini Artifact Agent
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ask me to create presentations or reports
          </p>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-zinc-300 mb-2">
                What would you like to create?
              </h2>
              <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-md">
                {[
                  "Create a presentation about AI trends",
                  "Generate a quarterly report template",
                  "Make a product launch deck",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm text-zinc-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <C1Component
                      c1Response={message.content}
                      isStreaming={
                        isLoading &&
                        messages[messages.length - 1]?.id === message.id
                      }
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:100ms]" />
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:200ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to create a presentation or report..."
              rows={1}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all"
            >
              {isLoading ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Draggable Divider */}
      {isArtifactActive && (
        <div
          onMouseDown={handleMouseDown}
          className={`w-1 bg-zinc-800 hover:bg-blue-500 cursor-col-resize flex-shrink-0 relative group transition-colors ${
            isDragging ? "bg-blue-500" : ""
          }`}
        >
          {/* Wider hit area */}
          <div className="absolute inset-y-0 -left-1 -right-1" />
          {/* Visual grip indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-1 rounded-full bg-zinc-400" />
            <div className="w-1 h-1 rounded-full bg-zinc-400" />
            <div className="w-1 h-1 rounded-full bg-zinc-400" />
          </div>
        </div>
      )}

      {/* Artifact Panel */}
      {isArtifactActive && (
        <div
          className="bg-zinc-900 flex-1 flex flex-col h-dvh"
          style={{ width: `${100 - chatWidth}%` }}
        >
          <div className="flex-1 overflow-y-auto p-6">{renderArtifact()}</div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ChatApp />
    </ThemeProvider>
  );
}
