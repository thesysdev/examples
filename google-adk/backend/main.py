"""
FastAPI Server for Google ADK + C1Chat Integration
Provides streaming chat endpoint compatible with C1Chat component.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn

from agents.assistant import assistant_agent
from config import PORT, FRONTEND_URL


# Request/Response Models
class ChatMessage(BaseModel):
    """Chat message model"""

    role: str
    content: str
    id: Optional[str] = None


class ChatRequest(BaseModel):
    """Chat request model compatible with C1Chat"""

    prompt: ChatMessage
    threadId: str
    responseId: Optional[str] = None


# Initialize FastAPI app
app = FastAPI(
    title="Google ADK + C1Chat API",
    description="Backend API for Google ADK with C1Chat integration",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Google ADK + C1Chat API is running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint compatible with C1Chat component.
    Streams responses from the ADK agent.

    Args:
        request: ChatRequest containing the user's message and thread ID

    Returns:
        StreamingResponse with text/event-stream content
    """
    try:
        # Extract user message
        user_message = request.prompt.content
        thread_id = request.threadId
        # Return streaming response
        return StreamingResponse(
            assistant_agent.process_message(thread_id, user_message),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        )

    except Exception as e:
        print(f"Chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print(f"Starting Google ADK + C1Chat server on port {PORT}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"API will be available at: http://localhost:{PORT}/api/chat")

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True, log_level="info")
