import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import type { RunnableToolFunctionWithoutParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import GoogleImages from "google-images";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";

const client = new GoogleImages(
  process.env.GOOGLE_CSE_ID!,
  process.env.GOOGLE_API_KEY!
);

export const tools: (
  | RunnableToolFunctionWithoutParse
  | RunnableToolFunctionWithParse<{ altText: string }>
)[] = [
  {
    type: "function",
    function: {
      name: "getImageSrc",
      description: "Get the image src for the given alt text",
      parse: JSON.parse,
      parameters: zodToJsonSchema(
        z.object({
          altText: z.string().describe("The alt text of the image"),
        })
      ) as JSONSchema,
      function: async ({ altText }: { altText: string }) => {
        const results = await client.search(altText, {
          size: "medium",
        });
        return results[0].url;
      },
      strict: true,
    },
  },
];
