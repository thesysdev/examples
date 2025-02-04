import { BreakdownExpensesSummarySchema } from "./breakdown-expenses";
import { UserConsentSchema } from "./user-consent";
import { TrendsSchema } from "./trends";
import { Breakdown2DSchema } from "./breakdown-2d";
import zodToJsonSchema from "zod-to-json-schema";

export const templates = [
  {
    name: "breakdown_expenses",
    description: "Renders a summary of the user's financial situation.",
    parameters: BreakdownExpensesSummarySchema,
  },
  {
    name: "user_consent",
    description:
      "Renders a consent form for the user to set a budget. Always use this tool when asking for consent.",
    parameters: UserConsentSchema,
  },
  {
    name: "trends",
    description: "Renders a chart of the user's financial trends.",
    parameters: TrendsSchema,
  },
  {
    name: "breakdown_2d",
    description:
      "Renders visualisation that helps user's understand theirfinancial data when breakdown is required by more than one dimension. For example, a breakdown of expenses by category and month.",
    parameters: Breakdown2DSchema,
  },
] as const;

export const TemplatesJsonSchema = {
  type: "object",
  properties: {
    response: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "string",
            description: "text message to be displayed to the user",
          },
          ...templates.map((template) => ({
            type: "object",
            description: template.description,
            properties: {
              name: { const: template.name },
              templateProps: zodToJsonSchema(template.parameters),
            },
            required: ["name", "parameters"],
            additionalProperties: false,
          })),
        ],
      },
    },
  },
} as const;

// Re-export all schemas and types
export * from "./breakdown-expenses";
export * from "./user-consent";
export * from "./trends";
export * from "./breakdown-2d";
