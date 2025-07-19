import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai/index.mjs";
import {
  addMessages,
  getLLMThreadMessages,
} from "@/src/services/threadService";
import { getTennisTools } from "./tools";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { makeC1Response } from "@thesysai/genui-sdk/server";

type ThreadId = string;

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const c1Response = makeC1Response();

  c1Response.writeThinkItem({
    title: "Thinking...",
    description: "",
  });

  const { prompt, threadId, responseId } = (await req.json()) as {
    prompt: {
      role: "user";
      content: string;
      id: string;
    };
    threadId: ThreadId;
    responseId: string;
  };

  const systemPrompt = `You are a "Table Tennis Analyst," named Rally King, a specialist in table tennis statistics and data visualization. Your goal is to provide engaging and insightful analysis of player performance by using the available tools.

Your capabilities are:
- **Start new games**: Use the startGame tool. For example: "Let's start a game between Alice and Bob."
- **Record points**: When a user wants to record points, ask for the scores of both players and use the recordPoints tool. For example: "Update the score for game 1a2b3c4d."
- **View match history and stats**: For a player's statistics or match history, use the getPlayerStats and getMatchHistory tools. For example: "Show me the match history for Alice." or "What are Bob's stats?"
- **Compare players**: Use the comparePlayers tool for head-to-head comparisons. For example: "Compare Alice and Bob."
- **View the leaderboard**: Use the getLeaderboard tool. For example: "Show me the leaderboard."
- **Get game score**: Use the getScore tool to get the current score of a specific game.

Important rules:
1. Be proactive! Generate follow up questions to the user's question. For example: "Alice has the most wins. Would you like to see her match histo  ry or compare her stats against the runner-up?"
2. Always use the provided tools to answer user queries about game statistics, players, and matches. Do not answer from memory or make up information.
3. NEVER show loading states or placeholders in the UI, ALWAYS fetch all required data before generating any UI components
4. If data needs to be shown in tabs/accordion, fetch ALL data for ALL sections before rendering"`;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...(await getLLMThreadMessages(threadId)),
    {
      role: "user",
      content: prompt.content!,
    },
  ];

  const runner = client.beta.chat.completions.runTools({
    model: "c1/anthropic/claude-3.5-sonnet/v-20250709",
    messages,
    stream: true,
    tools: getTennisTools(c1Response.writeThinkItem),
  });

  const allRunToolsMessages: ChatCompletionMessageParam[] = [];

  runner.on("message", (message) => {
    allRunToolsMessages.push(message);
  });

  runner.on("end", async () => {
    const runToolsMessagesWithId = allRunToolsMessages.map((m, index) => {
      const id =
        allRunToolsMessages.length - 1 === index
          ? responseId
          : crypto.randomUUID();
      return { ...m, id };
    });
    const messagesToStore = [prompt, ...runToolsMessagesWithId];
    await addMessages(threadId, ...messagesToStore);
  });

  (async () => {
    try {
      for await (const chunk of runner) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          c1Response.writeContent(content);
        }
      }
    } catch (e) {
      console.error("Error while streaming content", e);
    } finally {
      c1Response.end();
    }
  })();

  return new NextResponse(c1Response.responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
