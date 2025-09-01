// Mastra-compatible message type
export type MastraMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  threadId?: string;
};

const messagesStore: {
  [threadId: string]: MastraMessage[];
} = {};

export const getMessageStore = (id: string) => {
  if (!messagesStore[id]) {
    messagesStore[id] = [];
  }
  const messageList = messagesStore[id];
  return {
    addMessage: (message: MastraMessage) => {
      messageList.push({
        ...message,
        threadId: id,
      });
    },
    messageList,
    getMastraCompatibleMessageList: () => {
      return messageList;
    },
  };
};
