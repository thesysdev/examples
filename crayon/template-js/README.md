# Crayon Template Example (JavaScript)

This is a JavaScript template demonstrating how to use the [Crayon](https://crayonai.org) with Next.js.

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
    - `api/route.js` - API endpoint for Crayon integration
- `public/` - Static assets
- `tailwind.config.js` - Tailwind CSS configuration
- `next.config.mjs` - Next.js configuration

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the production application
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint for code linting

## Technologies Used

- Next.js
- React
- JavaScript
- Tailwind CSS
- Crayon
