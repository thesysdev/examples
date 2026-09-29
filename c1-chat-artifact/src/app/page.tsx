"use client";

import { useState } from "react";
import { C1Component, ThemeProvider, useArtifact } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";
import { nanoid } from "nanoid";

export default function Home() {
  const [query, setQuery] = useState("");
  const [c1Response, setC1Response] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const { renderArtifact, isArtifactActive } = useArtifact();

  const handleSubmit = async (customQuery?: string) => {
    const userQuery = customQuery || query;
    if (!userQuery.trim() || isStreaming) return;

    // Abort any ongoing request
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsStreaming(true);
    setC1Response("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: { role: "user", content: userQuery, id: nanoid() },
          threadId: "single-thread",
          responseId: nanoid(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setC1Response(accumulatedResponse);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching response:", error);
        setC1Response("Error: Failed to get response from the server.");
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content Area */}
      <div
        className={`flex-1 p-8 transition-all duration-300 ${
          isArtifactActive ? "mr-0" : ""
        }`}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Artifact Assistant
            </h1>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask me to create presentations or reports..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isStreaming}
              />
              {isStreaming ? (
                <button
                  onClick={handleStop}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg
                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit()}
                  disabled={!query.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              )}
            </div>
          </div>

          {c1Response && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <ThemeProvider>
                <C1Component
                  c1Response={c1Response}
                  isStreaming={isStreaming}
                  updateMessage={(message) => setC1Response(message)}
                  onAction={({ llmFriendlyMessage, humanFriendlyMessage }) => {
                    console.log("Action triggered:", {
                      humanFriendlyMessage,
                      llmFriendlyMessage,
                    });
                    setQuery(llmFriendlyMessage);
                    handleSubmit(llmFriendlyMessage);
                  }}
                />
              </ThemeProvider>
            </div>
          )}
        </div>
      </div>

      {/* Artifact Side Panel */}
      {isArtifactActive && (
        <div className="w-1/2 min-w-[600px] max-w-[900px] h-screen border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl">
          <div className="h-full">{renderArtifact()}</div>
        </div>
      )}
    </div>
  );
}
