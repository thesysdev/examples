# Presentation Assistant

A minimal Next.js app that streams presentation content from OpenAI. The `/api/ask` route accepts a `prompt` and optional prior `presentation`, and streams back appended content. The homepage provides a professional UI with an input and a `<pre>` viewer.

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
