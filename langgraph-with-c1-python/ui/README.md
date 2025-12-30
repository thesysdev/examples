# LangGraph + Thesys C1 SDK UI

This is a React frontend built with Vite that demonstrates how to use the Thesys C1 SDK with a LangGraph backend.

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run the app:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:4000](http://localhost:4000) to view it in the browser.

## Features

- **Multi-turn Chat:** Persistent chat threads using LangGraph state management.
- **Streaming:** Real-time streaming of agent responses.
- **Tool Usage:** Visual feedback for tool execution within the chat.
- **Thread Management:** Create, list, rename, and delete chat threads.

## Configuration

The frontend is configured to proxy API requests to the LangGraph server (defaulting to `http://localhost:2024`). You can adjust this in `vite.config.ts`.

- `src/App.tsx`: Main application component using the `C1Chat` component and SDK hooks.
- `src/client.ts`: API client for communicating with the LangGraph server.
