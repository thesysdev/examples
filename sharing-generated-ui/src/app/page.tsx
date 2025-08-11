"use client";

import { C1ShareThread, useThreadManager } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";
import { ChatProvider, useThreadListManager } from "@crayonai/react-core";
import { Shell } from "@crayonai/react-ui";
import { Composer } from "@crayonai/react-ui/Shell";
import { Footer } from "./components/Footer";

const {
  NewChatButton,
  MobileHeader,
  ScrollArea,
  Messages,
  Container,
  SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
  ThreadContainer,
  ThreadList,
} = Shell;

export default function Home() {
  // Call relevant APIs to manage thread list here
  const threadListManager = useThreadListManager({
    fetchThreadList: async () => [],
    deleteThread: async () => {},
    updateThread: async (t) => t,
    onSwitchToNew: async () => {},
    onSelectThread: async () => {},
    createThread: async ({ message }) => {
      return {
        id: "1",
        threadId: "1",
        title: message ?? "New Thread",
        createdAt: new Date(),
      };
    },
  });

  // Call relevant APIs to manage thread here
  const threadManager = useThreadManager({
    threadListManager,
    loadThread: async () => [],
    onUpdateMessage: async () => {},
    apiUrl: "/api/chat",
    customizeC1: {
      responseFooterComponent: Footer,
    },
  });

  const selectedThreadId = threadListManager.selectedThreadId;

  return (
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
          <div className="flex w-full items-center justify-end p-4">
            <C1ShareThread
              generateShareLink={
                !selectedThreadId
                  ? undefined
                  : async () => {
                      const baseUrl = window.location.origin;
                      return `${baseUrl}/shared/${selectedThreadId}`;
                    }
              }
            />
          </div>
          <ScrollArea>
            <Messages />
          </ScrollArea>
          <Composer />
        </ThreadContainer>
      </Container>
    </ChatProvider>
  );
}
