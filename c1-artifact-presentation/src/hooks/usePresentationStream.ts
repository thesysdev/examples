"use client";

import { useCallback, useRef, useState } from "react";

export function usePresentationStream() {
  const [prompt, setPrompt] = useState("");
  const [presentation, setPresentation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const previousPresentationRef = useRef<string>("");

  const send = useCallback(
    async (overridePrompt?: string) => {
      const text = (overridePrompt ?? prompt).trim();
      if (!text) return;
      if (isLoading) return;

      previousPresentationRef.current = presentation;
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, presentation }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const message = await res.text();
          throw new Error(message || "Failed to fetch");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setPresentation(accumulated);
        }

        accumulated += decoder.decode();
        setPresentation(accumulated);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setPresentation(previousPresentationRef.current);
          setError(null);
        } else {
          const message =
            err instanceof Error ? err.message : "Something went wrong";
          setError(message);
        }
      } finally {
        setIsLoading(false);
        setPrompt("");
        abortRef.current = null;
      }
    },
    [prompt, presentation, isLoading]
  );

  const stop = useCallback(() => {
    if (isLoading) {
      setPresentation(previousPresentationRef.current);
      setError(null);
    }
    abortRef.current?.abort();
  }, [isLoading]);

  const clear = useCallback(() => {
    setPresentation("");
    setError(null);
  }, []);

  return {
    prompt,
    setPrompt,
    presentation,
    isLoading,
    error,
    send,
    stop,
    clear,
  } as const;
}
