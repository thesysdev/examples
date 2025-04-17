Example Next.js project with Thesys GenUI SDK, showing how to persist chat history, threads.

## Persistence with C1 Chat

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
