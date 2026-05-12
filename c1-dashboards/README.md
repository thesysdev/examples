# C1 Dashboards

A Next.js app that generates interactive, tool-driven dashboards using the Thesys **C1 Artifacts API** and renders them with `<C1Chat />`.

[![Built with Thesys](https://thesys.dev/built-with-thesys-badge.svg)](https://thesys.dev)

## Dashboards are a type of artifact

> **Heads up:** This example talks to the **C1 Artifacts API**, not the regular C1 chat endpoint.
>
> The Artifacts API can produce several kinds of long-lived, interactive outputs ("artifacts"). Dashboards are one such kind — specifically the **`c1app`** artifact type. Picking `c1app` is what makes the model emit a tool-driven, editable dashboard instead of a one-shot chat reply.

Two things have to line up for that to happen:

1. The OpenAI client must point at the artifact endpoint:
   ```ts
   const client = new OpenAI({
     baseURL: "https://api.thesys.dev/v1/artifact",
     apiKey: process.env.THESYS_API_KEY,
   });
   ```
2. The chat-completion request must declare the artifact type via `metadata.thesys`:
   ```ts
   metadata: {
     thesys: JSON.stringify({
       c1_artifact_type: "c1app", // <- this is what makes it a dashboard
       app: { tools, appId, title },
     }),
   }
   ```

If either is missing, you'll get a regular chat response — not a dashboard. The full wire-up is covered in the [Tools guide](#tools-guide) below; the [Thesys API reference](https://docs.thesys.dev/api-reference/models-and-compatibility) lists the other artifact types.

## Get started

1. Copy the env file and set your Thesys API key:

   ```bash
   cp example.env .env
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) and try a prompt like:

   ```
   Show me last 14 days of usage with top endpoints and an error breakdown.
   ```

---

# Tools guide

Dashboards are powered by **tools**. The model emits OpenUI Lang code with `Query("tool_name", ...)` and `Mutation("tool_name", ...)` calls; the client supplies a `**toolProvider`\*\* that fulfills those calls at render time. See the [OpenUI Lang renderer docs](https://www.openui.com/docs/openui-lang/renderer#props) for the full prop reference.

There are two halves to wire up, and the tool names must match exactly:

| Where            | What                                              | Example file in this repo               |
| ---------------- | ------------------------------------------------- | --------------------------------------- |
| Server           | Tool **definitions** (name, description, schemas) | `src/app/api/chat/mock-c1-app-tools.ts` |
| Client (browser) | `toolProvider` that runs when a tool is called    | `src/c1AppToolProvider.ts`              |

## How a tool call flows

1. Your route forwards your tool definitions to the C1 artifact endpoint via `metadata.thesys.app.tools`. The model receives them in the system prompt and uses the names, descriptions, and schemas to decide when to call each tool.
2. The model emits a dashboard that references the tool via `Query("tool_name", { args }, { defaults })` (or `Mutation` for writes). It uses `inputSchema` to pick args and `outputSchema` to know which fields it can read off the result (e.g. `metrics.totalEvents`, `metrics.data.events`).
3. `<C1Chat />` parses the streamed response, hands each tool call to your `toolProvider`, awaits the result, and feeds it back into the rendered UI.

## 1. Server: define your tools

### Point the OpenAI client at the Artifacts API

As called out above, dashboards live on the **Artifacts API** (`https://api.thesys.dev/v1/artifact`), not the standard chat endpoint. The endpoint is OpenAI-compatible, so you keep using the `openai` SDK — just override `baseURL`:

```ts
// src/app/api/chat/route.ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/artifact",
  apiKey: process.env.THESYS_API_KEY,
});
```

Using the regular `https://api.thesys.dev/v1` base URL will not produce an artifact — the request has to land on the artifact endpoint for `c1_artifact_type` to be honored.

### Declare the artifact via `metadata.thesys`

With the artifact-endpoint client in hand, tell the endpoint **which artifact type to produce** and pass the tools it can call. This is done with a `metadata.thesys` field — a JSON-stringified object — on the chat completion request:

```ts
// src/app/api/chat/route.ts
const llmStream = await client.chat.completions.create({
  model: "c1/google/gemini-3.1-pro/v-20260331",
  messages: [...],
  stream: true,
  metadata: {
    thesys: JSON.stringify({
      c1_artifact_type: "c1app",
      app: {
        tools: yourToolDefinitions,
        appId,
        title: "Usage Analytics Dashboard",
      },
    }),
  },
});
```

The `thesys` payload shape:

| Field              | Type                    | Required | Description                                                                                                           |
| ------------------ | ----------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `c1_artifact_type` | `"c1app"`               | Yes      | Selects the artifact type. `"c1app"` is the dashboard artifact — the one this example demonstrates.                   |
| `app.tools`        | `C1AppToolDefinition[]` | No       | Tools the model is allowed to call. Defaults to `[]`. See the tool-definition shape below.                            |
| `app.appId`        | `string`                | No       | Stable identifier for the dashboard. Keep it consistent across turns in the same thread so edits target the same app. |
| `app.title`        | `string`                | No       | Human-readable title shown in the artifact header.                                                                    |

Each tool definition has four fields:

```ts
{
  name: "get_usage_metrics",
  description: "Get usage metrics for the specified date range.",
  inputSchema: {
    type: "object",
    properties: {
      dateRange: {
        type: "string",
        description: 'Number of days as numeric string ("7", "14", "30")',
      },
    },
  },
  outputSchema: {
    type: "object",
    properties: {
      totalEvents: { type: "number" },
      totalUsers:  { type: "number" },
      data: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day:    { type: "string" },
            events: { type: "number" },
          },
        },
      },
    },
  },
}
```

The runtime shape your handler returns must match `outputSchema` — the model writes references like `metrics.data.events` against the schema, so missing fields render as empty.

In this example the definitions live in `src/app/api/chat/mock-c1-app-tools.ts` (the `MOCK_` prefix is a hint — they're stand-ins for what your real backend exposes). In your app, source them from wherever your tools actually come from (your service registry, an internal SDK, a generated file, etc.).

## 2. Client: wire up a `toolProvider`

Pass `toolProvider` through `customizeC1`:

```tsx
// src/app/page.tsx
<C1Chat
  processMessage={({ messages, threadId, responseId, abortController }) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, threadId, responseId }),
      signal: abortController.signal,
    })
  }
  customizeC1={{
    toolProvider: yourToolProvider,
    enableArtifactEdit: true,
  }}
/>
```

Per the [renderer spec](https://www.openui.com/docs/openui-lang/renderer#connecting-tools), `toolProvider` accepts two shapes:

**A function map** — the shortest path. Keys are tool names, values are async functions:

```ts
export const yourToolProvider = {
  get_usage_metrics: async (args) => {
    const res = await fetch(`/api/usage?days=${args.dateRange ?? 14}`);
    return res.json();
  },
  get_top_endpoints: async (args) => {
    const res = await fetch(`/api/endpoints?limit=${args.limit ?? 5}`);
    return res.json();
  },
};
```

**An MCP client** — any object with a `callTool({ name, arguments })` method, including a configured client from `@modelcontextprotocol/sdk`. Use this when you want a single dispatcher with shared logging, auth, or error handling, or when you already have an MCP server fronting your tools.

```ts
export const yourToolProvider = {
  async callTool({ name, arguments: args }) {
    const result = await handlers[name](args ?? {});
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
};
```

This example uses the MCP-client shape so it can wrap every call with logging and a simulated network delay — see `src/c1AppToolProvider.ts`. For most apps the function map is enough.

## Adding a tool

1. **Add the definition** to the array you pass into `metadata.thesys.app.tools` on the server.
2. **Register a handler** with the same `name` in your `toolProvider` on the client.

That's it. The model picks up the new tool on the next request and calls it via `Query("your_tool_name", { ...args }, { ...defaults })`.

## Using `<C1Component />` instead of `<C1Chat />`

`<C1Chat />` is a complete chat surface. If you only want the dashboard rendering — driven by your own input or fetch logic — use the lower-level `<C1Component />`. It takes the streamed c1app response text as a string; you fetch it yourself.

```tsx
"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Component } from "@thesysai/genui-sdk";
import { useState } from "react";
import { yourToolProvider } from "@/src/c1AppToolProvider";

export default function EmbeddedDashboard() {
  const [c1Response, setC1Response] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const generate = async (prompt: string) => {
    setIsStreaming(true);
    setC1Response("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: "embedded",
        responseId: crypto.randomUUID(),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += decoder.decode(value);
      setC1Response(acc);
    }
    setIsStreaming(false);
  };

  return (
    <C1Component
      c1Response={c1Response}
      isStreaming={isStreaming}
      toolProvider={yourToolProvider}
      enableArtifactEdit
    />
  );
}
```

The server-side tool definitions and the `toolProvider` shape are identical — only the host component differs. With `<C1Component />`, props that lived under `customizeC1.*` (`toolProvider`, `customComponents`, `enableArtifactEdit`) become top-level props.

## Project structure

```
├── src/
│   ├── app/
│   │   ├── api/chat/
│   │   │   ├── route.ts             # Forwards messages + tool defs to the artifact endpoint
│   │   │   └── mock-c1-app-tools.ts # Example tool definitions (replace with your own)
│   │   ├── page.tsx                 # <C1Chat /> wired with processMessage + toolProvider
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── c1AppToolProvider.ts         # Example toolProvider implementation
├── example.env
├── next.config.ts
├── package.json
└── tsconfig.json
```
