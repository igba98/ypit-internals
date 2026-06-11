'use server';

import { revalidatePath } from 'next/cache';
import mammoth from 'mammoth';
import { ActionResult } from '@/types';
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

function formStr(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function revalidate() {
  revalidatePath('/admission-letters');
}

// ── Templates ─────────────────────────────────────────────────

export async function createLetterTemplate(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body = {
    name: formStr(formData, 'name'),
    description: formStr(formData, 'description'),
    body: formData.get('body'),
  };
  const res = await backendFetch('/letters/templates', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: 'Template created.' };
}

/**
 * Import a Word (.docx) file: converted to HTML server-side via mammoth, then
 * stored as a normal template. Placeholders like {{fullName}} typed in Word
 * survive the conversion and keep working.
 */
export async function importWordTemplate(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const file = formData.get('file');
  const name = formStr(formData, 'name');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: 'Choose a .docx file to import.' };
  }
  if (!name) {
    return { success: false, message: 'Template name is required.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, message: 'File too large (max 10 MB).' };
  }

  let html: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.convertToHtml({ buffer });
    html = result.value;
  } catch {
    return { success: false, message: 'Could not read that file - is it a valid .docx?' };
  }
  if (!html || html.trim().length < 10) {
    return { success: false, message: 'The document appears to be empty.' };
  }

  const res = await backendFetch('/letters/templates', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: `Imported from ${file.name}`,
      body: html,
    }),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: `Imported "${file.name}" - review the placeholders, then activate.` };
}

export async function updateLetterTemplate(
  templateId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {};
  const name = formStr(formData, 'name');
  if (name) body.name = name;
  const description = formStr(formData, 'description');
  if (description !== undefined) body.description = description;
  const tplBody = formData.get('body');
  if (typeof tplBody === 'string' && tplBody.trim().length >= 10) body.body = tplBody;

  const res = await backendFetch(`/letters/templates/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: 'Template saved.' };
}

export async function activateLetterTemplate(templateId: string): Promise<ActionResult> {
  const res = await backendFetch(`/letters/templates/${templateId}/activate`, {
    method: 'POST',
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: 'Template is now in use.' };
}

export async function deleteLetterTemplate(templateId: string): Promise<ActionResult> {
  const res = await backendFetch(`/letters/templates/${templateId}`, { method: 'DELETE' });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  revalidate();
  return { success: true, message: 'Template deleted.' };
}

// ── Notices ───────────────────────────────────────────────────

export async function generatePreAdmissionNotice(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult & { noticeId?: string }> {
  const body: Record<string, unknown> = {
    studentId: formStr(formData, 'studentId'),
    fullName: formStr(formData, 'fullName'),
    nationality: formStr(formData, 'nationality'),
    passportNo: formStr(formData, 'passportNo') ?? '',
    gender: formStr(formData, 'gender') ?? '',
    courseInterested: formStr(formData, 'courseInterested'),
    contactNumber: formStr(formData, 'contactNumber') ?? '',
    fatherName: formStr(formData, 'fatherName') ?? '',
    motherName: formStr(formData, 'motherName') ?? '',
    parentContact: formStr(formData, 'parentContact') ?? '',
    dateOfBirth: formStr(formData, 'dateOfBirth') ?? '',
    address: formStr(formData, 'address') ?? '',
  };
  const emailTo = formStr(formData, 'emailTo');
  if (emailTo) body.emailTo = emailTo;

  const res = await backendFetch('/letters/notices', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, ...(await readError(res)) };
  const notice = (await res.json()) as {
    id: string;
    noticeNumber: string;
    emailSentAt?: string | null;
    emailError?: string | null;
  };
  revalidate();
  if (notice.emailError) {
    return {
      success: true,
      message: `${notice.noticeNumber} generated, but the email failed: ${notice.emailError}. You can still print it.`,
      noticeId: notice.id,
    };
  }
  return {
    success: true,
    message: `${notice.noticeNumber} generated and emailed to the student.`,
    noticeId: notice.id,
  };
}
