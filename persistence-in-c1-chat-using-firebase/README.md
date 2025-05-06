Example Next.js project with Thesys GenUI SDK, showing how to persist chat history and threads using Firebase Firestore.

## Persistence with C1 Chat using Firebase Firestore

1.  **Firebase Setup**:
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   In your project, go to "Firestore Database" and create a database. Start in "test mode" for easy setup during the demo (it allows open access for about 30 days).
    *   Get your Firebase project configuration: Go to Project settings (gear icon) > General tab > Your apps > Web app. If you don't have a web app, create one. You'll find the `firebaseConfig` object there.
    *   Copy these credentials into `src/firebaseConfig.ts`.

2.  **Environment Setup**:
    *   Copy `.env.example` to `.env` and set your `THESYS_API_KEY`.
        ```bash
        cp .env.example .env
        ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/             # API route for LLM interaction
│   │   ├── page.tsx              # Main page component using Firebase directly for CRUD
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── services/                 # Service layer
│   │   └── threadService.ts      # Thread management using firebase firestore
│   └── firebaseConfig.ts         # Firebase configuration (NEEDS YOUR CREDENTIALS)
├── public/                       # Static assets
├── .env                          # Environment variables
├── .env.example                  # Example environment variables
├── next.config.js                # Next.js configuration (if you have next.config.mjs, adjust accordingly)
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Overview

This example is a simple chat application built with Next.js and Thesys GenUI SDK. It allows users to have conversations with an AI assistant and persists the chat history using **Firebase Firestore**.

### Example prompt

```
What is the weather in New York?
```

### LLM tools

Only 1 tool is supported:

```
{
  "location": "New York, NY"
}
```

### Persistence with Firebase

#### UI (Client-Side Firebase Interaction)

See `src/app/page.tsx` for the usage of `useThreadManager` and `useThreadListManager`. These hooks interact directly with functions in `src/services/threadService.ts`, which in turn communicate with Firebase Firestore for all thread and message CRUD (Create, Read, Update, Delete) operations.

#### Backend (LLM Interaction & Storage Trigger)

Checkout the backend code in:

1.  `src/app/api/chat/route.ts`: This API route handles new user prompts, interacts with the LLM (including tool calls), and uses the Firebase-backed `addMessages` function from `src/services/threadService.ts` to persist the full conversation history (user messages, assistant responses, tool calls, and tool results) to Firebase Firestore.
2.  `src/services/threadService.ts`: This service now contains all the logic for interacting with Firebase Firestore to manage threads and messages.
