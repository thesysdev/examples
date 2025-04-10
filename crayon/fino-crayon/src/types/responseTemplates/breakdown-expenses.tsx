import { z } from "zod";

export const BreakdownExpensesSummarySchema = z.object({
  expenses: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
    })
  ),
  total_spent: z.number(),
});

export type BreakdownExpensesSummaryProps = z.infer<
  typeof BreakdownExpensesSummarySchema
>;
