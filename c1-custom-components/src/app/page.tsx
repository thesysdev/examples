"use client";

import {
  ThemeProvider,
  useThreadListManager,
  useThreadManager,
} from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";
import { ChatProvider } from "@crayonai/react-core";
import {
  Composer,
  Container,
  Messages,
  MobileHeader,
  NewChatButton,
  ScrollArea,
  SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
  ThreadContainer,
  ThreadList,
} from "@crayonai/react-ui/Shell";
import * as apiClient from "@/src/apiClient";

export default function Home() {
  const threadListManager = useThreadListManager({
    fetchThreadList: async () => apiClient.getThreadList(),
    deleteThread: async (threadId) => apiClient.deleteThread(threadId),
    updateThread: async (t) => apiClient.updateThread(t),
    onSwitchToNew: async () => {},
    onSelectThread: async (threadId) => apiClient.getMessages(threadId),
    createThread: async (message) => apiClient.createThread(message.message!),
  });

  const threadManager = useThreadManager({
    threadListManager,
    loadThread: async (threadId) => apiClient.getMessages(threadId),
    onUpdateMessage: async ({ message }) =>
      apiClient.updateMessage(threadListManager.selectedThreadId!, message),
    processMessage: async ({ messages }) => {
      const latestMessage = messages[messages.length - 1];
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          prompt: latestMessage,
          threadId: threadListManager.selectedThreadId,
          responseId: crypto.randomUUID(),
        }),
      });
      return response;
    },
  });

  return (
    <ThemeProvider>
      <ChatProvider
        threadListManager={threadListManager}
        threadManager={threadManager}
      >
        <Container
          logoUrl={"https://www.thesys.dev/favicon.ico"}
          agentName="C1Chat"
        >
          <SidebarContainer>
            <SidebarHeader />
            <SidebarContent>
              <NewChatButton />
              <SidebarSeparator />
              <ThreadList />
            </SidebarContent>
          </SidebarContainer>
          <ThreadContainer>
            <MobileHeader />
            <ScrollArea>
              <Messages />
            </ScrollArea>
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </ThemeProvider>
  );
}
