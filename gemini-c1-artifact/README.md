# Gemini C1 Artifact Agent

A Google Gemini-powered agent that can generate rich artifacts (presentations and reports) using Thesys C1.

## Features

- **Gemini Agent**: Uses Google's Gemini model for intelligent conversation and tool calling
- **C1 Artifacts**: Generates beautiful presentations and reports via the Thesys C1 API
- **Split-Pane UI**: Chat on the left, artifacts render on the right when generated
- **Real-time Streaming**: Both chat responses and artifact generation stream in real-time
- **Artifact Editing**: Edit previously created artifacts with natural language instructions

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

To edit an artifact, simply ask:

- "Add a slide about market analysis"
- "Change the title to 'Q4 Results'"
- "Make the introduction more engaging"

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌───────────────┐
│   Browser   │────▶│  Next.js API     │────▶│  Google Gemini  │────▶│  C1 Artifacts │
│  (React UI) │◀────│  (SSE Stream)    │◀────│  (Tool Calling) │◀────│     API       │
└─────────────┘     └──────────────────┘     └─────────────────┘     └───────────────┘
```

### Data Flow

1. **User sends message** → Frontend sends POST to `/api/chat` with prompt, threadId, responseId
2. **Server initializes** → Creates SSE stream, stores user message, builds conversation history
3. **Gemini processes** → Streams text response and/or calls `create_artifact`/`edit_artifact` tools
4. **Artifact generation** → Tool handler calls C1 API, streams artifact markup back
5. **Client receives** → SSE events (`text` and `artifact`) update UI in real-time
6. **Storage** → Assistant message and artifact content stored server-side for conversation continuity

### File Structure

```
src/app/
├── page.tsx                    # Main React component with chat UI and artifact panel
├── globals.css                 # Tailwind CSS styles
├── layout.tsx                  # Root layout with fonts
└── api/chat/
    ├── route.ts                # POST handler - orchestrates Gemini + C1 streaming
    ├── artifact.ts             # Artifact creation/editing logic
    ├── constants.ts            # Model names and API URLs
    ├── messageStore.ts         # In-memory conversation storage (demo only)
    ├── systemPrompt.ts         # Gemini system instructions
    └── tools.ts                # Gemini function declarations for artifacts
```

### Key Concepts

#### Server-Sent Events (SSE)

The API streams responses using SSE with two event types:

- `text` - Chat text content from Gemini
- `artifact` - C1 artifact markup for rendering

```
event: text
data: {"content": "I'll create a presentation for you."}

event: artifact
data: {"content": "<c1-artifact type=\"slides\">..."}
```

#### Tool Calling

Gemini uses function calling to decide when to create/edit artifacts:

- `create_artifact(instructions, artifactType)` - Creates a new presentation or report
- `edit_artifact(artifactId, version, instructions)` - Modifies an existing artifact

#### Message Storage

Messages are stored server-side with artifact content indexed separately for quick lookup during edits. This is an in-memory store for demo purposes - use a database in production.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **AI**: Google Gemini (`@google/genai`)
- **Artifacts**: Thesys C1 SDK (`@thesysai/genui-sdk`)
- **Streaming**: Server-Sent Events (SSE)
