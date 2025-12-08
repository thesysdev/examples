"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import { useState, useRef } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [c1Response, setC1Response] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Use a ref to maintain the same thread ID across the session
  const threadIdRef = useRef(crypto.randomUUID());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setC1Response("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            role: "user",
            content: query,
            id: crypto.randomUUID(),
          },
          threadId: threadIdRef.current,
          responseId: crypto.randomUUID(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      let accumulatedResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        accumulatedResponse += chunk;
        setC1Response(accumulatedResponse);
      }
      // Clear the query on successful completion
      setQuery("");
    } catch (error) {
      console.error("Error:", error);
      setC1Response("Sorry, there was an error processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Submit"}
            </button>
          </div>
        </form>

        <ThemeProvider mode="light">
          <C1Component
            c1Response={c1Response}
            isStreaming={isLoading}
            updateMessage={(message) => {
              setC1Response(message);
            }}
            onAction={({ llmFriendlyMessage }) => {
              if (!isLoading && llmFriendlyMessage) {
                setQuery(llmFriendlyMessage);
              }
            }}
          />
        </ThemeProvider>
      </div>
    </div>
  );
}
