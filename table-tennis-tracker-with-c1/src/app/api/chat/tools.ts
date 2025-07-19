import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import * as gameService from "@/src/services/gameService";

export const getTennisTools = (
  writeThinkItem: ({
    title,
    description,
    ephemeral,
  }: {
    title: string;
    description: string;
    ephemeral?: boolean;
  }) => Promise<void>,
): RunnableToolFunctionWithParse<any>[] => [
  {
    type: "function",
    function: {
      name: "startGame",
      description: "Starts a new game between two players.",
      parse: (input) => JSON.parse(input),
      parameters: zodToJsonSchema(
        z.object({
          player1Name: z.string().describe("Name of the first player."),
          player2Name: z.string().describe("Name of the second player."),
        }),
      ) as JSONSchema,
      function: async ({ player1Name, player2Name }) => {
        writeThinkItem({
          title: `Starting a game between ${player1Name} and ${player2Name}...`,
          description: "",
        });
        return await gameService.startGame(player1Name, player2Name);
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recordPoints",
      description:
        "Records the scores for both players in a specific game at once.",
      parse: (input) => JSON.parse(input),
      parameters: zodToJsonSchema(
        z.object({
          gameId: z.string().describe("The ID of the game."),
          playerAScore: z.number().describe("The score for Player A."),
          playerBScore: z.number().describe("The score for Player B."),
        }),
      ) as JSONSchema,
      function: async ({ gameId, playerAScore, playerBScore }) => {
        writeThinkItem({
          title: `Updating score for game ${gameId}...`,
          description: "",
        });
        return await gameService.recordPoints(
          gameId,
          playerAScore,
          playerBScore,
        );
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getScore",
      description: "Gets the current score of a game.",
      parse: (input) => JSON.parse(input),
      parameters: zodToJsonSchema(
        z.object({
          gameId: z.string().describe("The ID of the game."),
        }),
      ) as JSONSchema,
      function: async ({ gameId }) => {
        writeThinkItem({
          title: `Getting the score for game ${gameId}...`,
          description: "",
        });
        return await gameService.getScore(gameId);
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMatchHistory",
      description: "Gets the match history of a player.",
      parse: (input) => JSON.parse(input),
      parameters: zodToJsonSchema(
        z.object({
          playerName: z.string().describe("The name of the player."),
        }),
      ) as JSONSchema,
      function: async ({ playerName }) => {
        writeThinkItem({
          title: `Getting the match history for ${playerName}...`,
          description: "",
        });
        return await gameService.getMatchHistory(playerName);
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPlayerStats",
      description: "Gets detailed statistics for a single player.",
      parse: (input) => JSON.parse(input),
      parameters: zodToJsonSchema(
        z.object({
          playerName: z.string().describe("The name of the player."),
        }),
      ) as JSONSchema,
      function: async ({ playerName }) => {
        writeThinkItem({
          title: `Getting the stats for ${playerName}...`,
          description: "",
        });
        return await gameService.getPlayerStats(playerName);
      },
    },
  },
  {
    type: "function",
    function: {
      name: "comparePlayers",
      description: "Provides a head-to-head comparison between two players.",
      parse: (input) => JSON.parse(input),
      parameters: zodToJsonSchema(
        z.object({
          player1Name: z.string().describe("Name of the first player."),
          player2Name: z.string().describe("Name of the second player."),
        }),
      ) as JSONSchema,
      function: async ({ player1Name, player2Name }) => {
        writeThinkItem({
          title: `Comparing ${player1Name} and ${player2Name}...`,
          description: "",
        });
        return await gameService.comparePlayers(player1Name, player2Name);
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getLeaderboard",
      description: "Shows a leaderboard of all players, ranked by their wins.",
      parse: (input) => {},
      parameters: zodToJsonSchema(z.object({})) as JSONSchema,
      function: async () => {
        writeThinkItem({
          title: "Getting the leaderboard...",
          description: "",
        });
        return await gameService.getLeaderboard();
      },
    },
  },
];
