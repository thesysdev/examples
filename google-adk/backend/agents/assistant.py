"""
Assistant Agent - Main conversational agent for the C1Chat interface.
Uses OpenAI client configured with Thesys API for C1 component support.
"""

from typing import Dict, List, Any, AsyncGenerator
from openai import AsyncOpenAI
import json
from config import THESYS_API_KEY, THESYS_BASE_URL, C1_MODEL, SYSTEM_PROMPT


class AssistantAgent:
    """
    Assistant agent that handles conversations using OpenAI through Thesys API.
    Supports streaming responses and maintains conversation history per thread.
    """

    def __init__(self):
        """Initialize the assistant agent with OpenAI client configured for Thesys API."""
        self.client = AsyncOpenAI(
            api_key=THESYS_API_KEY,
            base_url=THESYS_BASE_URL
        )
        self.model = C1_MODEL
        self.system_prompt = SYSTEM_PROMPT
        # Thread-based message storage (in production, use a proper database)
        self.threads: Dict[str, List[Dict[str, Any]]] = {}

    def _get_or_create_thread(self, thread_id: str) -> List[Dict[str, Any]]:
        """Get or create a thread's message history."""
        if thread_id not in self.threads:
            self.threads[thread_id] = [
                {"role": "system", "content": self.system_prompt}
            ]
        return self.threads[thread_id]

    def _add_message(self, thread_id: str, message: Dict[str, Any]):
        """Add a message to the thread history."""
        messages = self._get_or_create_thread(thread_id)
        messages.append(message)

    async def process_message(
        self,
        thread_id: str,
        user_message: str
    ) -> AsyncGenerator[str, None]:
        """
        Process a user message and stream the response.

        Args:
            thread_id: Unique identifier for the conversation thread
            user_message: The user's message content

        Yields:
            Chunks of the assistant's response
        """
        # Add user message to history
        self._add_message(thread_id, {
            "role": "user",
            "content": user_message
        })

        # Get message history
        messages = self._get_or_create_thread(thread_id)

        # Stream response from OpenAI
        response_content = ""

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.7
            )

            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        content = delta.content
                        response_content += content
                        yield content

            # Add assistant response to history
            self._add_message(thread_id, {
                "role": "assistant",
                "content": response_content
            })

        except Exception as e:
            error_msg = f"Error processing message: {str(e)}"
            yield error_msg
            self._add_message(thread_id, {
                "role": "assistant",
                "content": error_msg
            })


# Global agent instance
assistant_agent = AssistantAgent()
