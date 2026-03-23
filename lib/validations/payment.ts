import { z } from 'zod';

export const paymentSchema = z.object({
  studentId: z.string().min(2, "Select a student to record against"),
  feeType: z.enum(["AGENCY", "APPLICATION", "TUITION", "HOSTEL"]),
  amount: z.coerce.number().min(1000, "Minimum payment amount is 1,000"),
  receiptNumber: z.string().min(3, "Receipt number is required"),
  paymentDate: z.string().min(10, "Date is required"),
  notes: z.string().optional()
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
