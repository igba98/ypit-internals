import { z } from 'zod';

export const invoiceSchema = z.object({
  recipientType: z.enum(['STUDENT', 'VENDOR', 'OTHER']),
  recipientId: z.string().optional(),
  recipientName: z.string().min(2, 'Recipient name is required'),
  description: z.string().min(2, 'Description is required'),
  itemDescription: z.string().min(2, 'Line item description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be 0 or more'),
  tax: z.coerce.number().min(0).default(0),
  currency: z.string().default('TZS'),
  issueDate: z.string().min(8, 'Issue date is required'),
  dueDate: z.string().min(8, 'Due date is required'),
  notes: z.string().optional(),
});

export const pettyCashExpenseSchema = z.object({
  date: z.string().min(8, 'Date is required'),
  category: z.enum([
    'OFFICE_SUPPLIES',
    'TRANSPORT',
    'MEALS',
    'UTILITIES',
    'POSTAGE',
    'REPAIRS',
    'CLEANING',
    'STAFF_WELFARE',
    'COURIER',
    'OTHER',
  ]),
  description: z.string().min(2, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  recipient: z.string().optional(),
  voucherNumber: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  receiptFilename: z.string().optional(),
  receiptContentType: z.string().optional(),
});

export const pettyCashReplenishSchema = z.object({
  date: z.string().min(8, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  voucherNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  category: z.enum([
    'RENT',
    'UTILITIES',
    'INTERNET',
    'OFFICE_SUPPLIES',
    'TRAVEL',
    'MARKETING',
    'PROFESSIONAL_FEES',
    'INSURANCE',
    'EQUIPMENT',
    'TRAINING',
    'COMMISSIONS',
    'OTHER',
  ]),
  vendor: z.string().optional(),
  description: z.string().min(2, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().min(8, 'Date is required'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CHEQUE', 'CARD', 'MOBILE_MONEY', 'PETTY_CASH']),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  receiptFilename: z.string().optional(),
  receiptContentType: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type PettyCashExpenseFormValues = z.infer<typeof pettyCashExpenseSchema>;
export type PettyCashReplenishFormValues = z.infer<typeof pettyCashReplenishSchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
