import { z } from "zod";

export const PersonProps = z.object({
  name: z.string(),
  title: z.string(),
  biography: z.string().describe("A short biography of the person"),
  birth: z
    .object({
      date: z.string().optional(),
      place: z.string().optional(),
    })
    .optional(),
  death: z
    .object({
      date: z.string(),
      place: z.string(),
      age: z.number(),
    })
    .describe("Only add this if the person is dead")
    .optional(),
  familyMembers: z.array(
    z
      .object({
        relation: z.string(),
        name: z.string(),
        description: z.string().optional(),
      })
      .describe(
        "Family members related to the person like parents, siblings, children, etc. Try adding atleast 3 family members."
      )
  ),
  relatedPeople: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
});

export type PersonProps = z.infer<typeof PersonProps>;
