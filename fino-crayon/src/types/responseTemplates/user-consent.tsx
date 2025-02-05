import { z } from "zod";
export const UserConsentSchema = z.object({
  explanation: z.string(),
});

export type UserConsentProps = z.infer<typeof UserConsentSchema>;
