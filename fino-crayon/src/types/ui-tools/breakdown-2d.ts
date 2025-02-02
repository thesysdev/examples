import { z } from "zod";

export const Breakdown2DSchema = z.object({
  data: z.array(
    z.object({
      date: z.string({
        description:
          "Date, month or year of the data point. Give the shortest possible human readable name.",
      }),
      values: z.array(
        z.object({
          category: z.string({
            description:
              "The category of this data point. Can be an expense, income or investments category.",
          }),
          value: z.number(),
        })
      ),
    })
  ),
  insight: z.string(),
});

export type Breakdown2DProps = z.infer<typeof Breakdown2DSchema>;
