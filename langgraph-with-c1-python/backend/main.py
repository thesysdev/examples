from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from typing import AsyncIterable, List, Literal, TypedDict
from fastapi.responses import StreamingResponse

from graph import app
import thread_service
from thread_service import ThreadInfo, UIMessage


class Prompt(TypedDict):
    role: Literal["user"]
    content: str
    id: str

class ChatRequest(BaseModel):
    prompt: Prompt
    threadId: str
    responseId: str

class CreateThreadRequest(BaseModel):
    title: str

class UpdateThreadRequest(BaseModel):
    title: str

# --- FastAPI App Instance --- #
fastapi_app = FastAPI(title="LangGraph Chat API", docs_url="/docs")

# --- Core Chat Streaming Logic --- #
async def stream_langgraph_events(thread_id: str, prompt: Prompt, responseId: str) -> AsyncIterable[str]:
    """Streams LangGraph events, yielding final content chunks."""
    config = {"configurable": {"thread_id": thread_id}}
    input_message = HumanMessage(content=prompt['content'], id=prompt['id'])
    graph_input = {"messages": [input_message], "response_id": responseId}

    async for event in app.astream_events(graph_input, config=config, version="v1"):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            content = event["data"]["chunk"].content
            if content:
                yield content


@fastapi_app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Handles the chat request using LangGraph stream."""
    return StreamingResponse(
        stream_langgraph_events(request.threadId, request.prompt, request.responseId),
        media_type="text/event-stream",
    )

@fastapi_app.get("/threads", response_model=List[ThreadInfo])
def get_threads():
    """Returns a list of all threads (metadata only)."""
    return thread_service.get_thread_list()

@fastapi_app.post("/threads", response_model=ThreadInfo)
def create_thread_endpoint(request: CreateThreadRequest):
    """Creates a new thread metadata entry."""
    return thread_service.create_thread(title=request.title)

@fastapi_app.get("/threads/{thread_id}/messages", response_model=List[UIMessage])
async def get_messages_endpoint(thread_id: str):
    """Returns formatted messages for a specific thread."""
    messages = await thread_service.get_formatted_ui_messages(thread_id)
    if not messages and thread_id not in thread_service._thread_metadata_store:
         raise HTTPException(status_code=404, detail="Thread metadata not found")
    return messages

@fastapi_app.delete("/threads/{thread_id}", status_code=204)
def delete_thread_endpoint(thread_id: str):
    """Deletes a thread's metadata."""
    deleted = thread_service.delete_thread(thread_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Thread metadata not found")

@fastapi_app.put("/threads/{thread_id}", response_model=ThreadInfo)
def update_thread_endpoint(thread_id: str, request: UpdateThreadRequest):
    """Updates a thread's metadata (title)."""
    updated_thread = thread_service.update_thread(thread_id, request.title)
    if updated_thread is None:
        raise HTTPException(status_code=404, detail="Thread metadata not found")
    return updated_thread

@fastapi_app.put("/threads/{thread_id}/message")
async def update_message_endpoint(thread_id: str, message: UIMessage = Body(...)):
    """Updates a specific message (e.g., feedback)."""
    await thread_service.update_message(thread_id, message)
    return {"message": "Message update acknowledged"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(fastapi_app, host="0.0.0.0", port=8000)
