import { z } from 'zod';

export const leadSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  source: z.enum(["SOCIAL_MEDIA", "SCHOOL_VISIT", "SUB_AGENT", "REFERRAL", "WALK_IN", "WEBSITE"]),
  interestedIn: z.string().min(2, "Program of interest is required"),
  interestedCountry: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional()
});

export type LeadFormValues = z.infer<typeof leadSchema>;
