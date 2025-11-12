"use client";

import { useArtifactStream } from "../hooks/useArtifactStream";
import { Header } from "../components/Header";
import { Suggestions } from "../components/Suggestions";
import { Composer } from "../components/Composer";
import { OutputPanel } from "../components/OutputPanel";
import "@crayonai/react-ui/styles/index.css";

export default function Home() {
  const {
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
  } = useArtifactStream();

  const suggestions = [
    "Outline a 10-slide product launch presentation with section titles.",
    "Create a QBR deck structure: goals, metrics, wins, risks, roadmap.",
    "Draft a closing slide with key takeaways and next steps.",
    "Design a pitch deck outline: problem, solution, market, traction, ask.",
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-10 flex flex-col gap-8">
        <Header />

        <OutputPanel
          artifact={artifact}
          artifactType={artifactType}
          onClear={clear}
          isLoading={isLoading}
        />

        <Suggestions items={suggestions} onSelect={(s) => send(s)} />

        {error && (
          <div className="text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}

        <Composer
          prompt={prompt}
          setPrompt={setPrompt}
          artifactType={artifactType}
          onArtifactTypeChange={changeArtifactType}
          isLoading={isLoading}
          onSend={() => send()}
          onStop={stop}
        />
      </div>
    </div>
  );
}
