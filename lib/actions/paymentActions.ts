'use server';

import { paymentSchema } from '../validations/payment';
import { mockPayments } from '../mock/mockPayments';
import { mockStudents } from '../mock/mockStudents';
import { mockLeads } from '../mock/mockLeads';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';

export async function recordPayment(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = paymentSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Please fix the payment validation errors.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { studentId, feeType, amount, receiptNumber, paymentDate, notes } = validatedFields.data;

    const recordIndex = mockPayments.findIndex(p => p.studentId === studentId);
    
    if (recordIndex === -1) {
      return { success: false, message: "No active payment record found for this student. They must exist in the system first." };
    }

    const record = mockPayments[recordIndex];

    // Simulate DB update natively
    record.receiptNumbers.push(receiptNumber);
    record.lastPaymentDate = new Date(paymentDate).toISOString();
    record.totalPaid += amount;
    record.balance = Math.max(0, record.totalDue - record.totalPaid);
    
    if (notes) {
      record.notes = notes;
    }

    if (feeType === 'AGENCY') {
      record.agencyFeePaid += amount;
      record.agencyFeeDate = record.lastPaymentDate;
    } else if (feeType === 'APPLICATION') {
      record.applicationFeePaid += amount;
      record.applicationFeeDate = record.lastPaymentDate;
    } else if (feeType === 'TUITION') {
      record.tuitionFeePaid += amount;
      record.tuitionFeeDate = record.lastPaymentDate;
    } else if (feeType === 'HOSTEL') {
      record.hostelFeePaid += amount;
      record.hostelFeeDate = record.lastPaymentDate;
    }

    // Update Status
    if (record.balance <= 0) {
      record.status = 'CLEARED';
    } else {
      record.status = 'PARTIAL';
    }

    // Update Student pipeline stage if they are in early stages
    const student = mockStudents.find(s => s.id === studentId);
    if (student) {
      if (['LEAD', 'COUNSELING', 'PAYMENT_PENDING'].includes(student.pipelineStage)) {
        student.pipelineStage = 'PAYMENT_CONFIRMED';
        student.updatedAt = new Date().toISOString();
      }

      // Ensure any linked lead is marked as CONVERTED
      const lead = mockLeads.find(l => l.convertedStudentId === studentId);
      if (lead && lead.status !== 'CONVERTED') {
        lead.status = 'CONVERTED';
        lead.updatedAt = new Date().toISOString();
      }
    }

    revalidatePath('/payments');
    revalidatePath('/students');
    revalidatePath('/leads');

    return { success: true, message: "Payment processed and balance updated!" };
  } catch (error) {
    return { success: false, message: "Unexpected server error." };
  }
}
