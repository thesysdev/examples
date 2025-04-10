# [Crayon](https://crayonai.org) Template Example (TypeScript)

This is a TypeScript template demonstrating how to create forms in agent response.

## Queries to try

- "I want to subscribe to your newsletter" (Simple one step form)
- "I want to apply to a job" (Multi step form)

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

- `src/` - Contains the source code
  - `app/` - Next.js app directory with pages and layouts
    - `api/route.ts` - API endpoint for Crayon integration
- `public/` - Static assets
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.ts` - Next.js configuration

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
