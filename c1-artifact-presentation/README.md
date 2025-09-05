# Presentation Assistant

A minimal Next.js app that streams presentation content from Thesys. The `/api/ask` route accepts a `prompt` and optional prior `presentation`, and streams back appended content. The homepage provides a professional UI with an input and a `C1Component` viewer.

## Setup

1. Set your OpenAI API key in the environment:

```bash
export THESYS_API_KEY=your_api_key_here
```

2. Install dependencies and start the dev server:

```bash
npm i
npm run dev
```

Open app in your browser and start prompting. Existing presentation content on the page is sent with each prompt to continue the document.

## How it works

### Backend

/api/ask:

- this endpoint accepts user prompt and optional prior presentation
- it returns a stream of content
- it adds user prompt and prior presentation to conversation history and calls the Thesys API to generate the content (using OpenAI client)

### UI

- Created home page with input and response renderer (using C1Component from @thesysai/genui-sdk)
- When user submits a prompt, it calls the /api/ask endpoint with the prompt and presentation and streams the response to the C1Component

## UI Setup

1. Install @thesysai/genui-sdk, @crayon-ai/react-ui
2. add fonts: geist and inter
3. import CSS: "@crayonai/react-ui/styles/index.css";
