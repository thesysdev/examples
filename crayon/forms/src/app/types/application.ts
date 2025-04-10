import { z } from "zod";

export const PersonalInformationSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const ProfessionalDetailsSchema = z.object({
  company: z.string(),
  title: z.string(),
});

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
});

export const JobApplicationSchema = z.object({
  personalInformation: PersonalInformationSchema,
  professionalDetails: ProfessionalDetailsSchema.optional(),
  education: EducationSchema,
});

export type JobApplicationType = z.infer<typeof JobApplicationSchema>;
export type PersonalInformationType = z.infer<typeof PersonalInformationSchema>;
export type ProfessionalDetailsType = z.infer<typeof ProfessionalDetailsSchema>;
export type EducationType = z.infer<typeof EducationSchema>;
