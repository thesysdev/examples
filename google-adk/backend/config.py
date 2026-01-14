import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
THESYS_API_KEY = os.getenv("THESYS_API_KEY", "")
THESYS_BASE_URL = "https://api.thesys.dev/v1/embed/"

# C1 Model Configuration
C1_MODEL = "c1/anthropic/claude-sonnet-4/v-20251130"

# Server Configuration
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# System Prompt
SYSTEM_PROMPT = """You are a helpful AI assistant powered by Google ADK and C1.
Be friendly, concise, and helpful in your responses."""
