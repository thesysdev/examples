"use client";

import { C1Chat } from "c1";
import "@crayonai/react-ui/styles/index.css";
import "./index.css";

export default function Home() {
  return <C1Chat apiUrl="/api/chat" />;
}
