# FastAPI Backend

A simple FastAPI server with a `/chat` endpoint.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set API Key: Export your Thesys API key as an environment variable. Create a new key on the [Thesys Console](https://chat.thesys.dev/console/keys) if you haven't already.
```bash
export THESYS_API_KEY=sk-th-...
```

3. Run the server:
```bash
uvicorn main:fastapi_app --reload
```

The server will be available at http://localhost:8000

## API Endpoints

- `GET /`: Health check endpoint
- `POST /chat`: Chat endpoint that accepts JSON with a "message" field

## API Documentation

Once the server is running, you can access the auto-generated API documentation at:
- http://localhost:8000/docs
- http://localhost:8000/redoc
