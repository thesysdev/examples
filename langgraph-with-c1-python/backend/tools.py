import random
from langchain_core.tools import tool
from pydantic import BaseModel, Field

class WeatherInput(BaseModel):
    location: str = Field(description="The location for which to get the weather.")

@tool(args_schema=WeatherInput)
def get_weather(location: str) -> str:
    """Get the current weather for the given location."""
    weathers = ["sunny", "cloudy", "rainy", "snowy", "windy", "foggy"]
    return f"The weather in {location} is currently {random.choice(weathers)}."

# List of tools to be used by the agent
runnable_tools = [get_weather] 
