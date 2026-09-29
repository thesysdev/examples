"use client";

import { C1Component } from "@thesysai/genui-sdk";
import { Message } from "@/types/message";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = [
  "Create a presentation about AI trends",
  "Generate a quarterly report template",
  "Make a product launch deck",
];

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (s: string) => void }) {
  return (
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
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm text-zinc-300 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-zinc-800 rounded-2xl px-4 py-3">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:100ms]" />
          <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:200ms]" />
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isStreaming: boolean;
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.textContent}</p>
        ) : (
          <>
            {message.textContent && (
              <p className="whitespace-pre-wrap">{message.textContent}</p>
            )}
            {message.artifactContent && (
              <C1Component
                c1Response={message.artifactContent}
                isStreaming={isStreaming}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function MessageList({ messages, isLoading, onSuggestionClick }: MessageListProps) {
  const showLoadingIndicator =
    isLoading && messages[messages.length - 1]?.role === "user";

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <EmptyState onSuggestionClick={onSuggestionClick} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isLoading && index === messages.length - 1}
        />
      ))}
      {showLoadingIndicator && <LoadingIndicator />}
    </div>
  );
}

