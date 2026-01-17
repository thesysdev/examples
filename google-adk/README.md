# Google ADK + C1Chat Example

A full-stack chat application demonstrating Google's Agent Development Kit (ADK) integrated with C1Chat for a modern conversational AI interface. This project showcases how to use Google ADK's agentic framework with FastAPI and React.

## Architecture

```
┌─────────────────────┐
│  React + Vite       │
│  C1Chat Component   │
└──────────┬──────────┘
           │ POST /api/chat
           │
┌──────────▼──────────┐
│  FastAPI Server     │
│  Streaming Router   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Assistant Agent    │
│  Google ADK Agent   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Google GenAI      │
│ Gemini 2.0 Flash    │
└─────────────────────┘
```

## Project Structure

```
google-adk/
├── backend/                 # Python ADK + FastAPI backend
│   ├── agents/
│   │   ├── __init__.py
│   │   └── assistant.py     # Main assistant agent with OpenAI/Thesys
│   ├── main.py              # FastAPI server with streaming endpoints
│   ├── config.py            # Configuration management
│   ├── requirements.txt     # Python dependencies
│   └── env.example          # Environment variables template
├── frontend/                # React + Vite + C1Chat frontend
│   ├── src/
│   │   ├── App.tsx          # Main app with C1Chat integration
│   │   ├── main.tsx         # Vite entry point
│   │   ├── index.css        # Styles with C1 imports
│   │   └── vite-env.d.ts    # TypeScript declarations
│   ├── index.html           # HTML entry point
│   ├── package.json         # Node dependencies
│   ├── vite.config.ts       # Vite configuration
│   ├── tsconfig.json        # TypeScript config
│   └── env.example          # Environment variables template
└── README.md                # This file
```

## Features

- **Google ADK Agent Framework**: Uses Google's ADK for agent orchestration, tools, and session management
- **OpenAI via LiteLLM**: Connects to OpenAI (or compatible APIs like Thesys) through ADK's LiteLLM wrapper
- **Model Agnostic**: Switch between OpenAI, Anthropic, or other providers without changing agent code
- **FastAPI Backend**: High-performance async Python web server with streaming support
- **C1Chat Interface**: Modern, rich chat UI with support for custom components
- **Real-time Streaming**: Server-sent events for responsive chat experience
- **ADK Session Management**: Built-in conversation history and state management via ADK
- **CORS Enabled**: Ready for local development with separate frontend/backend

## Getting Started

### Prerequisites

- **Python 3.10+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/)
  - OR **Thesys API Key** - Get from [Thesys Dashboard](https://console.thesys.dev/) (OpenAI-compatible with C1)

### Installation

#### 1. Clone and Navigate

```bash
cd google-adk
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env and add your OPENAI_API_KEY (or THESYS_API_KEY for Thesys)
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Set up environment variables (optional)
cp env.example .env
# The default settings work for local development
```

## Running the Application

You'll need **two terminal windows** - one for backend, one for frontend.

### Terminal 1: Start Backend

```bash
cd backend
source venv/bin/activate  # Activate venv if not already active
python main.py
```

The backend will start on `http://localhost:8000`

You should see:

```
Starting Google ADK + C1Chat server on port 8000
Frontend URL: http://localhost:5173
API will be available at: http://localhost:8000/api/chat
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

You should see the C1Chat interface ready to use!

## Configuration

### Backend Configuration

Edit `backend/.env`:

**Option 1: Using OpenAI directly:**
```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=openai/gpt-4o
PORT=8000
FRONTEND_URL=http://localhost:5173
```

**Option 2: Using Thesys API (OpenAI-compatible with C1 components):**
```bash
OPENAI_API_KEY=your_thesys_api_key_here
OPENAI_BASE_URL=https://api.thesys.dev/v1/embed/
OPENAI_MODEL=openai/c1/anthropic/claude-sonnet-4/v-20251130
PORT=8000
FRONTEND_URL=http://localhost:5173
```

**Option 3: Using alternative naming (auto-mapped):**
```bash
THESYS_API_KEY=your_thesys_api_key_here
THESYS_BASE_URL=https://api.thesys.dev/v1/embed/
PORT=8000
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration

Edit `frontend/.env` (optional):

```bash
# Backend API URL (default: http://localhost:8000/api/chat)
VITE_API_URL=http://localhost:8000/api/chat
```

## Key Concepts

### Google ADK with OpenAI

The `AssistantAgent` class in `backend/agents/assistant.py` demonstrates the hybrid approach:

- **Google ADK Framework**: Uses `LlmAgent`, `Runner`, and `InMemorySessionService` from ADK
- **LiteLLM Integration**: Connects OpenAI models through ADK's `LiteLlm` wrapper
- **Model Format**: Uses `"openai/model-name"` format for LiteLLM
- **Session Management**: ADK handles conversation state automatically
- **Fallback Mode**: Automatically falls back to direct OpenAI client if ADK not available

**Key Benefits:**
- Use ADK's tools, orchestration, and session management
- Keep your preferred model provider (OpenAI, Thesys, etc.)
- Switch models without changing agent code
- Add ADK tools and capabilities easily

### FastAPI Integration

The `main.py` file shows:

- Setting up FastAPI with CORS middleware
- Creating streaming endpoints compatible with C1Chat
- Request/response models using Pydantic
- Health check endpoints

### C1Chat Component

The frontend `App.tsx` demonstrates:

- Importing and using the C1Chat component
- Configuring the API endpoint
- Basic styling and layout

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate

# Run with auto-reload (default in main.py)
python main.py

# Or run with uvicorn directly
uvicorn main:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing the API

### Health Check

```bash
curl http://localhost:8000/health
```

### Chat Endpoint

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "role": "user",
      "content": "Hello!"
    },
    "threadId": "test-thread-123"
  }'
