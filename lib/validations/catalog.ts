import { z } from 'zod';

export const CURRENCY = z.enum(['TZS', 'USD', 'GBP', 'EUR']);
export const STUDY_LEVEL = z.enum(['FOUNDATION', 'BACHELOR', 'MASTERS', 'PHD', 'DIPLOMA']);
export const FEE_TYPE = z.enum([
  'APPLICATION', 'TUITION', 'HOSTEL', 'AGENCY',
  'DEPOSIT', 'INSURANCE', 'VISA', 'AIRPORT_PICKUP', 'OTHER',
]);

const feeDueRuleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('DAYS_FROM_ENROLLMENT'), days: z.coerce.number().int().min(0) }),
  z.object({ kind: z.literal('BEFORE_REPORTING_DATE'), days: z.coerce.number().int().min(0) }),
  z.object({ kind: z.literal('ON_ENROLLMENT') }),
  z.object({ kind: z.literal('CUSTOM') }),
]);

const feeDefaultSchema = z.object({
  type: FEE_TYPE,
  label: z.string().max(80).optional(),
  amount: z.coerce.number().positive('Amount must be > 0'),
  currency: CURRENCY,
  dueRule: feeDueRuleSchema,
  required: z.coerce.boolean(),
});

export const universitySchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  country: z.string().min(2, 'Country is required').max(60),
  city: z.string().max(60).optional(),
  contactName: z.string().max(80).optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().max(40).optional(),
});

export const packageSchema = z.object({
  universityId: z.string().min(2, 'University is required'),
  name: z.string().min(2, 'Name is required').max(120),
  studyLevel: STUDY_LEVEL,
  program: z.string().min(2, 'Program is required').max(120),
  description: z.string().max(500).optional(),
  feeDefaults: z.array(feeDefaultSchema).refine(
    items => {
      const keys = items.map(i => `${i.type}::${i.label ?? ''}`);
      return new Set(keys).size === keys.length;
    },
    { message: 'Duplicate (type, label) entry' },
  ),
});

export const overrideFeeLineSchema = z.object({
  studentId: z.string().min(2),
  lineId: z.string().min(2),
  amount: z.coerce.number().positive().optional(),
  currency: CURRENCY.optional(),
  dueDate: z.string().min(10).optional(),
  reason: z.string().min(3, 'Reason is required').max(200),
});

export type UniversityFormValues = z.infer<typeof universitySchema>;
export type PackageFormValues = z.infer<typeof packageSchema>;
export type OverrideFeeLineValues = z.infer<typeof overrideFeeLineSchema>;
