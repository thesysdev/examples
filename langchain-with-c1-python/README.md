# LangChain with Thesys C1 Python Example

This repo is a simple example of a natural language to sql query processing using Langchain and Generative UI API C1 by Thesys. The backend is a Python server powered by [FastAPI](https://fastapi.tiangolo.com/) and [LangServe](https://python.langchain.com/docs/langserve), and it can answer natural language questions about the Chinook sample database.

## Project Structure

- `frontend/`: (Placeholder) A directory for a potential frontend application.
- `backend/`: A Python-based backend that exposes a LangChain agent as a REST API.

## How to Run

### Backend

1.  **Navigate to the backend directory, create and activate a virtual environment, and install dependencies:**
    ```bash
    cd backend
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

2.  **Set up the environment variables and run the server:**

    You'll need a Thesys API key to run this example. Export it as an environment variable before running the server:
    ```bash
    export THESYS_API_KEY="your-api-key"
    python main.py
    ```
    The server will start on `http://localhost:4001`. You can access the API documentation at `http://localhost:4001/docs`.

### Frontend

1.  **Navigate to the frontend directory, install dependencies and run the UI:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    The UI will be available at `http://localhost:5173`.

## What This Application Does

This application demonstrates how to build an intelligent SQL query assistant using LangChain and Thesys C1. Here's how it works:

1. **Natural Language Processing**: Users can ask questions in plain English about the music store data
2. **SQL Generation**: The LangChain agent powered by Thesys C1 converts natural language questions into appropriate SQL queries
3. **Database Execution**: The generated SQL queries are executed against the Chinook SQLite database
4. **Formatted Results**: Query results are returned in a human-readable format

The Chinook database contains information about a digital media store, including:
- **Artists, Albums, and Tracks**: Music catalog data
- **Customers**: Customer information and purchase history
- **Employees**: Staff information and sales data
- **Playlists**: User-created playlists
- **Invoices**: Sales transactions and billing

## Sample Queries to Try

Once you have the application running, you can try asking questions like:

- "How many albums does each artist have?"
- "What are the top 5 best-selling tracks?"
- "Show me all customers from Canada"
- "Which employee has made the most sales?"
- "What genres are available in the store?"
- "Find all albums by Led Zeppelin"
- "What's the total revenue for each country?"
- "Show me the longest tracks in the database"
- "Which playlists contain jazz music?"
- "What are the most popular media types?"
