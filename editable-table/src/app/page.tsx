"use client";

import { useState } from "react";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

export default function Home() {
  const [c1Response, setC1Response] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = (action: { llmFriendlyMessage?: string; humanFriendlyMessage?: string; payload?: Record<string, unknown> }) => {
    console.log("Action received:", action);
    // Handle form submissions or other actions here
    if (action.llmFriendlyMessage) {
      handleSubmit(action.llmFriendlyMessage);
    }
  };

  const handleSubmit = async (userPrompt?: string) => {
    const messageToSend = userPrompt || prompt;
    if (!messageToSend.trim()) return;

    setIsLoading(true);
    setPrompt("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: { role: "user", content: messageToSend },
          threadId: "default-thread",
          responseId: `response-${Date.now()}`,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += new TextDecoder().decode(value);
        setC1Response(accumulated);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={{ mode: "dark" }}>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Editable Table Demo</h1>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="mb-8 flex gap-4"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask for an editable table..."
              className="flex-1 px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Send"}
            </button>
          </form>

          {/* C1 Response */}
          {c1Response && (
            <div className="bg-gray-800 rounded-lg p-6">
              <C1Component
                c1Response={c1Response}
                isStreaming={isLoading}
                onAction={handleAction}
              />
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
