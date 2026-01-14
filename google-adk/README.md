# Google ADK Python + C1Chat Quickstart

A quickstart project demonstrating Google ADK's Python agent framework integrated with C1Chat for a modern conversational AI interface. This project showcases how to build a full-stack chat application using Python ADK, FastAPI, and React.

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
│  Python ADK Router  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Assistant Agent    │
│  Python ADK Agent   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Thesys API        │
│ OpenAI GPT-4 + C1   │
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

- **Python ADK Agent Framework**: Leverages Google ADK's agent system for conversational AI
- **FastAPI Backend**: High-performance async Python web server with streaming support
- **C1Chat Interface**: Modern, rich chat UI with support for custom components
- **OpenAI via Thesys**: Uses Thesys API for C1-enhanced responses with forms, tables, and custom UI
- **Real-time Streaming**: Server-sent events for responsive chat experience
- **Thread Management**: Conversation history maintained per thread
- **CORS Enabled**: Ready for local development with separate frontend/backend

## Getting Started

### Prerequisites

- **Python 3.10+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **Thesys API Key** - Get your API key from [Thesys Dashboard](https://console.thesys.dev/)

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
# Edit .env and add your THESYS_API_KEY
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

```bash
# Required: Your Thesys API key
THESYS_API_KEY=your_thesys_api_key_here

# Optional: Server port (default: 8000)
PORT=8000

# Optional: Frontend URL for CORS (default: http://localhost:5173)
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration

Edit `frontend/.env` (optional):

```bash
# Backend API URL (default: http://localhost:8000/api/chat)
VITE_API_URL=http://localhost:8000/api/chat
```

## Key Concepts

### Python ADK Agent

The `AssistantAgent` class in `backend/agents/assistant.py` demonstrates:

- Configuring OpenAI client with Thesys API base URL
- Managing conversation threads and message history
- Streaming responses asynchronously
- Error handling and logging

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

Edit `backend/agents/assistant.py` to add function calling:

```python
# Add tools parameter to OpenAI call
stream = await self.client.chat.completions.create(
    model=self.model,
    messages=messages,
    stream=True,
    tools=[...],  # Add your tools here
    tool_choice="auto"
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

- Verify `THESYS_API_KEY` is set in backend `.env`
- Check backend logs for errors
- Open browser console for frontend errors
- Test the API directly with curl

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
