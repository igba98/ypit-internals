'use server';

import { revalidatePath } from 'next/cache';
import {
  ActionResult,
  PipelineStage,
  Session,
  StageTransitionPayload,
  TravelSubStep,
  TravelSubStepStatus,
  PIPELINE_ORDER,
} from '@/types';
import { backendFetch } from '@/lib/backend';
import { canRevert } from '@/lib/pipeline/permissions';

type ActionSession = Pick<Session, 'userId' | 'fullName' | 'role'>;

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
 * Drops keys whose value is empty/nullish so the backend's `.optional()` Zod
 * schemas treat them as "not provided" rather than rejecting them as empty
 * strings. Booleans (including `false`) and zero numbers are preserved.
 */
function pruneEmpty(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export interface AdvanceStudentInput {
  studentId: string;
  capturedData: StageTransitionPayload;
  assigneeId: string | null;
  session: ActionSession;
}

export async function advanceStudent(
  input: AdvanceStudentInput,
): Promise<ActionResult> {
  const body: Record<string, unknown> = pruneEmpty({ ...input.capturedData });
  if (input.assigneeId) body.assigneeId = input.assigneeId;

  const res = await backendFetch(`/students/${input.studentId}/advance`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }

  const j = (await res.json()) as {
    student: { pipelineStage: string; fullName: string };
  };

  // The pipeline can have downstream side effects in many places -
  // revalidate broadly so dashboards reflect the new state.
  revalidatePath('/students');
  revalidatePath(`/students/${input.studentId}`);
  revalidatePath('/applications');
  revalidatePath('/payments');
  revalidatePath('/finance');
  revalidatePath('/travel');
  revalidatePath('/monitoring');
  revalidatePath('/dashboard');

  const stage = j.student.pipelineStage.replace(/_/g, ' ').toLowerCase();
  return {
    success: true,
    message: `${j.student.fullName} advanced to ${stage}.`,
  };
}

export interface AdvanceTravelStepInput {
  studentId: string;
  step: TravelSubStep;
  newStatus: TravelSubStepStatus;
  capturedData: StageTransitionPayload;
  session: ActionSession;
}

export async function advanceTravelStep(
  input: AdvanceTravelStepInput,
): Promise<ActionResult> {
  const body = {
    status: input.newStatus,
    ...pruneEmpty({ ...input.capturedData }),
  };

  const res = await backendFetch(
    `/students/${input.studentId}/travel-steps/${input.step}`,
    { method: 'POST', body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const err = await readError(res);
    return { success: false, ...err };
  }

  revalidatePath(`/students/${input.studentId}`);
  revalidatePath('/travel');
  return {
    success: true,
    message: `Travel ${input.step} → ${input.newStatus.toLowerCase().replace('_', ' ')}.`,
  };
}

export interface RevertStageInput {
  studentId: string;
  toStage: PipelineStage;
  reason: string;
  session: ActionSession;
}

/**
 * The backend's POST /revert moves exactly -1 stage. To support the UI's
 * "revert to any earlier stage" picker we loop until we reach `toStage`.
 * Each iteration writes its own StageTransition + audit row, which is the
 * desired audit behaviour (every step is visible in the timeline).
 */
export async function revertStage(
  input: RevertStageInput,
): Promise<ActionResult> {
  const { studentId, toStage, reason, session } = input;

  if (!canRevert(session.role)) {
    return {
      success: false,
      message: 'Only Managing Director can revert a stage.',
    };
  }
  if (!reason || reason.trim().length === 0) {
    return { success: false, message: 'A reason is required when reverting.' };
  }

  const studentRes = await backendFetch(`/students/${studentId}`);
  if (!studentRes.ok) {
    const err = await readError(studentRes);
    return { success: false, ...err };
  }
  const student = (await studentRes.json()) as { pipelineStage: PipelineStage };

  const fromIdx = PIPELINE_ORDER.indexOf(student.pipelineStage);
  const toIdx = PIPELINE_ORDER.indexOf(toStage);
  if (toIdx < 0 || fromIdx < 0) {
    return { success: false, message: 'Invalid stage.' };
  }
  if (toIdx >= fromIdx) {
    return {
      success: false,
      message: 'Revert target must be earlier in the pipeline.',
    };
  }

  const steps = fromIdx - toIdx;
  for (let i = 0; i < steps; i++) {
    const res = await backendFetch(`/students/${studentId}/revert`, {
      method: 'POST',
      body: JSON.stringify({ notes: reason }),
    });
    if (!res.ok) {
      const err = await readError(res);
      return { success: false, ...err };
    }
  }

  revalidatePath('/students');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/dashboard');
  return {
    success: true,
    message: `Reverted to ${toStage.replace(/_/g, ' ').toLowerCase()}.`,
  };
}
