import { NextRequest } from "next/server";
import OpenAI from "openai";
import {
  addMessages,
  getLLMThreadMessages,
} from "@/src/services/threadService";
import { transformStream } from "@crayonai/stream";
import { tools } from "./tools";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

type ThreadId = string;
const CUSTOM_COMPONENT_SCHEMAS = {
  Calculator: {
    type: "object",
    description:
      "A fully functional calculator with basic arithmetic operations (addition, subtraction, multiplication, division). Use this when the user needs to perform calculations or asks for a calculator.",
    properties: {
      initialValue: {
        type: "string",
        description: "The initial value to display on the calculator screen",
        default: "0",
      },
      operation: {
        type: "string",
        description: "The current operation being performed",
        enum: ["+", "-", "×", "÷", "="],
      },
      previousValue: {
        type: "number",
        description: "The previous value stored for calculations",
        default: 0,
      },
      waitingForOperand: {
        type: "boolean",
        description: "Whether the calculator is waiting for the next operand",
        default: false,
      },
    },
    required: [],
  },
  VideoPlayer: {
    type: "object",
    description:
      "A video player component that can play YouTube videos and direct video files. Use this when the user wants to watch a video, asks for a video player, or provides a video URL.",
    properties: {
      videoUrl: {
        type: "string",
        description: "The URL of the video to play (YouTube URL or direct video file URL)",
        default: "",
      },
      autoplay: {
        type: "boolean",
        description: "Whether the video should start playing automatically",
        default: false,
      },
    },
    required: [],
  },
};
export async function POST(req: NextRequest) {
  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: {
      role: "user";
      content: string;
      id: string;
    };
    threadId: ThreadId;
    responseId: string;
  };

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey:
      "sk-th-N9LLg9O0ufhUCUluqvVlmvRK6hcC6etamEBYnyrKcXKQ9mPXPmt6WKccuAtURKHdb1QTKvnZQKWYulxt3KtCr55xiHn4pYOptJrw",
  });

  const runToolsResponse = client.beta.chat.completions.runTools({
    model: "c1/anthropic/claude-sonnet-4/v-20250915", // available models: https://docs.thesys.dev/guides/models-pricing#model-table
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant with access to interactive components including a calculator and video player.

      **Calculator Component Instructions:**
      
      When the user needs to perform calculations, asks for a calculator, or mentions mathematical operations:
      
      1. **When to Use the Calculator:**
         - User explicitly asks for a calculator ("show me a calculator", "I need to calculate", "can you give me a calculator")
         - User mentions doing math operations ("I need to add some numbers", "help me calculate", "what's 15 * 23")
         - User asks for help with arithmetic, percentages, or basic math
      
      2. **How to Present the Calculator:**
         - Use the custom 'Calculator' component to display an interactive calculator
         - The calculator supports basic arithmetic operations: addition (+), subtraction (-), multiplication (×), and division (÷)
         - Users can interact with it directly by clicking the number and operation buttons
         - It has a clear function (C), decimal point support, and equals button
      
      **VideoPlayer Component Instructions:**
      
      When the user wants to watch videos, asks for a video player, or provides video URLs:
      
      1. **When to Use the VideoPlayer:**
         - User explicitly asks for a video player ("show me a video player", "I want to watch a video", "can you play videos")
         - User provides a video URL (YouTube, MP4, etc.) and wants to play it
         - User mentions watching or playing video content
         - User asks to load or play a specific video
      
      2. **How to Present the VideoPlayer:**
         - Use the custom 'VideoPlayer' component to display an interactive video player
         - If user provides a video URL, pass it as the 'videoUrl' property
         - Set 'autoplay' to true if user specifically requests auto-play
         - The component will show an input form first, then the video player after URL submission
      
      3. **VideoPlayer Features:**
         - Input form for entering video URLs (YouTube, MP4, etc.)
         - Support for YouTube videos (automatically converts to embed format)
         - Support for direct video files (MP4, WebM, etc.)
         - 16:9 aspect ratio responsive player
         - Video controls (play, pause, seek, volume)
         - "Load New Video" button to change videos
         - Persistent state that remembers the current video
      
      4. **Video URL Support:**
         - YouTube URLs (youtube.com/watch?v=... or youtu.be/...)
         - Direct video file URLs (.mp4, .webm, .ogg, etc.)
         - The component automatically detects and handles different URL types
      
      **Example Responses:**
      - Calculator: "I'll show you a calculator to help with your calculations!"
      - VideoPlayer: "Here's a video player where you can enter your video URL!"
      - VideoPlayer with URL: "Let me set up a video player for that video!"
      
      Always be helpful and provide clear instructions for using these interactive components.`,
      },
      ...(await getLLMThreadMessages(threadId)),
      {
        role: "user",
        content: prompt.content!,
      },
    ],
    stream: true,
    tools,
    metadata: {
      thesys: JSON.stringify({
        c1_custom_components: CUSTOM_COMPONENT_SCHEMAS,
      }),
    },
  });

  const allRunToolsMessages: ChatCompletionMessageParam[] = [];
  let isError = false;

  runToolsResponse.on("error", () => {
    isError = true;
  });

  runToolsResponse.on("message", (message) => {
    allRunToolsMessages.push(message);
  });

  runToolsResponse.on("end", async () => {
    // store messages on end only if there is no error
    if (isError) {
      return;
    }

    const runToolsMessagesWithId = allRunToolsMessages.map((m, index) => {
      const id =
        allRunToolsMessages.length - 1 === index // for last message (the response shown to user), use the responseId as provided by the UI
          ? responseId
          : crypto.randomUUID();

      return {
        ...m,
        id,
      };
    });

    const messagesToStore = [prompt, ...runToolsMessagesWithId];

    await addMessages(threadId, ...messagesToStore);
  });

  const llmStream = await runToolsResponse;

  const responseStream = transformStream(llmStream, (chunk) => {
    return chunk.choices[0]?.delta?.content;
  });
  llmStream.on("finalChatCompletion", (message: unknown) => {
    console.log("final_chat_completion", JSON.stringify(message, null, 2));
  });

  return new Response(responseStream as ReadableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
