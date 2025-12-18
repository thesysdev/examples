# Gemini C1 Artifact Agent

A Google Gemini-powered agent that can generate rich artifacts (presentations and reports) using Thesys C1.

## Features

- **Gemini Agent**: Uses Google's Gemini model for intelligent conversation
- **C1 Artifacts**: Generates beautiful presentations and reports via tool calling
- **Split-Pane UI**: Chat on the left, artifacts render on the right when generated
- **Streaming**: Real-time streaming of both chat responses and artifact generation

## Setup

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Copy the environment example and add your API keys:

```bash
cp env.example .env.local
```

Add your keys to `.env.local`:

- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/apikey)
- `THESYS_API_KEY` - Get from [Thesys Console](https://console.thesys.dev/keys)

3. Run the development server:

```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Usage

Ask the agent to create presentations or reports:

- "Create a presentation about renewable energy"
- "Generate a report on AI trends in 2025"
- "Make a 5-slide deck about our product launch"

The artifact will automatically appear in the right panel when generated.

## Architecture

```
User → Chat UI → Next.js API → Gemini (with tools) → C1 Artifacts API → Rendered Artifact
```

The Gemini agent has access to `create_artifact` and `edit_artifact` tools that call the Thesys C1 Artifacts API to generate rich, interactive content.
