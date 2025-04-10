"use client";
import {
  ChatProvider,
  useThreadListManager,
  useThreadManager,
  Thread,
  processStreamedMessage,
  UserMessage,
} from "@crayonai/react-core";
import {
  Container,
  SidebarContainer,
  SidebarHeader,
  SidebarContent,
  SidebarSeparator,
  ThreadList,
  ThreadContainer,
  MobileHeader,
  ScrollArea,
  Messages,
  Composer,
  NewChatButton,
} from "@crayonai/react-ui/Shell";
import { ThemeProvider } from "@crayonai/react-ui/ThemeProvider";
import { templates } from "./responseTemplates/templates";
import "@crayonai/react-ui/styles/index.css";
const logoUrl = "/thesysdev_logo.jpeg";

const Index = () => {
  const threadListManager = useThreadListManager({
    fetchThreadList: async () => {
      const response = await fetch("/api/threads");
      const data = await response.json();
      return data.threads.map((thread: Thread) => ({
        threadId: +thread.threadId,
        title: thread.title,
        createdAt: new Date(thread.createdAt),
        isRunning: false,
      }));
    },
    createThread: (firstMessage) => {
      return fetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({
          title: firstMessage.message!,
        }),
      }).then((res) => res.json());
    },
    deleteThread: async () => {},
    updateThread: async (t) => t,
    onSwitchToNew: () => {},
    onSelectThread: () => {},
  });

  const threadManager = useThreadManager({
    threadId: threadListManager.selectedThreadId,
    shouldResetThreadState: threadListManager.shouldResetThreadState,
    loadThread: async () => {
      const response = await fetch(
        `/api/messages?threadId=${threadListManager.selectedThreadId}`
      );
      const data = await response.json();
      return data.messages;
    },
    onProcessMessage: async ({ message, threadManager, abortController }) => {
      threadManager.appendMessages({
        id: crypto.randomUUID(),
        role: "user",
        type: "prompt",
        message: message.message as string,
      });

      let threadId = threadListManager.selectedThreadId;
      if (!threadId) {
        const thread = await threadListManager.createThread(
          message as UserMessage
        );
        threadListManager.selectThread(thread.threadId!, false);
        threadId = thread.threadId;
      }
      const response = await fetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ threadId, ...message }),
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        signal: abortController.signal,
      });

      await processStreamedMessage({
        response,
        createMessage: threadManager.appendMessages,
        updateMessage: threadManager.updateMessage,
        deleteMessage: (messageId) => {
          const newMessages = threadManager.messages.filter(
            (message) => message.id !== messageId
          );
          threadManager.setMessages(newMessages);
        },
      });
      return [];
    },
    responseTemplates: templates,
  });

  return (
    <ThemeProvider>
      <ChatProvider
        threadListManager={threadListManager}
        threadManager={threadManager}
      >
        <Container logoUrl={logoUrl} agentName="Crayon">
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
};

export default Index;
