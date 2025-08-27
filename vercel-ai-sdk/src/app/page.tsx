"use client";

import { useCompletion } from "@ai-sdk/react";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

export default function Page() {
  const {
    completion,
    isLoading,
    complete,
    input,
    setInput,
    handleSubmit,
    handleInputChange,
  } = useCompletion({
    api: "/api/completion",
  });

  const onC1Action = (action: {
    llmFriendlyMessage: string;
    humanFriendlyMessage: string;
  }) => {
    setInput(action.humanFriendlyMessage);
    complete(action.llmFriendlyMessage);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col gap-4 max-w-3xl w-full">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              name="prompt"
              value={input}
              onChange={handleInputChange}
              id="input"
              placeholder="Enter your prompt..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "..." : "Submit"}
            </button>
          </form>

          <C1Component
            c1Response={completion}
            isStreaming={isLoading}
            onAction={onC1Action}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
