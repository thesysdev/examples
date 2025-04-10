"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Chat } from "@thesysai/genui-sdk";

export default function Home() {
  return <C1Chat theme={{ mode: "dark" }} apiUrl="/api/chat" />;
}
