"use client";

import { useCallback, useRef, useState } from "react";

export type ArtifactType = "slides" | "report";

export interface Version {
  id: number;
  content: string;
  prompt: string;
  timestamp: number;
}

export function useArtifactStream() {
  const [prompt, setPrompt] = useState("");
  const [artifact, setArtifact] = useState("");
  const [artifactType, setArtifactType] = useState<ArtifactType>("slides");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(-1);

  const abortRef = useRef<AbortController | null>(null);
  const previousArtifactRef = useRef<string>("");
  const artifactIdRef = useRef<string>("");
  const currentArtifactTypeRef = useRef<ArtifactType>("slides");

  const fetchVersions = useCallback(async (artifactId: string) => {
    try {
      const res = await fetch(`/api/versions/${encodeURIComponent(artifactId)}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
        // Set current version to the latest
        if (data.versions && data.versions.length > 0) {
          setCurrentVersionIndex(data.versions.length - 1);
        }
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    }
  }, []);

  const selectVersion = useCallback((index: number) => {
    if (index >= 0 && index < versions.length) {
      setCurrentVersionIndex(index);
      setArtifact(versions[index].content);
    }
  }, [versions]);

  const changeArtifactType = useCallback((newType: ArtifactType) => {
    setArtifactType(newType);
    // Clear artifact when switching artifact type
    setArtifact("");
    artifactIdRef.current = "";
    currentArtifactTypeRef.current = newType;
    setVersions([]);
    setCurrentVersionIndex(-1);
  }, []);

  const send = useCallback(
    async (overridePrompt?: string) => {
      const text = (overridePrompt ?? prompt).trim();
      if (!text) return;
      if (isLoading) return;

      previousArtifactRef.current = artifact;
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      // Generate new artifactId only if starting fresh (no previous artifact)
      if (!artifact) {
        artifactIdRef.current = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        currentArtifactTypeRef.current = artifactType;
        setVersions([]);
        setCurrentVersionIndex(-1);
      }

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            artifactType,
            artifactId: artifactIdRef.current,
            artifactContent: artifact || undefined,
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
          setArtifact(accumulated);
        }

        accumulated += decoder.decode();
        setArtifact(accumulated);

        // Fetch updated versions after generation completes
        if (artifactIdRef.current) {
          // Small delay to ensure the server has saved the version
          setTimeout(() => {
            fetchVersions(artifactIdRef.current);
          }, 100);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setArtifact(previousArtifactRef.current);
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
    [prompt, artifact, artifactType, isLoading, fetchVersions]
  );

  const stop = useCallback(() => {
    if (isLoading) {
      setArtifact(previousArtifactRef.current);
      setError(null);
    }
    abortRef.current?.abort();
  }, [isLoading]);

  const clear = useCallback(() => {
    setArtifact("");
    artifactIdRef.current = "";
    setError(null);
    setVersions([]);
    setCurrentVersionIndex(-1);
  }, []);

  return {
    prompt,
    setPrompt,
    artifact,
    artifactType,
    changeArtifactType,
    isLoading,
    error,
    send,
    stop,
    clear,
    versions,
    currentVersionIndex,
    selectVersion,
  } as const;
}
