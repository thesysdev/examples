# Editable Table Demo

A Next.js demo showcasing an AI-powered editable table using [Thesys C1](https://thesys.dev) generative UI. The AI assistant can view and update table data through natural language commands, with changes reflected in real-time via the `EditableTable` component.

[![Built with Thesys](https://thesys.dev/built-with-thesys-badge.svg)](https://thesys.dev)

## Features

- **Natural Language Table Management** - Ask the AI to view or update table data using plain English
- **Tool-Based Architecture** - Uses OpenAI function calling with `view_table` and `update_row` tools
- **Streaming Responses** - Real-time streaming of AI responses for a responsive UX
- **Generative UI** - The `EditableTable` component is dynamically rendered by C1

## How It Works

1. User sends a natural language request (e.g., "Show me the table" or "Update Alice's status to inactive")
2. The AI assistant uses tools to interact with an in-memory data store:
   - `view_table` - Retrieves all table rows
   - `update_row` - Updates a specific row by ID (name, email, or status)
3. C1 generates an `EditableTable` component to display the data
4. Users can interact with the table, and actions are sent back to the AI

## Project Structure

```
src/
├── app/
│   ├── api/chat/
│   │   ├── route.ts        # API endpoint handling chat + tool execution
│   │   └── messageStore.ts # Thread-based message history
│   └── page.tsx            # Main UI with C1Component
└── lib/
    ├── tableStore.ts       # In-memory table data + CRUD operations
    └── tableTools.ts       # OpenAI tool definitions
```

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- A Thesys API key from [Thesys Console](https://chat.thesys.dev/console/keys)

### Setup

1. Set your API key:

```bash
export THESYS_API_KEY=<your-api-key>
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Example Prompts

- "Show me the table"
- "What's Bob's current status?"
- "Change Charlie's email to charlie.brown@example.com"
- "Set Diana's status to pending"

## Sample Data

The demo includes pre-populated sample data:

| ID | Name          | Email                  | Status   |
|----|---------------|------------------------|----------|
| 1  | Alice Johnson | alice@example.com      | active   |
| 2  | Bob Smith     | bob@example.com        | inactive |
| 3  | Charlie Brown | charlie@example.com    | pending  |
| 4  | Diana Ross    | diana@example.com      | active   |

## Learn More

- [Thesys C1 Documentation](https://docs.thesys.dev)
- [C1 Component Library](https://docs.thesys.dev/components)

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fthesysdev%2Fexamples%2Ftree%2Fmain%2Feditable-table&env=THESYS_API_KEY&envDescription=Thesys%20API%20key&envLink=https%3A%2F%2Fchat.thesys.dev%2Fconsole%2Fkeys)
