"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Chat } from "@thesysai/genui-sdk";
// Import the override styles. This should be the last import.
import "./c1.css";

export default function Home() {
  return <C1Chat theme={{ mode: "dark" }} apiUrl="/api/chat" />;
}
