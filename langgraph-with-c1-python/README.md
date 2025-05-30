# FastAPI With Langgraph

This is an example FastAPI application demonstrating how to integrate a LangGraph chat agent with the Thesys C1 SDK (`@thesysai/genui-sdk`) for a persistent, multi-turn chat experience with tool usage.

## Getting Started

1.  **Run the Backend Server:** See [backend/README.md](./backend/README.md) for instructions.
2.  **Run the Frontend UI:** See [ui/README.md](./ui/README.md) for instructions.

## Overview

This project integrates LangGraph with the Thesys C1 SDK as follows:

1.  **FastAPI Backend:**
    *   Serves a `/chat` endpoint that uses LangGraph for streaming chat responses (`main.py`).
    *   Includes `/threads` endpoints for basic in-memory thread metadata management (`main.py`, `thread_service.py`).
    *   Uses an in-memory dictionary (`_thread_metadata_store` in `thread_service.py`) to store thread metadata (title, creation date).
    *   Uses `StreamingResponse` to send Server-Sent Events to the frontend.

2.  **LangGraph Agent (`graph.py`):**
    *   Defines agent state (`AgentState`) including `messages` and `response_id`.
    *   Uses the built-in `add_messages` reducer for handling message updates/appends.
    *   Configures a graph with an `agent` node (calling the C1 LLM with tools) and a `tools` node (`get_weather`).
    *   Assigns the `response_id` from the state to the final `AIMessage` ID within the `agent` node.
    *   Persists thread state using `MemorySaver`.

3.  **Frontend Integration (`ui/src/App.tsx`):**
    *   Uses `@thesysai/genui-sdk` hooks (`useThreadListManager`, `useThreadManager`) and the `C1Chat` component.
    *   Calls the FastAPI backend for thread management and chat streaming.
    *   Passes the `responseId` generated by the SDK to the `/chat` endpoint.
    *   Synchronizes the selected thread ID with the browser URL using `window.history`.

## Example Prompt

```
What is the weather in California?
```
