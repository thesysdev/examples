import uuid
import json
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional, Sequence, TypedDict

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from pydantic import BaseModel, Field

from graph import app


class UIMessage(TypedDict):
    id: str
    role: Literal["user", "assistant"]
    content: Optional[str]

# Metadata for each thread (stored in memory)
class ThreadMetadata(BaseModel):
    title: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Information about each thread to be sent to the client
class ThreadInfo(BaseModel):
    threadId: str
    title: str
    createdAt: datetime

# Stores metadata {thread_id: ThreadMetadata}
_thread_metadata_store: Dict[str, ThreadMetadata] = {}

def create_thread(title: str) -> ThreadInfo:
    """Creates a new thread with a unique ID and initial metadata."""
    thread_id = str(uuid.uuid4())
    metadata = ThreadMetadata(title=title)
    _thread_metadata_store[thread_id] = metadata
    print(f"In-memory thread created: {thread_id}, Title: {title}")
    return ThreadInfo(
        threadId=thread_id,
        title=metadata.title,
        createdAt=metadata.createdAt
    )

def get_thread_list() -> List[ThreadInfo]:
    """Retrieves a list of all threads, sorted by creation date descending."""
    threads = [
        ThreadInfo(threadId=tid, title=meta.title, createdAt=meta.createdAt)
        for tid, meta in _thread_metadata_store.items()
    ]
    threads.sort(key=lambda t: t.createdAt, reverse=True)
    print(f"Fetched in-memory thread list: {len(threads)} threads")
    return threads

def delete_thread(thread_id: str) -> bool:
    """Deletes a thread's metadata. Returns True if deleted, False otherwise."""
    if thread_id in _thread_metadata_store:
        del _thread_metadata_store[thread_id]
        print(f"In-memory thread metadata deleted: {thread_id}")
        return True
    else:
        print(f"Attempted to delete non-existent in-memory thread: {thread_id}")
        return False

def update_thread(thread_id: str, title: str) -> Optional[ThreadInfo]:
    """Updates the title of a thread. Returns updated ThreadInfo or None if not found."""
    metadata = _thread_metadata_store.get(thread_id)
    if metadata:
        metadata.title = title
        _thread_metadata_store[thread_id] = metadata # Update the store
        print(f"In-memory thread updated: {thread_id}, New Title: {title}")
        return ThreadInfo(
            threadId=thread_id,
            title=metadata.title,
            createdAt=metadata.createdAt
        )
    else:
        print(f"Attempted to update non-existent in-memory thread: {thread_id}")
        return None

def _format_message_content(content: any) -> Optional[str]:
    """Safely converts message content to a string."""
    if isinstance(content, str):
        return content
    elif isinstance(content, (list, dict)):
        return json.dumps(content)
    return str(content) if content is not None else None

async def get_formatted_ui_messages(thread_id: str) -> List[UIMessage]:
    """Retrieves messages from LangGraph state and formats them for the UI."""
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = await app.aget_state(config)
    raw_messages: Sequence[BaseMessage] = snapshot.values.get("messages", []) if snapshot else []
  

    formatted_messages: List[UIMessage] = []
    for i, msg in enumerate(raw_messages):
        if isinstance(msg, HumanMessage) or (isinstance(msg, AIMessage) and not msg.tool_calls):
            formatted_messages.append(UIMessage(
                id=msg.id,
                role="user" if isinstance(msg, HumanMessage) else "assistant",
                content=_format_message_content(msg.content),
            ))
    return formatted_messages

async def update_message(thread_id: str, message: UIMessage) -> None:
    """Updates a message in the LangGraph state."""
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = await app.aget_state(config)
    raw_messages: Sequence[BaseMessage] = snapshot.values.get("messages", []) if snapshot else []
    for i, msg in enumerate(raw_messages):
        if msg.id == message["id"]:
            print(f"Updating message: {msg}")
            raw_messages[i] = message
    app.update_state(config, {"messages": raw_messages})
