import { ChatCompletionTool } from "openai/resources/chat/completions";

// Define available tools
export const dataTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "execute_sql",
      description: "Execute SQL lite queries on the Transaction table.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "SQL query to execute on the Transaction table. Use the Transaction table. quote the table name.",
          },
          description: {
            type: "string",
            description:
              "Human readable description of the intent of this tool call to be shown to the user. Do not include any sensitive information or PII. Construct the sentence in present participle tense.",
          },
        },
        required: ["query", "description"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "set_budget",
      description: "Set a budget for a category.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Category to set the budget for.",
          },
          budget: {
            type: "number",
            description: "Budget to set for the category.",
          },
          consent: {
            type: "boolean",
            description:
              "Whether the user has consented to setting the budget.",
          },
        },
        required: ["category", "budget", "consent"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];

// Helper function to get a tool by name
export function getDataToolByName(
  name: string
): ChatCompletionTool | undefined {
  return dataTools.find((tool) => tool.function.name === name);
}
