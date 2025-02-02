import prisma from "@/lib/db";

interface SQLArgs {
  query: string;
  description: string;
}

interface BudgetArgs {
  category: string;
  budget: number;
  consent: boolean;
}

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
