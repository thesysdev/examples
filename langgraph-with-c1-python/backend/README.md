# FastAPI Backend

A simple FastAPI server with a `/chat` endpoint.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn main:app --reload
```

The server will be available at http://localhost:8000

## API Endpoints

- `GET /`: Health check endpoint
- `POST /chat`: Chat endpoint that accepts JSON with a "message" field

## API Documentation

Once the server is running, you can access the auto-generated API documentation at:
- http://localhost:8000/docs
- http://localhost:8000/redoc
