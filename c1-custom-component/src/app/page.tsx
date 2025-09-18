"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Chat, ThemeProvider } from "@thesysai/genui-sdk";
import { FlightList, SeatSelector, BookingSummary } from "./components";

export default function Home() {
  return (
    <ThemeProvider mode="dark">
      <C1Chat
        apiUrl="/api/chat"
        customizeC1={{
          customComponents: { FlightList, SeatSelector, BookingSummary },
        }}
      />
    </ThemeProvider>
  );
}
