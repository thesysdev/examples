import asyncio
import os
import streamlit as st
import streamlit_thesys as thesys
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_core.models import ModelInfo

model_client = OpenAIChatCompletionClient(
    base_url="https://api.thesys.dev/v1/embed",
    api_key=os.getenv("THESYS_API_KEY"),
    model="c1/anthropic/claude-sonnet-4/v-20250815",
    model_info=ModelInfo(
        vision=False,
        function_calling=True,
        json_output=False,
        family="unknown",
        structured_output=True,
    ),
)


# Define a simple function tool that the agent can use.
# For this example, we use a fake weather tool for demonstration purposes.
async def get_weather(city: str) -> str:
    """Get the weather for a given city."""
    return f"The weather in {city} is 73 degrees and Sunny."


# Define an AssistantAgent with the model, tool, system message, and reflection enabled.
# The system message instructs the agent via natural language.
agent = AssistantAgent(
    name="weather_agent",
    model_client=model_client,
    tools=[get_weather],
    system_message="You are a helpful assistant.",
    reflect_on_tool_use=True,
    model_client_stream=True,  # Enable streaming tokens from the model client.
)


# Run the agent and stream the messages to the console.
async def main() -> None:
    st.title("Autogen Generative UI Chat")
    task = st.text_input("Enter a task:", value="What is the weather in New York?")
    if st.button("Run"):
        with st.spinner("Running..."):
            result = await agent.run(task=task)
            if result.messages:
                final_message = result.messages[-1]  # Get the last message
                thesys.render_response(final_message.content)

    await model_client.close()


if __name__ == "__main__":
    asyncio.run(main())
