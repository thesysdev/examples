import os
from dotenv import load_dotenv

load_dotenv()

# OpenAI Configuration (can use OpenAI, Thesys, or any OpenAI-compatible API)
THESYS_API_KEY = os.getenv("THESYS_API_KEY", "")
THESYS_BASE_URL = "https://api.thesys.dev/v1/embed"
# Use litellm format: "openai/model-name" for LiteLLM in ADK
THESYS_MODEL = "openai/c1/anthropic/claude-sonnet-4/v-20251230"

# Server Configuration
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

APP_NAME = "c1chat_assistant"
USER_ID = "unknown"

# System Prompt
SYSTEM_PROMPT = """You are a helpful AI assistant powered by Google's Agent Development Kit (ADK) with OpenAI.
You leverage ADK's agent framework for orchestration while using OpenAI models for generation.
Be friendly, concise, and helpful in your responses."""
