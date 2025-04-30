"use client";

import "@crayonai/react-ui/styles/index.css";
import {
  C1Chat,
  useThreadListManager,
  useThreadManager,
} from "@thesysai/genui-sdk";
import { useEffect, useState } from "react";
// --- Local Type Definitions ---

// Matches the SDK's ThreadInfo/Thread (used for listing/updating)
interface Thread {
  threadId: string;
  title: string;
  createdAt: Date;
}

// Matches the SDK's internal Message format (used in loadThread/onUpdateMessage)
interface Message {
  id: string;
  role: "user" | "assistant"; // SDK seems to restrict roles here
  content?: string | undefined; // Make content optional to match SDK error
}

// Matches the SDK's UIMessage format (likely similar to Message, but maybe allows system/tool?)
// For simplicity, let's align it closely with Message for now, adjust if C1Chat needs more.
interface UIMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool"; // Keep broader roles for our API return
  content: string | null; // Our API uses null
}

// Matches the SDK's UserMessage (likely for createThread input)
interface UserMessage {
    message?: string | null | undefined; // Flexible input content
    // Potentially other fields like id
}

// Our specific type for the first message content used in createThread API call
interface FirstMessageType {
  content: string | null;
}

// Base URL for the FastAPI backend API
const API_BASE_URL = "/api"; // Adjust if your proxy/setup is different

export default function App() {
  // Removed Next.js router/searchParams hooks

  // State to track the selected thread ID internally if needed, though hooks might manage it
  // const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // --- API Fetch Functions ---

  const fetchThreadList = async (): Promise<Thread[]> => { // Return Thread[]
    const response = await fetch(`${API_BASE_URL}/threads`);
    if (!response.ok) {
      throw new Error("Failed to fetch threads");
    }
    const threads = await response.json();
    // Ensure the returned objects match the Thread interface
    return threads.map((t: any) => ({ 
        threadId: t.threadId,
        title: t.title, 
        createdAt: new Date(t.createdAt) 
    }));
  };

  const deleteThread = async (threadId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete thread");
    }
  };

  const updateThreadAPI = async (threadId: string, name: string ): Promise<Thread | null> => { // Return Thread | null
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name }),
    });
    if (!response.ok) {
      console.error("Failed to update thread API");
      return null;
    }
    const updatedThread = await response.json();
    // Ensure the returned object matches the Thread interface
    return { 
        threadId: updatedThread.threadId, 
        title: updatedThread.title, 
        createdAt: new Date(updatedThread.createdAt) 
    };
  };

  const updateThreadHookWrapper = async (updated: Thread): Promise<Thread> => {
      console.log("updateThreadHookWrapper called with:", updated);
      // We need the new name (title) to call our API
      // Assuming the C1Chat component passes the updated Thread object with the new title
      const result = await updateThreadAPI(updated.threadId, updated.title);
      if (result) {
          // Return the Thread object matching the expected format
          return { ...updated, title: result.title, createdAt: result.createdAt };
      }
      // If the API call fails, return the original object or throw error
      // Returning original might prevent UI update which could be confusing
      // Throwing might be better but requires error handling in the hook/component
      console.error("Update failed, returning original thread data to hook");
      return updated; // Return original thread data as fallback
  };

  // This function makes the actual API call to create
  const createThreadAPI = async (firstMessageContent: string | null): Promise<Thread> => { // Return Thread
    const initialName = firstMessageContent || "New Chat";
    const response = await fetch(`${API_BASE_URL}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: initialName }),
    });
    if (!response.ok) {
      throw new Error("Failed to create thread");
    }
    const newThread = await response.json();
    // Ensure the returned object matches the Thread interface
    return { 
        threadId: newThread.threadId,
        title: newThread.title,
        createdAt: new Date(newThread.createdAt) 
    };
  };

  // This wrapper matches the signature expected by useThreadListManager
  const createThreadHookWrapper = async (firstMessage: UserMessage): Promise<Thread> => {
    // Extract content, handling potential null/undefined
    const content = firstMessage.message ?? null;
    // Call our API function
    return createThreadAPI(content);
  };

  const loadThread = async (threadId: string): Promise<Message[]> => { // Return Message[]
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}/messages`);
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error("Failed to load messages");
    }
    const messagesFromApi: UIMessage[] = await response.json();
    // Convert API response (UIMessage[]) to SDK expectation (Message[])
    return messagesFromApi
        .filter(msg => msg.role === 'user' || msg.role === 'assistant') // Filter roles
        .map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content ?? undefined, // Convert null to undefined
        }));
  };

  const updateMessage = async (threadId: string, message: Message): Promise<void> => { // Accept SDK Message type
    console.log("updateMessage called with:", message);
    // Convert SDK Message to our UIMessage format for the API call
    const messageForApi: UIMessage = {
        id: message.id,
        role: message.role,
        content: message.content ?? null, // Convert undefined to null
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

  // --- Hooks Setup ---
  const threadListManager = useThreadListManager({
    fetchThreadList,
    deleteThread,
    updateThread: updateThreadHookWrapper,
    onSwitchToNew: () => {
      console.log("Switched to new thread view");
      // Update URL: Remove the threadId parameter
      const currentPath = window.location.pathname; // Get path without query string
      window.history.replaceState(null, '', currentPath);
    },
    onSelectThread: (threadId: string) => {
      console.log("Selected thread:", threadId);
      // Update URL: Add/update the threadId parameter
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("threadId", threadId);
      window.history.replaceState(null, '', currentUrl.toString());
    },
    createThread: createThreadHookWrapper,
  });

  const threadManager = useThreadManager({
    threadListManager,
    loadThread,
    onUpdateMessage: ({ message }: { message: Message }) => {
      if (threadListManager.selectedThreadId) {
         updateMessage(threadListManager.selectedThreadId, message);
      }
    },
    apiUrl: `${API_BASE_URL}/chat`,
  });

  // --- Effect for Initial Load (Re-added) ---
  useEffect(() => {
    // Check URL for threadId on initial load
    const searchParams = new URLSearchParams(window.location.search);
    const threadIdFromUrl = searchParams.get("threadId");

    if (threadIdFromUrl && threadListManager.selectedThreadId !== threadIdFromUrl) {
      console.log("Selecting thread from URL:", threadIdFromUrl);
      threadListManager.selectThread(threadIdFromUrl);
    }
    // Run only on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Render Component ---

  return (
    <C1Chat
      threadManager={threadManager}
      threadListManager={threadListManager}
    />
  );
}
