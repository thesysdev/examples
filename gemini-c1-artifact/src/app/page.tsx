"use client";

import { ThemeProvider, useArtifact } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

import { useStreamingChat } from "@/hooks/useStreamingChat";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import {
  ChatHeader,
  MessageList,
  ChatInput,
  ResizeDivider,
  ArtifactPanel,
} from "@/components";

function ChatApp() {
  const { messages, input, setInput, isLoading, sendMessage, startNewThread } =
    useStreamingChat();

  const {
    width: chatWidth,
    isDragging,
    containerRef,
    startDragging,
  } = useResizablePanel();

  const { renderArtifact, isArtifactActive } = useArtifact();

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
        <ChatHeader onNewChat={startNewThread} isLoading={isLoading} />
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={setInput}
        />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Draggable Divider */}
      {isArtifactActive && (
        <ResizeDivider isDragging={isDragging} onMouseDown={startDragging} />
      )}

      {/* Artifact Panel */}
      {isArtifactActive && (
        <ArtifactPanel width={100 - chatWidth}>
          {renderArtifact()}
        </ArtifactPanel>
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
