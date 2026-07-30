'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, EnquiryStatus } from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response): Promise<{ message: string }> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return { message: body?.error?.message ?? `Request failed (${res.status}).` };
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: EnquiryStatus,
): Promise<ActionResult> {
  const res = await backendFetch(`/enquiries/${enquiryId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/enquiries');
  return { success: true, message: `Marked ${status.toLowerCase()}.` };
}

export async function saveEnquiryNotes(
  enquiryId: string,
  internalNotes: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/enquiries/${enquiryId}`, {
    method: 'PATCH',
    body: JSON.stringify({ internalNotes }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidatePath('/enquiries');
  return { success: true, message: 'Notes saved.' };
}

export async function convertEnquiryToLead(
  enquiryId: string,
): Promise<ActionResult & { leadId?: string }> {
  const res = await backendFetch(`/enquiries/${enquiryId}/convert`, {
    method: 'POST',
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const body = (await res.json()) as { leadId: string };
  revalidatePath('/enquiries');
  revalidatePath('/leads');
  return { success: true, message: 'Converted to a lead.', leadId: body.leadId };
}

/**
 * Convert an enquiry (usually a website APPLICATION) straight into a Student.
 * The applicant already supplied most details on the website form.
 */
export async function convertEnquiryToStudent(
  enquiryId: string,
  input: {
    nationality: string;
    gender: string;
    dateOfBirth: string;
    targetUniversity: string;
    targetCountry: string;
    targetProgram: string;
    targetIntake: string;
    whatsapp?: string;
    passportNumber?: string;
  },
): Promise<ActionResult & { studentId?: string }> {
  const res = await backendFetch(`/enquiries/${enquiryId}/convert-student`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const body = (await res.json()) as {
    studentId: string;
    registrationNumber: string;
  };
  revalidatePath('/enquiries');
  revalidatePath('/students');
  return {
    success: true,
    message: `Student ${body.registrationNumber} created — pipeline starts at Counseling.`,
    studentId: body.studentId,
  };
}
