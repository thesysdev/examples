import logging
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import (
    List,
    AsyncIterator,
)
import os
from openai import OpenAI
from dotenv import load_dotenv  # type: ignore

from crayonai_stream import (
    CrayonMessage,
    templates_to_response_format,
    Error,
    TemplateDefinition,
    # setup_logging,
)
from crayonai_stream.integrations.openai import (
    openai_crayon_stream,
    toOpenAIMessage,
)

load_dotenv()

app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# setup_logging(logging.DEBUG)


@app.get("/")
def read_root():
    return {"status": "ok"}


class ChatRequest(BaseModel):
    messages: List[CrayonMessage]

    class Config:
        extra = "allow"  # Allow extra fields


class Recipe(BaseModel):
    title: str
    cuisine: str
    cookingTime: int
    difficulty: str
    rating: float
    servings: int
    ingredients: List[str]
    instructions: List[str]


async def generate_stream(messages: List[CrayonMessage]) -> AsyncIterator[str]:
    # Convert CrayonMessages to OpenAI format
    openai_messages = [toOpenAIMessage(msg) for msg in messages]
    try:
        response_format = templates_to_response_format(
            TemplateDefinition(
                schema=Recipe,
                name="recipe",
                description="Use this template to display a recipe",
            )
        )
        stream = client.chat.completions.create(
            messages=openai_messages,
            model="gpt-4o",
            response_format=response_format,
            stream=True,
        )
        for chunk in openai_crayon_stream(stream):
            yield chunk
    except Exception as e:
        logging.error(e)
        yield Error(error=str(e)).toSSEString()


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    return StreamingResponse(
        generate_stream(request.messages),
        media_type="text/event-stream",
    )
