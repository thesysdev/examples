"use client";

import { ReactNode } from "react";

interface ArtifactPanelProps {
  width: number;
  children: ReactNode;
}

export function ArtifactPanel({ width, children }: ArtifactPanelProps) {
  return (
    <div
      className="bg-zinc-900 flex-1 flex flex-col h-dvh"
      style={{ width: `${width}%` }}
    >
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}

