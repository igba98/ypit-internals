import { z } from 'zod';

export const studentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  whatsapp: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  nationality: z.string().min(2, "Nationality is required"),
  dateOfBirth: z.string().min(10, "Date of birth is required"),
  passportNumber: z.string().optional(),
  targetUniversity: z.string().min(2, "Target university is required"),
  targetCountry: z.string().min(2, "Target country is required"),
  targetProgram: z.string().min(2, "Target program is required"),
  targetIntake: z.string().min(2, "Target intake is required"),
  leadSource: z.enum(["SOCIAL_MEDIA", "SCHOOL_VISIT", "SUB_AGENT", "REFERRAL", "WALK_IN", "WEBSITE", "CAMPAIGN"]),
  campaignName: z.string().optional(),
  sourceDetails: z.string().optional(),
  assignedAgentId: z.string().optional(),
  marketingStaffId: z.string().optional(),
  notes: z.string().optional()
});

export type StudentFormValues = z.infer<typeof studentSchema>;
