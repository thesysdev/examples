import prisma from "@/lib/db";
import { z } from "zod";

export const SQLArgsSchema = z.object({
  query: z
    .string()
    .describe(
      "SQL query to execute on the Transaction table. Use the Transaction table. " +
        "quote the table name. "
    ),
  description: z
    .string()
    .describe(
      "Human readable description of the intent of this tool call to be shown to the user. Do not include any sensitive information or PII. Construct the sentence in present participle tense."
    ),
});

export const BudgetArgsSchema = z.object({
  category: z.string().describe("Category to set the budget for."),
  budget: z.number().describe("Budget to set for the category."),
  consent: z
    .boolean()
    .describe("Whether the user has consented to setting the budget."),
});

type SQLArgs = z.infer<typeof SQLArgsSchema>;
type BudgetArgs = z.infer<typeof BudgetArgsSchema>;

export async function execute_sql(args: SQLArgs): Promise<string> {
  const result = await prisma.$queryRawUnsafe(args.query);
  return JSON.stringify(result);
}

export async function set_budget(args: BudgetArgs): Promise<string> {
  const { category, budget, consent } = args;

  if (!consent) {
    return JSON.stringify({
      status: "error",
      error: "User did not consent to setting the budget",
    });
  }

  const response = `Setting budget for ${category} to ${budget}`;
  return JSON.stringify({ status: "success", response });
}
