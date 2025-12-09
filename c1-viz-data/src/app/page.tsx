"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import { useState } from "react";
import { useChat } from "@/src/hooks/useChat";
import { RawDataModal } from "@/src/components/RawDataModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    query,
    setQuery,
    c1Response,
    setC1Response,
    isLoading,
    rawData,
    threadId,
    handleSubmit,
  } = useChat();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about sales data, products, or customers (e.g., 'Show me sales by category')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading || !threadId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Submit"}
            </button>
          </div>
        </form>

        {/* AI Response */}
        {c1Response.trim() && (
          <div className="min-h-[600px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                AI Response
              </h2>
              {rawData.length > 0 && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>📊</span>
                  <span>View Raw Data</span>
                </button>
              )}
            </div>
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
        )}

        {/* Modal for Raw Data Table */}
        <RawDataModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={rawData}
        />
      </div>
    </div>
  );
}
