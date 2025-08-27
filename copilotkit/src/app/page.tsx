"use client";

import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import {
  CopilotSidebar,
  ImageRenderer,
  UserMessage,
} from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import "@crayonai/react-ui/styles/index.css";
import { useCopilotChat } from "@copilotkit/react-core";
import { MessageRole, TextMessage } from "@copilotkit/runtime-client-gql";

const AssistantMessageRenderer = ({ message, isGenerating }: any) => {
  const { appendMessage } = useCopilotChat();
  // In the Assistant Message, render the C1Component rather than rendering a markdown message.
  return (
    <C1Component
      c1Response={message?.content || ""}
      isStreaming={isGenerating}
      onAction={(action) => {
        appendMessage(
          new TextMessage({
            role: MessageRole.User,
            // Action is a object with 2 keys: llmFriendlyMessage and humanFriendlyMessage.
            // We stringify is because the content field of CopilotKit is a string.
            content: JSON.stringify(action),
          })
        );
      }}
    />
  );
};

const UserMessageRenderer = ({ message }: any) => {
  // Since content can either be a string or a json object (in the case of an Action)
  // we need to parse it and extract the humanFriendlyMessage incase its a json object.
  let content = message?.content;
  try {
    const { humanFriendlyMessage } = JSON.parse(message?.content || "{}");
    content = humanFriendlyMessage;
  } catch (error) {}
  return (
    <UserMessage
      message={{ ...message, content }}
      ImageRenderer={ImageRenderer}
      rawData=""
    />
  );
};

export default function Page() {
  return (
    <ThemeProvider>
      <CopilotSidebar
        defaultOpen
        instructions={
          "You are assisting the user as best as you can. Answer in the best way possible given the data you have."
        }
        // Override the default UserMessage and AssistantMessage components to install
        // C1 Components.
        UserMessage={UserMessageRenderer}
        AssistantMessage={AssistantMessageRenderer}
      />
    </ThemeProvider>
  );
}
