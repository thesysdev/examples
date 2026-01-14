// Matches the official LangGraph API schema while maintaining SDK compatibility
export interface Thread {
  // SDK compatible fields
  threadId: string;
  title: string;
  createdAt: Date;

  // Official API fields (optional to satisfy SDK requirements in some contexts)
  thread_id?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
  status?: "idle" | "busy" | "interrupted" | "error";
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string | undefined;
}

export interface UserMessage {
  message?: string | null | undefined;
}

// Base URL for the FastAPI backend API
export const API_BASE_URL = "/api"; // Adjust if your proxy/setup is different

// --- API Fetch Functions ---

export const fetchThreadList = async (): Promise<Thread[]> => {
  const response = await fetch(`${API_BASE_URL}/threads/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 10 }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch threads");
  }
  const threads = await response.json();
  return threads.map((t: any) => ({
    ...t,
    threadId: t.thread_id,
    title: t.metadata?.title || "New Chat",
    createdAt: new Date(t.created_at),
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

export const updateThreadAPI = async (
  threadId: string,
  title: string
): Promise<Thread | null> => {
  const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata: { title: title } }),
  });
  if (!response.ok) {
    console.error("Failed to update thread API");
    return null;
  }
  const t = await response.json();
  return {
    ...t,
    threadId: t.thread_id,
    title: t.metadata?.title || title,
    createdAt: new Date(t.created_at),
  };
};

export const createThreadAPI = async (
  firstMessageContent: string | null
): Promise<Thread> => {
  const initialTitle = firstMessageContent || "New Chat";
  const response = await fetch(`${API_BASE_URL}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata: { title: initialTitle } }),
  });
  if (!response.ok) {
    throw new Error("Failed to create thread");
  }
  const t = await response.json();
  return {
    ...t,
    threadId: t.thread_id,
    title: t.metadata?.title || initialTitle,
    createdAt: new Date(t.created_at),
  };
};

export const loadThread = async (threadId: string): Promise<Message[]> => {
  const response = await fetch(`${API_BASE_URL}/threads/${threadId}/state`);
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error("Failed to load messages");
  }
  const state = await response.json();
  const rawMessages = state.values?.messages || [];

  return rawMessages.map((msg: any) => ({
    id: msg.id,
    role: msg.type === "human" ? "user" : "assistant",
    content:
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content),
  }));
};

export const updateMessage = async (
  threadId: string,
  message: Message
): Promise<void> => {
  // LangGraph update_state logic
  const response = await fetch(`${API_BASE_URL}/threads/${threadId}/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      values: {
        messages: [
          {
            id: message.id,
            type: message.role === "user" ? "human" : "ai",
            content: message.content ?? null,
          },
        ],
      },
    }),
  });
  if (!response.ok) {
    console.error(
      "Failed to update message (placeholder)",
      response.statusText
    );
  }
};
