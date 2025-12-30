# LangGraph Backend

This backend uses the LangGraph CLI to serve a LangGraph agent.

## Setup

1. **Install dependencies:**
   It is recommended to use a virtual environment.

   ```bash
   pip install -r requirements.txt
   ```

2. **Set API Key:**
   Export your Thesys API key as an environment variable. Create a new key on the [Thesys Console](https://chat.thesys.dev/console/keys) if you haven't already.

   ```bash
   export THESYS_API_KEY=sk-th-...
   ```

3. **Run the server:**
   Use the LangGraph CLI to start the development server:

   ```bash
   langgraph dev
   ```

   The server will be available at http://localhost:2024 by default.

## Configuration

The backend is configured via `langgraph.json`, which points to the compiled graph in `graph.py`.

- **Graph definition:** `graph.py` contains the `StateGraph` logic.
- **Tools:** `tools.py` contains the tools available to the agent.
- **Persistence:** The LangGraph development server handles thread persistence automatically.

## API Documentation

Once the server is running, you can access the interactive API documentation and the LangGraph Studio at:

- http://localhost:2024/docs
- http://localhost:2024 (LangGraph Studio)
