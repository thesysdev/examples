"use client";
import { Card, CardHeader } from "@crayonai/react-ui";
import { LineChart } from "@crayonai/react-ui/Charts/LineChart";
import { TrendsProps } from "@/types/responseTemplates/trends";

export const TrendsExpenses: React.FC<TrendsProps> = (props) => {
  const mergedData: Record<string, Record<string, number>> = {};
  for (const line of props.trendLines) {
    for (const point of line.points) {
      mergedData[point.date] = mergedData[point.date] || {};
      mergedData[point.date][line.category] = point.value;
    }
  }
  const allDates = Array.from(
    new Set([
      ...props.trendLines.flatMap((line) => line.points.map((p) => p.date)),
    ])
  );
  const chartData = allDates.map((date) => ({
    date,
    ...Object.fromEntries(
      props.trendLines.map((line) => [
        line.category,
        mergedData[date]?.[line.category] || 0,
      ])
    ),
  }));

  return (
    <Card>
      <CardHeader title="Trends" subtitle={props.insight} />
      <LineChart data={chartData} categoryKey="date" />
    </Card>
  );
};
