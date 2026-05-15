import { z } from 'zod';

export const leadSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.email("A valid email address is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["MARKETING_STAFF", "SUB_AGENT"], {
    message: "Role must be Marketing Staff or Sub Agent",
  }),
  department: z.string().min(2, "Department is required").default("Marketing"),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
