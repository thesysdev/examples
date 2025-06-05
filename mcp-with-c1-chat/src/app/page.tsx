"use client";

import { C1Chat } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

export default function Home() {
  return (
    <C1Chat agentName="MCP + C1" apiUrl="/api/chat" theme={{ mode: "dark" }} />
  );
}
