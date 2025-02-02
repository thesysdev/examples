import { ChatCompletionTool } from "openai/resources/chat/completions";

// Define available tools
export const availableTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "execute_sql",
      description: "Execute SQL queries on the transactions database.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "SQL query to execute",
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
export function getToolByName(name: string): ChatCompletionTool | undefined {
  return availableTools.find((tool) => tool.function.name === name);
}
