"use client";
import { Card, CardHeader } from "@crayonai/react-ui";
import { BarChart } from "@crayonai/react-ui/Charts/BarChart";
import { Breakdown2DProps } from "@/types/responseTemplates/breakdown-2d";

export const Breakdown2DViz: React.FC<Breakdown2DProps> = (props) => {
  const chartData = props.data.map((dataPoint) => ({
    month: dataPoint.date,
    ...Object.fromEntries(
      dataPoint.values.map((value) => [value.category, value.value])
    ),
  }));

  return (
    <Card>
      <CardHeader title="Breakdown" subtitle={props.insight} />
      <BarChart data={chartData} categoryKey="month" />
    </Card>
  );
};