```

### Get Thread History

```bash
curl http://localhost:8000/api/threads/test-thread-123
```

## Customization

### Adding Tools to the Agent

Edit `backend/agents/assistant.py` to add ADK tools:

```python
from google.adk.tools.google_search_tool import GoogleSearchTool

# In __init__, add tools to the agent
self.agent = LlmAgent(
    model=model,
    name="c1chat_assistant",
    instruction=SYSTEM_PROMPT,
    tools=[GoogleSearchTool(bypass_multi_tools_limit=True)]  # Add your tools
)
```

### Customizing the System Prompt

Edit `backend/config.py`:

```python
SYSTEM_PROMPT = """Your custom system prompt here..."""
```

### Adding Custom C1 Components

C1 automatically supports custom components. Define schemas in your agent responses to render rich UI elements like forms, tables, charts, and more.

## Resources

- [Google ADK Documentation](https://adk.iqai.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Thesys C1 Documentation](https://docs.thesys.dev/)
- [C1Chat Component Guide](https://docs.thesys.dev/guides/conversational/getting-started)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## Contributing

This is a quickstart example. Feel free to:

- Add more agents and routing logic
- Implement persistent storage (database)
- Add authentication and authorization
- Create custom C1 components
- Enhance error handling and logging
- Add unit and integration tests

## License

MIT License - feel free to use this as a starting point for your projects!

## Troubleshooting

### Backend won't start

- Ensure Python 3.10+ is installed: `python --version`
- Check that virtual environment is activated
- Verify all dependencies installed: `pip list`
- Make sure port 8000 is available

### Frontend won't connect to backend

- Verify backend is running on port 8000
- Check CORS settings in `backend/main.py`
- Ensure `VITE_API_URL` is correct in frontend `.env`

### Chat not working

- Verify `OPENAI_API_KEY` (or `THESYS_API_KEY`) is set in backend `.env`
- Check backend logs for errors
- Open browser console for frontend errors
- Test the API directly with curl
- If using Thesys, verify `OPENAI_BASE_URL` is set correctly

### Dependencies issues

- Backend: Try `pip install --upgrade pip` then reinstall
- Frontend: Delete `node_modules` and `package-lock.json`, then `npm install`

## Next Steps

- Explore the [Thesys C1 examples](https://docs.thesys.dev/examples) for more advanced usage
- Add persistent storage with PostgreSQL or MongoDB
- Implement user authentication
- Deploy to production (e.g., Railway, Render, Vercel)
- Add more ADK agents for specific tasks
- Implement tool calling for external API integrations

---

**Happy Building!**
