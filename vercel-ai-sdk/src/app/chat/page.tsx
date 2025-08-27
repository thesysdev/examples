"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

  const handleC1Action = ({ llmFriendlyMessage, humanFriendlyMessage }) => {
    sendMessage({
      text: llmFriendlyMessage,
      metadata: { humanFriendlyMessage },
    });
  };

  return (
    <ThemeProvider>
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex justify-center overflow-auto">
          <div className="w-full max-w-3xl p-4">
            <div className="space-y-3">
              {messages.map((message) => {
                const text = message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("");
                return (
                  <div key={message.id} className="p-3 rounded-lg bg-gray-50">
                    {message.role === "user" ? (
                      <div className="text-sm text-gray-700">
                        {message.metadata?.humanFriendlyMessage || text}
                      </div>
                    ) : (
                      <C1Component
                        isStreaming={status === "streaming"}
                        c1Response={text}
                        onAction={handleC1Action}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-lg mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={status !== "ready"}
                placeholder="Say something..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={status !== "ready"}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
