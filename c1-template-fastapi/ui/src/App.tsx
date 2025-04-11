"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Chat } from "@thesysai/genui-sdk";

export default function App() {
  return <C1Chat apiUrl="/api/chat" />;
}
