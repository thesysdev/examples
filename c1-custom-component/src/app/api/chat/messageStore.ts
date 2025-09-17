import OpenAI from "openai";

export type DBMessage = OpenAI.Chat.ChatCompletionMessageParam & {
  id?: string;
};

const messagesStore: {
  [threadId: string]: DBMessage[];
} = {};

export const getMessageStore = (id: string) => {
  if (!messagesStore[id]) {
    messagesStore[id] = [];
  }
  const messageList = messagesStore[id];
  return {
    addMessage: (message: DBMessage) => {
      messageList.push(message);
    },
    messageList,
    getOpenAICompatibleMessageList: () => {
      return messageList.map((m) => {
        const message = {
          ...m,
        };

        delete message.id;

        return message;
      });
    },
  };
};
