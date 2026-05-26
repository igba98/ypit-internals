import { z } from 'zod';

export const guardianSchema = z.object({
  studentId: z.string().min(1),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  relation: z.enum(['MOTHER', 'FATHER', 'GUARDIAN', 'SPONSOR', 'OTHER']),
  phone: z.string().min(7, 'Phone number is required'),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  isPrimary: z.union([z.boolean(), z.literal('on'), z.literal('off'), z.literal('true'), z.literal('false')]).optional(),
});

export type GuardianFormInput = z.infer<typeof guardianSchema>;