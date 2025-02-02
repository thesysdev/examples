import { BreakdownExpensesSummarySchema } from "./breakdown-expenses";
import { UserConsentSchema } from "./user-consent";
import { TrendsSchema } from "./trends";
import { Breakdown2DSchema } from "./breakdown-2d";

export const tools = [
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

export type Tool = (typeof tools)[number];

// Re-export all schemas and types
export * from "./breakdown-expenses";
export * from "./user-consent";
export * from "./trends";
export * from "./breakdown-2d";
