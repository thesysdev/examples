# FastAPI With Langgraph

This is an example application demonstrating how to integrate a LangGraph chat agent with the Thesys C1 SDK (`@thesysai/genui-sdk`) using the LangGraph CLI for a persistent, multi-turn chat experience with tool usage.

[![Built with Thesys](https://thesys.dev/built-with-thesys-badge.svg)](https://thesys.dev)

## Getting Started

1.  **Run the Backend Server:** See [backend/README.md](./backend/README.md) for instructions on using `langgraph dev`.
2.  **Run the Frontend UI:** See [ui/README.md](./ui/README.md) for instructions.

## Overview

This project integrates LangGraph with the Thesys C1 SDK as follows:

1.  **LangGraph Server (via CLI):**

    - Uses `langgraph-cli` to serve the graph defined in `graph.py`.
    - Exposes a standard LangGraph API (defaulting to port `2024`) for thread management, state persistence, and streaming.
    - Configured via `langgraph.json`.

2.  **LangGraph Agent (`graph.py`):**

    - Defines agent state (`AgentState`) including `messages` and `response_id`.
    - Uses the built-in `add_messages` reducer for handling message updates/appends.
    - Configures a graph with an `agent` node (calling the C1 LLM with tools) and a `tools` node.
    - Assigns the `response_id` from the state to the final `AIMessage` ID within the `agent` node.
    - State is automatically persisted by the LangGraph server.

3.  **Frontend Integration (`ui/src/App.tsx`):**
    - Uses `@thesysai/genui-sdk` hooks (`useThreadListManager`, `useThreadManager`) and the `C1Chat` component.
    - Communicates with the LangGraph API for thread persistence and streaming.
    - Uses a custom `processMessage` handler to transform the LangGraph SSE stream into raw text chunks for the SDK.
    - Synchronizes the selected thread ID with the browser URL using `window.history`.

## Example Prompt

```
What is the weather in California?
```
