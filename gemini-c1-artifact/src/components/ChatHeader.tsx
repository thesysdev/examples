"use client";

interface ChatHeaderProps {
  onNewChat: () => void;
  isLoading: boolean;
}

export function ChatHeader({ onNewChat, isLoading }: ChatHeaderProps) {
  return (
    <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          Gemini Artifact Agent
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Ask me to create presentations or reports
        </p>
      </div>
      <button
        onClick={onNewChat}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-zinc-300 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        New Chat
      </button>
    </header>
  );
}

