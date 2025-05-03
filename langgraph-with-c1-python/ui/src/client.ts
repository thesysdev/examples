// Matches the SDK's ThreadInfo/Thread (used for listing/updating)
export interface Thread {
  threadId: string;
  title: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string | undefined;
}

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string | null;
}

export interface UserMessage {
  message?: string | null | undefined;
}

// Base URL for the FastAPI backend API
export const API_BASE_URL = "/api"; // Adjust if your proxy/setup is different

// --- API Fetch Functions ---

export const fetchThreadList = async (): Promise<Thread[]> => {
  const response = await fetch(`${API_BASE_URL}/threads`);
  if (!response.ok) {
    throw new Error("Failed to fetch threads");
  }
  const threads = await response.json();
  return threads.map((t: any) => ({
    threadId: t.threadId,
    title: t.title,
    createdAt: new Date(t.createdAt)
  }));
};

export const deleteThread = async (threadId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete thread");
  }
};


export const updateThreadAPI = async (threadId: string, title: string): Promise<Thread | null> => {
  const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title }),
  });
  if (!response.ok) {
    console.error("Failed to update thread API");
    return null;
  }
  const updatedThread = await response.json();
  return {
    threadId: updatedThread.threadId,
    title: updatedThread.title,
    createdAt: new Date(updatedThread.createdAt)
  };
};


export const createThreadAPI = async (firstMessageContent: string | null): Promise<Thread> => {
  const initialTitle = firstMessageContent || "New Chat";
  const response = await fetch(`${API_BASE_URL}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: initialTitle }),
  });
  if (!response.ok) {
    throw new Error("Failed to create thread");
  }
  const newThread = await response.json();
  return {
    threadId: newThread.threadId,
    title: newThread.title,
    createdAt: new Date(newThread.createdAt)
  };
};

export const loadThread = async (threadId: string): Promise<Message[]> => {
  const response = await fetch(`${API_BASE_URL}/threads/${threadId}/messages`);
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error("Failed to load messages");
  }
  const messagesFromApi: UIMessage[] = await response.json();
  return messagesFromApi
    .map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content ?? undefined,
    }));
};

export const updateMessage = async (threadId: string, message: Message): Promise<void> => {
  const messageForApi: UIMessage = {
    id: message.id,
    role: message.role,
    content: message.content ?? null,
  };
  const response = await fetch(`${API_BASE_URL}/threads/${threadId}/message`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messageForApi),
  });
  if (!response.ok) {
    console.error("Failed to update message (placeholder)", response.statusText);
  }
}; 
