'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult, TaskAttachment } from '@/types';
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

/**
 * Pulls attachment fields out of FormData by the existing convention:
 *   <prefix>_<i>_Url / _Filename / _ContentType / _Size
 *
 * Server-side metadata (uploadedAt/uploadedById/uploadedByName) is stamped by
 * the backend - we don't send it from here.
 */
function collectAttachments(
  formData: FormData,
  prefix: string,
): Omit<TaskAttachment, 'uploadedAt' | 'uploadedById' | 'uploadedByName'>[] {
  const out: Omit<TaskAttachment, 'uploadedAt' | 'uploadedById' | 'uploadedByName'>[] = [];
  for (let i = 0; i < 5; i++) {
    const url = (formData.get(`${prefix}_${i}_Url`) as string | null) ?? '';
    if (!url) continue;
    out.push({
      url,
      filename: (formData.get(`${prefix}_${i}_Filename`) as string | null) ?? 'file',
      contentType:
        (formData.get(`${prefix}_${i}_ContentType`) as string | null) ??
        'application/octet-stream',
      size: parseInt(
        (formData.get(`${prefix}_${i}_Size`) as string | null) ?? '0',
        10,
      ) || 0,
    });
  }
  return out;
}

function readFormString(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseTags(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

// ── CREATE ─────────────────────────────────────────────────────────────

export async function addTask(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const title = readFormString(formData, 'title');
  const description = readFormString(formData, 'description');
  const priority = readFormString(formData, 'priority');
  const dueDate = readFormString(formData, 'dueDate');
  const assigneeId = readFormString(formData, 'assignedToId');
  const tagsRaw = readFormString(formData, 'tags');

  if (!title || !description || !priority || !dueDate) {
    return {
      success: false,
      message: 'Title, description, priority, and due date are required.',
    };
  }

  const body: Record<string, unknown> = {
    title,
    description,
    priority,
    dueDate,
    // Empty array → backend treats as personal task (assigns to self).
    assignedToIds: assigneeId ? [assigneeId] : [],
    tags: parseTags(tagsRaw),
    referenceAttachments: collectAttachments(formData, 'reference'),
  };

  const res = await backendFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }

  const created = (await res.json()) as { isPersonal: boolean };
  revalidatePath('/tasks');
  return {
    success: true,
    message: created.isPersonal ? 'Personal task added.' : 'Task assigned successfully!',
  };
}

// ── EDIT ───────────────────────────────────────────────────────────────

export async function editTask(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readFormString(formData, 'taskId');
  if (!taskId) return { success: false, message: 'Missing taskId.' };

  const body: Record<string, unknown> = {};
  const title = readFormString(formData, 'title');
  const description = readFormString(formData, 'description');
  const priority = readFormString(formData, 'priority');
  const dueDate = readFormString(formData, 'dueDate');
  const tagsRaw = readFormString(formData, 'tags');

  if (title) body.title = title;
  if (description) body.description = description;
  if (priority) body.priority = priority;
  if (dueDate) body.dueDate = dueDate;
  if (tagsRaw !== undefined) body.tags = parseTags(tagsRaw);

  if (Object.keys(body).length === 0) {
    return { success: true, message: 'No changes to save.' };
  }

  const res = await backendFetch(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }

  revalidatePath('/tasks');
  return { success: true, message: 'Task updated.' };
}

// ── WORKFLOW: START ────────────────────────────────────────────────────

export async function startTask(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readFormString(formData, 'taskId');
  if (!taskId) return { success: false, message: 'Missing taskId.' };

  const res = await backendFetch(`/tasks/${taskId}/start`, { method: 'POST' });
  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }
  revalidatePath('/tasks');
  return { success: true, message: 'Task started.' };
}

// ── WORKFLOW: SUBMIT ───────────────────────────────────────────────────

export async function submitTaskReport(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readFormString(formData, 'taskId');
  if (!taskId) return { success: false, message: 'Missing taskId.' };

  const body: Record<string, unknown> = {
    note: readFormString(formData, 'summary'),
    progressMade: readFormString(formData, 'progressMade'),
    nextActions: readFormString(formData, 'nextActions'),
    blockers: readFormString(formData, 'blockers'),
    attachments: collectAttachments(formData, 'deliverable'),
  };

  const pct = readFormString(formData, 'percentageComplete');
  if (pct) {
    const n = parseInt(pct, 10);
    if (!Number.isNaN(n)) body.percentageComplete = n;
  }

  const res = await backendFetch(`/tasks/${taskId}/submit`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }

  revalidatePath('/tasks');
  return { success: true, message: 'Report submitted.' };
}

// ── WORKFLOW: REVIEW ───────────────────────────────────────────────────

export async function reviewTask(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readFormString(formData, 'taskId');
  const decision = readFormString(formData, 'decision');
  const note = readFormString(formData, 'note');

  if (!taskId) return { success: false, message: 'Missing taskId.' };
  if (!decision) return { success: false, message: 'Missing decision.' };

  const res = await backendFetch(`/tasks/${taskId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, note }),
  });

  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }

  revalidatePath('/tasks');
  return { success: true, message: 'Review recorded.' };
}

// ── WORKFLOW: BLOCK / UNBLOCK ──────────────────────────────────────────

export async function blockTask(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readFormString(formData, 'taskId');
  // Existing UI uses `reason`; backend expects `note`.
  const note = readFormString(formData, 'reason') ?? readFormString(formData, 'note');
  if (!taskId) return { success: false, message: 'Missing taskId.' };
  if (!note) return { success: false, message: 'A reason is required to block.' };

  const res = await backendFetch(`/tasks/${taskId}/block`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });

  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }

  revalidatePath('/tasks');
  return { success: true, message: 'Task blocked.' };
}

export async function unblockTask(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readFormString(formData, 'taskId');
  if (!taskId) return { success: false, message: 'Missing taskId.' };

  const res = await backendFetch(`/tasks/${taskId}/unblock`, { method: 'POST' });
  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }
  revalidatePath('/tasks');
  return { success: true, message: 'Task unblocked.' };
}
