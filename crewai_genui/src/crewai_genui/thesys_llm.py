from crewai import BaseLLM, Task
import os
import requests
from typing import List, Optional, Union, Dict, Any

class ThesysLLM(BaseLLM):
    # def __init__(self, model: str="gpt-4o-mini", temperature: Optional[float] = None):
    #     super().__init__(model=model, temperature=temperature)
    #     self.endpoint = "https://api.openai.com/v1"
    #     self.api_key = os.getenv("OPENAI_API_KEY")


    def __init__(self, model: str="c1/anthropic/claude-sonnet-4/v-20250815", temperature: Optional[float] = None):
        super().__init__(model=model, temperature=temperature)
        self.endpoint = "https://api.thesys.dev/v1/embed"
        self.api_key = os.getenv("THESYS_API_KEY")

    def call(
        self,
        messages: Union[str, List[Dict[str, str]]],
        tools: Optional[List[dict]] = None,
        **kwargs: Any
    ) -> str:
        """Call the LLM with the given messages."""
        # Convert string to message format if needed
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]

        # Prepare request
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
        }

        # Add tools if provided and supported
        if tools and self.supports_function_calling():
            payload["tools"] = tools

        # Make API call
        response = requests.post(
            self.endpoint + "/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=300
        )
        response.raise_for_status()

        result = response.json()
        return result["choices"][0]["message"]["content"]
