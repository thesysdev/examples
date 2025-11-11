"use client";

import { useCallback, useRef, useState } from "react";

export type ArtifactType = "slides" | "report";

export function usePresentationStream() {
  const [prompt, setPrompt] = useState("");
  const [presentation, setPresentation] = useState("");
  const [artifactType, setArtifactType] = useState<ArtifactType>("slides");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const previousPresentationRef = useRef<string>("");
  const artifactIdRef = useRef<string>("");
  const currentArtifactTypeRef = useRef<ArtifactType>("slides");

  const changeArtifactType = useCallback((newType: ArtifactType) => {
    setArtifactType(newType);
    // Clear presentation when switching artifact type
    setPresentation("");
    artifactIdRef.current = "";
    currentArtifactTypeRef.current = newType;
  }, []);

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

      // Generate new artifactId only if starting fresh (no previous presentation)
      if (!presentation) {
        artifactIdRef.current = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        currentArtifactTypeRef.current = artifactType;
      }

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            artifactType,
            artifactId: artifactIdRef.current,
            artifactContent: presentation || undefined,
          }),
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
    [prompt, presentation, artifactType, isLoading]
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
    artifactIdRef.current = "";
    setError(null);
  }, []);

  return {
    prompt,
    setPrompt,
    presentation,
    artifactType,
    changeArtifactType,
    isLoading,
    error,
    send,
    stop,
    clear,
  } as const;
}
