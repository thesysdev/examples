"use client";

import { C1Chat, ArtifactViewMode } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

export default function Home() {
  return (
    <C1Chat
      apiUrl="/api/chat"
      agentName="Artifact Assistant"
      customizeC1={{
        artifactViewMode: ArtifactViewMode.AUTO_OPEN,
      }}
    />
  );
}
