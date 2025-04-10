# fino-crayon

This next.js application uses Crayon and OpenAI to create a chat agent. This is an end to end application that implements database to persist conversations.

## Key Technologies

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- OpenAI
- pnpm

## Getting Started

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

    _Note: This project uses local Crayon packages (`@crayonai/_`). Ensure these are built or linked correctly within the parent workspace.\*

2.  **Environment Variables:**
    Copy the example environment file and fill in the necessary values (e.g., OpenAI API key, database connection string):

    ```bash
    cp .example.env .env
    ```

3.  **Database Setup:**
    The `prepare` script linked to `pnpm install` should handle Prisma migrations and client generation. You can also run it manually if needed:

    ```bash
    pnpm run prepare
    # Runs: prisma generate && prisma db push
    ```

4.  **Run the development server:**
    ```bash
    pnpm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the main page by modifying `src/app/page.tsx`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
