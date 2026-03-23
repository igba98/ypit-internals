import { z } from 'zod';

export const staffSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  role: z.enum([
    "MANAGING_DIRECTOR", 
    "MARKETING_MANAGER", 
    "FINANCE", 
    "ADMISSIONS", 
    "TRAVEL", 
    "OPERATIONS", 
    "MARKETING_STAFF", 
    "SUB_AGENT"
  ]),
  department: z.string().min(2, "Department needs to be specified"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type StaffFormValues = z.infer<typeof staffSchema>;
