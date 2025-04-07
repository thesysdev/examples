import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import type { RunnableToolFunctionWithoutParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import GoogleImages from "google-images";

const client = new GoogleImages(
  process.env.GOOGLE_CSE_ID!,
  process.env.GOOGLE_API_KEY!
);

export const tools: (
  | RunnableToolFunctionWithoutParse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | RunnableToolFunctionWithParse<any>
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
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
