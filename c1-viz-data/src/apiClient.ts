import { Thread } from "@crayonai/react-core";
import { Message } from "@thesysai/genui-sdk";

const API_BASE_URL = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "An unknown error occurred" }));
    console.error("API Error:", response.status, errorData);
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  return response.json() as Promise<T>;
}

export const createThread = async (name: string): Promise<Thread> => {
  const response = await fetch(`${API_BASE_URL}/thread`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  return handleResponse<Thread>(response).then((t) => ({
    ...t,
    createdAt: new Date(t.createdAt),
  }));
};

export const addMessage = async (
  threadId: string,
  message: Message
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/thread/${threadId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
  return handleResponse<{ message: string }>(response);
};

export const updateMessage = async (
  threadId: string,
  updatedMessage: Message
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/thread/${threadId}/message`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedMessage),
  });
  return handleResponse<{ message: string }>(response);
};

export const getThreadList = async (): Promise<Thread[]> => {
  const response = await fetch(`${API_BASE_URL}/threads`);
  return handleResponse<Thread[]>(response).then((t) => {
    return t.map((thread) => ({
      ...thread,
      createdAt: new Date(thread.createdAt),
    }));
  });
};

export const deleteThread = async (threadId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/thread/${threadId}`, {
    method: "DELETE",
  });
  await handleResponse(response);
};

export const updateThread = async (thread: Thread): Promise<Thread> => {
  const response = await fetch(`${API_BASE_URL}/thread/${thread.threadId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(thread),
  });
  return handleResponse<Thread>(response);
};

export const getMessages = async (threadId: string): Promise<Message[]> => {
  const response = await fetch(`${API_BASE_URL}/thread/${threadId}/messages`);
  return handleResponse<Message[]>(response);
};
