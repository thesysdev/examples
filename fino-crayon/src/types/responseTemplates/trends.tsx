import { z } from "zod";

export const TrendLineSummarySchema = z.optional(
  z.object({
    total: z.optional(z.number()),
    average: z.optional(z.number()),
  })
);
export type TrendLineSummary = z.infer<typeof TrendLineSummarySchema>;

export const TrendsSchema = z.object({
  trendLines: z.array(
    z.object({
      category: z.string({
        description:
          "The category of the trend line. Can be expense, income, investments, etc.",
      }),
      points: z.array(
        z.object({
          date: z.string({
            description:
              "Date, month or year of the data point. Give the shortest possible human readable name.",
          }),
          value: z.number(),
        })
      ),
      summary: TrendLineSummarySchema,
    }),
    {
      description:
        "An array of data points for the trend line. Max upto 10 points.",
    }
  ),
  insight: z.string({
    description:
      "A short insight from the trend lines. Keep it concise and to the point.",
  }),
});

export type TrendsProps = z.infer<typeof TrendsSchema>;
