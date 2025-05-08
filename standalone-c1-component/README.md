# Standalone C1 Component Demo

Example Next.js project demonstrating how to use Thesys GenUI SDK with C1 API in a standalone component context, outside of a chat interface.

## Overview

This project showcases how to integrate C1 component directly into your application without requiring a chat interface. Here's the overall flow:

1. Application renders a form with a single input field to ask for a company name or domain
2. UI makes a POST request to `/api/ask` route with user input
3. `/api/ask` route uses C1 API to generate a response
4. The response is rendered in the C1 component

C1Component usage is demonstrated in `src/app/home/HomePage.tsx`

### Setup Instructions

1. Copy .env.example to .env and set the THESYS_API_KEY

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```
