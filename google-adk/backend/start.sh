#!/bin/bash
# Startup script for Google ADK Python backend

echo "Starting Google ADK + C1Chat Backend"
echo "========================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found!"
    echo "Please run: python -m venv venv"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ".env file not found!"
    echo "Creating .env from env.example..."
    cp env.example .env
    echo "Created .env file - please edit it with your THESYS_API_KEY"
    exit 1
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
echo "Checking dependencies..."
if ! pip show fastapi > /dev/null 2>&1; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Start the server
echo "Starting FastAPI server..."
python main.py
