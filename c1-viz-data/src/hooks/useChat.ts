import { useState, useEffect } from "react";
import { extractRawDataFromStream, RawDataItem } from "@/src/utils/rawDataParser";

export function useChat() {
  const [query, setQuery] = useState("");
  const [c1Response, setC1Response] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rawData, setRawData] = useState<RawDataItem[]>([]);
  const [threadId, setThreadId] = useState<string>("");

  // Initialize thread ID on client side to avoid hydration mismatch
  useEffect(() => {
    setThreadId(crypto.randomUUID());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with query:", query, "threadId:", threadId);
    if (!query.trim() || isLoading || !threadId) {
      console.log("Form submission blocked:", {
        query: query.trim(),
        isLoading,
        threadId,
      });
      return;
    }

    setIsLoading(true);
    setC1Response("");
    setRawData([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            role: "user",
            content: query,
            id: crypto.randomUUID(),
          },
          threadId: threadId,
          responseId: crypto.randomUUID(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      let accumulatedResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        accumulatedResponse += chunk;

        // Extract raw data if present
        const parsedData = extractRawDataFromStream(chunk, accumulatedResponse);
        if (parsedData) {
          setRawData(parsedData.rawData);
          accumulatedResponse = parsedData.cleanedResponse;
        }

        setC1Response(accumulatedResponse);
      }
      // Clear the query on successful completion
      setQuery("");
    } catch (error) {
      console.error("Error:", error);
      setC1Response(
        `Sorry, there was an error processing your request: ${error}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    query,
    setQuery,
    c1Response,
    setC1Response,
    isLoading,
    rawData,
    threadId,
    handleSubmit,
  };
}

