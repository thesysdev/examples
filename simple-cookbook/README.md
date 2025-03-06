# Simple Cookbook Example (TypeScript)

This is a TypeScript example demonstrating how to create a simple cookbook application using Crayon and Next.js.

## Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (v8 or higher recommended)
- OpenAI API key

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Set up your environment variables:
   - Create a `.env.local` file in the root directory
   - Add your OpenAI API key:
```bash
OPENAI_API_KEY=your_api_key_here
```

3. Run the development server:
```bash
pnpm dev
```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/` - Source code directory
  - `app/` - Next.js app directory containing pages and layouts
    - `templates/` - Crayon response templates for structuring AI outputs
  - `types/` - TypeScript schema definitions for recipe data
- `public/` - Static assets directory

## Features

- Generate recipes based on available ingredients
- Get cooking instructions and ingredient measurements
- Simple and intuitive user interface
- Real-time recipe generation using AI

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the production application
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint for code linting

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Crayon
