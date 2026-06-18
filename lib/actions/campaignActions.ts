'use server';

import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/lib/backend';
import {
  ActionResult,
  CampaignChannel,
  ImportResult,
} from '@/types';

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return body?.error?.message ?? `Request failed (${res.status}).`;
}

/** Normalise a header cell: lowercase, strip everything but letters/digits. */
function norm(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Pick the first matching column value from a parsed row. */
function pick(
  row: Record<string, unknown>,
  normalised: Record<string, unknown>,
  candidates: string[],
): string {
  for (const c of candidates) {
    const v = normalised[c];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
}

interface RawContactRow {
  fullName: string;
  phone: string;
  email: string;
  relation: string;
  studentName: string;
}

export interface ImportActionResult {
  success: boolean;
  message: string;
  result?: ImportResult;
}

/**
 * Parse the uploaded Excel/CSV, map its columns to contact fields, and hand the
 * rows to the backend's aggressive importer. The backend decides what is valid;
 * we just surface its imported / rejected breakdown.
 */
export async function importContacts(
  formData: FormData,
): Promise<ImportActionResult> {
  const groupName = String(formData.get('groupName') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const file = formData.get('file');

  if (groupName.length < 2) {
    return { success: false, message: 'Give the group a name (e.g. "Batch 2").' };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: 'Attach the filled-in contacts file.' };
  }

  let rows: RawContactRow[];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return { success: false, message: 'The file has no sheets.' };
    }
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    rows = json.map((row) => {
      const normalised: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) normalised[norm(k)] = v;
      return {
        fullName: pick(row, normalised, [
          'fullname',
          'name',
          'parentname',
          'guardianname',
          'contactname',
        ]),
        phone: pick(row, normalised, [
          'phone',
          'phonenumber',
          'mobile',
          'mobilenumber',
          'tel',
          'contact',
          'whatsapp',
        ]),
        email: pick(row, normalised, ['email', 'emailaddress', 'mail']),
        relation: pick(row, normalised, ['relation', 'relationship']),
        studentName: pick(row, normalised, [
          'studentname',
          'student',
          'child',
          'childname',
          'studentfullname',
          'learner',
        ]),
      };
    });
  } catch {
    return {
      success: false,
      message: 'Could not read that file. Use the provided Excel template.',
    };
  }

  if (rows.length === 0) {
    return { success: false, message: 'The file has no data rows.' };
  }
  if (rows.length > 10000) {
    return {
      success: false,
      message: 'Too many rows — split the file into batches of 10,000 or fewer.',
    };
  }

  const res = await backendFetch('/campaigns/groups', {
    method: 'POST',
    body: JSON.stringify({
      groupName,
      description: description || undefined,
      rows,
    }),
  });
  if (!res.ok) {
    return { success: false, message: await readError(res) };
  }

  const result = (await res.json()) as ImportResult;
  revalidatePath('/communication');

  if (!result.group) {
    return {
      success: false,
      message: `No contacts imported — all ${result.rejected.length} rows failed validation.`,
      result,
    };
  }
  return {
    success: true,
    message: `Imported ${result.imported} contact${
      result.imported === 1 ? '' : 's'
    } into "${result.group.name}"${
      result.rejected.length ? `, ${result.rejected.length} skipped` : ''
    }.`,
    result,
  };
}

export async function createCampaign(input: {
  name: string;
  groupId: string;
  channel: CampaignChannel;
  subject?: string;
  message: string;
}): Promise<ActionResult> {
  const res = await backendFetch('/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      groupId: input.groupId,
      channel: input.channel,
      subject: input.subject || undefined,
      message: input.message,
    }),
  });
  if (!res.ok) return { success: false, message: await readError(res) };

  const c = (await res.json()) as {
    sentCount: number;
    failedCount: number;
    skippedCount: number;
  };
  revalidatePath('/communication');
  return {
    success: true,
    message: `Campaign sent — ${c.sentCount} delivered${
      c.failedCount ? `, ${c.failedCount} failed` : ''
    }${c.skippedCount ? `, ${c.skippedCount} skipped` : ''}.`,
    data: c,
  };
}

export async function deleteContactGroup(id: string): Promise<ActionResult> {
  const res = await backendFetch(`/campaigns/groups/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) return { success: false, message: await readError(res) };
  revalidatePath('/communication');
  return { success: true, message: 'Group deleted.' };
}
