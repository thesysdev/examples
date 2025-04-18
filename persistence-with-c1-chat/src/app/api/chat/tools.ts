import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";

export const tools: RunnableToolFunctionWithParse<{ location: string }>[] = [
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Get the weather for the given location",
      parse: (input) => {
        console.log("input lkasjdlkfjds", input);
        return JSON.parse(input) as { location: string };
      },
      parameters: zodToJsonSchema(
        z.object({
          location: z.string().describe("location for weather"),
        })
      ) as JSONSchema,
      function: async ({ location }: { location: string }) => {
        const weathers = ["sunny", "cloudy", "rainy", "snowy"];
        const randomWeather =
          weathers[Math.floor(Math.random() * weathers.length)];

        return `The weather in ${location} is ${randomWeather}`;
      },
      strict: true,
    },
  },
];
