# Persistence with C1 Chat

Example Next.js project with Thesys GenUI SDK, showing how to persist chat history, threads.

[![Built with Thesys](https://thesys.dev/built-with-thesys-badge.svg)](https://thesys.dev)

## Get Started

1. copy .env.example to .env and set the THESYS_API_KEY

```
cp .env.example .env
```

2. install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── page.tsx          # Main page component
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── generated/           # Generated code
│   ├── services/           # Service layer
│   └── apiClient.ts        # API client configuration
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── .env                    # Environment variables
├── example.env            # Example environment variables
├── next.config.ts         # Next.js configuration
├── package.json           # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Overview

This example is a simple chat application built with Next.js, Thesys GenUI SDK, and Prisma. It allows users to have conversations with an AI assistant, and persist the chat history.

### Example prompt

```
What is the weather in New York?
```

### LLM tools

only 1 tool is supported:

```
{
  "location": "New York, NY"
}
```

### Persistence

#### UI

See: src/app/page.tsx for the usage of useThreadManager and useThreadListManager to fetch the chat history on render and other integrations with backend apis.

#### Backend

Checkout the backend code in:

1. `src/app/api/chat/route.ts` for the usage of the api/chat route to handle the tool call and persist the chat history.
2. `src/app/api/thread` and `src/app/api/threads` for Thread and Message CRUD
