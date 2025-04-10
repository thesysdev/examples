"use client";
import { Card, CardHeader } from "@crayonai/react-ui";
import { PieChart } from "@crayonai/react-ui/Charts/PieChart";
import { BreakdownExpensesSummaryProps } from "@/types/responseTemplates/breakdown-expenses";

export const BreakdownExpenses: React.FC<BreakdownExpensesSummaryProps> = ({
  expenses,
  total_spent: totalSpent,
}) => {
  const chartData = expenses.map((expense) => ({
    category: expense.category,
    amount: expense.amount,
  }));

  return (
    <Card className="items-center">
      <CardHeader title={`Breakdown of expenses, Total Spent: ${totalSpent}`} />
      <div className="w-[400px]">
        <PieChart data={chartData} categoryKey="category" dataKey="amount" />
      </div>
    </Card>
  );
};
