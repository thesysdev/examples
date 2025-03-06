import { z } from "zod";

export const RecipeTemplateSchema = z.object({
  title: z.string(),
  cuisine: z.string(),
  cookingTime: z.number(),
  difficulty: z.string(),
  rating: z.number(),
  servings: z.number(),
  ingredients: z.array(z.string()),
  instructions: z
    .array(z.string())
    .describe(
      "The instructions to cook the recipe. Do not prefix it with numbers or use markdown, just the instructions."
    ),
});

export type RecipeTemplateProps = z.infer<typeof RecipeTemplateSchema>;
