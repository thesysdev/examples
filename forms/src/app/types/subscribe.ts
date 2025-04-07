import { z } from "zod";

export const SubscribeToNewsletterSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export type SubscribeToNewsletterType = z.infer<
  typeof SubscribeToNewsletterSchema
>;
