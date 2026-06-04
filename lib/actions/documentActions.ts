'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, Document, DocumentType } from '@/types';
import { backendFetch } from '@/lib/backend';

async function readError(res: Response): Promise<{
  message: string;
  errors?: Record<string, string[]>;
}> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string; fieldErrors?: Record<string, string[]> };
  } | null;
  return {
    message: body?.error?.message ?? `Request failed (${res.status}).`,
    errors: body?.error?.fieldErrors,
  };
}

function revalidateForStudent(studentId: string) {
  revalidatePath('/applications');
  revalidatePath(`/students/${studentId}`);
}

export interface UploadTicket {
  documentId: string;
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface RequestUploadInput {
  studentId: string;
  type: DocumentType;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  notes?: string;
}

/**
 * Step 1 of upload: ask the backend for a presigned PUT URL.
 * The backend creates a DRAFT Document row (status=UPLOADING).
 * Client must then PUT the file to `uploadUrl` and call `finalizeDocumentUpload`.
 */
export async function requestDocumentUploadUrl(
  input: RequestUploadInput,
): Promise<ActionResult & { ticket?: UploadTicket }> {
  const res = await backendFetch('/documents/upload-url', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const ticket = (await res.json()) as UploadTicket;
  return { success: true, message: 'Upload URL ready.', ticket };
}

/** Step 3 of upload: confirm the file landed in R2 and flip to PENDING_REVIEW. */
export async function finalizeDocumentUpload(
  documentId: string,
  studentId: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/documents/${documentId}/finalize`, { method: 'POST' });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidateForStudent(studentId);
  return { success: true, message: 'Document uploaded.' };
}

/** Returns a short-lived presigned download URL. */
export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<{ success: true; url: string } | { success: false; message: string }> {
  const res = await backendFetch(`/documents/${documentId}/download-url`);
  if (!res.ok) {
    const err = await readError(res);
    return { success: false, message: err.message };
  }
  const body = (await res.json()) as { url: string };
  return { success: true, url: body.url };
}

/** List a single student's docs. Used by DocumentManagement. */
export async function listStudentDocuments(studentId: string): Promise<Document[]> {
  const res = await backendFetch(`/documents?studentId=${encodeURIComponent(studentId)}&limit=100`);
  if (!res.ok) return [];
  const body = (await res.json()) as {
    items: Array<{
      id: string;
      studentId: string;
      type: DocumentType;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      status: 'UPLOADING' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
      notes?: string | null;
      rejectionReason?: string | null;
      expiresAt?: string | null;
      uploadedByName: string;
      createdAt: string;
      reviewedAt?: string | null;
    }>;
  };
  return (body.items ?? []).map((d) => ({
    id: d.id,
    studentId: d.studentId,
    type: d.type,
    name: d.originalName,
    originalName: d.originalName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    url: '',
    uploadedAt: d.createdAt,
    uploadedBy: d.uploadedByName,
    verified: d.status === 'VERIFIED',
    status: d.status,
    notes: d.notes ?? undefined,
    rejectionReason: d.rejectionReason ?? undefined,
    expiresAt: d.expiresAt ?? undefined,
    reviewedAt: d.reviewedAt ?? undefined,
  }));
}

export async function verifyDocument(
  documentId: string,
  studentId: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/documents/${documentId}/verify`, { method: 'POST' });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidateForStudent(studentId);
  return { success: true, message: 'Document verified.' };
}

export async function rejectDocument(
  documentId: string,
  studentId: string,
  reason: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/documents/${documentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidateForStudent(studentId);
  return { success: true, message: 'Document rejected.' };
}

export async function deleteDocument(
  documentId: string,
  studentId: string,
): Promise<ActionResult> {
  const res = await backendFetch(`/documents/${documentId}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidateForStudent(studentId);
  return { success: true, message: 'Document deleted.' };
}

/**
 * Backwards-compat wrapper for the old `setDocumentVerification(docId, verified)` shape.
 * Internally routes to /verify or /reject. Reject requires a reason — pass "Rejected by reviewer"
 * as fallback when this wrapper is used.
 */
export async function setDocumentVerification(
  documentId: string,
  verified: boolean,
): Promise<ActionResult> {
  const res = await backendFetch(`/documents/${documentId}`);
  if (!res.ok) return { success: false, message: 'Document not found.' };
  const doc = (await res.json()) as { studentId: string };
  if (verified) return verifyDocument(documentId, doc.studentId);
  return rejectDocument(documentId, doc.studentId, 'Marked unverified by reviewer');
}
