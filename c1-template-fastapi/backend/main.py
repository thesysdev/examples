import logging
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import (
    List,
    AsyncIterator,
    TypedDict,
    Literal,
)
import os
from openai import OpenAI
from dotenv import load_dotenv  # type: ignore

from thread_store import Message, thread_store

from openai.types.chat import ChatCompletionMessageParam

load_dotenv()

app = FastAPI()
client = OpenAI(
    api_key=os.getenv("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/embed",
)


@app.get("/")
def read_root():
    return {"status": "ok"}


class Prompt(TypedDict):
    role: Literal["user"]
    content: str
    id: str

class ChatRequest(BaseModel):
    prompt: Prompt
    threadId: str
    responseId: str

    class Config:
        extra = "allow"  # Allow extra fields


async def generate_stream(chat_request: ChatRequest) -> AsyncIterator[str]:
    conversation_history: List[ChatCompletionMessageParam] = thread_store.get_messages(chat_request.threadId)
    conversation_history.append(chat_request.prompt)

    streamed_response = ""

    try:
        stream = client.chat.completions.create(
            messages=conversation_history,
            model="c1-nightly",
            stream=True,
        )
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                streamed_response += content
                yield content

        thread_store.append_message(chat_request.threadId, Message(
            openai_message=chat_request.prompt,
            id=chat_request.prompt['id']
        ))
        thread_store.append_message(chat_request.threadId, Message(
            openai_message={"role": "assistant", "content": streamed_response},
            id=chat_request.responseId
        ))

    except Exception as e:
        logging.error(e)
        # Simple error reporting for now
        yield "data: {\"error\": \"An internal error occurred.\"}\n\n" # Simplified error string


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    return StreamingResponse(
        generate_stream(request),
        media_type="text/event-stream",
    )
