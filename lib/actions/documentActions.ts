'use server';

import { mockDocuments } from '../mock/mockDocuments';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';

export async function setDocumentVerification(docId: string, verified: boolean): Promise<ActionResult> {
  const doc = mockDocuments.find(d => d.id === docId);
  if (!doc) return { success: false, message: "Document not found." };

  doc.verified = verified;

  revalidatePath(`/students/${doc.studentId}`);
  revalidatePath('/applications');

  return {
    success: true,
    message: verified ? `${doc.name} verified.` : `${doc.name} marked unverified.`,
  };
}
