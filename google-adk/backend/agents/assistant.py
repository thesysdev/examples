"""
Assistant Agent - Main conversational agent using Google Agent Development Kit (ADK).
Uses OpenAI client through ADK's LiteLLM wrapper for model-agnostic agent framework.
Integrates with C1Chat interface through streaming responses.
"""

from typing import AsyncGenerator
import os
from google.genai.types import Content, Part
from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.agents.run_config import RunConfig, StreamingMode
from config import (
    THESYS_API_KEY,
    THESYS_BASE_URL,
    THESYS_MODEL,
    SYSTEM_PROMPT,
    APP_NAME,
    USER_ID,
)


class AssistantAgent:
    """
    Assistant agent using Google ADK with OpenAI client via LiteLLM.
    Leverages ADK's agent framework while using OpenAI (or compatible) models.
    """

    def __init__(self):
        """Initialize the assistant agent with Google ADK + OpenAI."""
        # Set OpenAI API key for LiteLLM
        os.environ["OPENAI_API_KEY"] = THESYS_API_KEY
        if THESYS_BASE_URL:
            os.environ["OPENAI_API_BASE"] = THESYS_BASE_URL

        # Create LiteLLM model instance pointing to OpenAI
        model = LiteLlm(model=THESYS_MODEL)

        # Define the ADK agent with OpenAI model
        self.agent = LlmAgent(
            model=model,
            name="c1",
            instruction=SYSTEM_PROMPT,
            tools=[],  # Add tools here as needed
        )

        # Session service for managing conversation state
        self.session_service = InMemorySessionService()

        # Runner to execute agent
        self.runner = Runner(
            app_name="c1chat_assistant",
            agent=self.agent,
            session_service=self.session_service,
        )

    async def process_message(
        self, thread_id: str, user_message: str
    ) -> AsyncGenerator[str, None]:
        """
        Process a user message and stream the response using Google ADK + OpenAI.

        Args:
            thread_id: Unique identifier for the conversation thread
            user_message: The user's message content

        Yields:
            Chunks of the assistant's response in SSE format
        """
        # Create content for ADK
        content = Content(role="user", parts=[Part(text=user_message)])
        session = await self.session_service.get_session(
            app_name=APP_NAME, user_id=USER_ID, session_id=thread_id
        )

        if not session:
            # If it doesn't exist, create it explicitly
            session = await self.session_service.create_session(
                app_name=APP_NAME, user_id=USER_ID, session_id=thread_id
            )

        # Configure streaming mode for real-time chunk-by-chunk streaming
        run_config = RunConfig(
            streaming_mode=StreamingMode.SSE,
            response_modalities=["TEXT"],
        )

        # Run the agent with streaming enabled
        async for event in self.runner.run_async(
            user_id=USER_ID,
            session_id=session.id,
            new_message=content,
            run_config=run_config,
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        yield part.text


# Global agent instance
assistant_agent = AssistantAgent()
