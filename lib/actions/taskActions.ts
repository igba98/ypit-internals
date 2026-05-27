'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { ActionResult, Role, Task, TaskAttachment, TaskActivityEntry, NotificationType } from '@/types';
import {
  taskCreateSchema,
  taskSubmitSchema,
  taskReviewSchema,
  taskBlockSchema,
  taskUnblockSchema,
  taskStartSchema,
  taskEditSchema,
} from '@/lib/validations/task';
import { mockTasks } from '@/lib/mock/mockTasks';
import { mockUsers } from '@/lib/mock/mockUsers';
import { mockNotifications } from '@/lib/mock/mockNotifications';
import { mockAuditLogs } from '@/lib/mock/mockAuditLogs';
import { isPersonalTask, canStart, canSubmit, canReview, canBlock, canUnblock, canEdit } from '@/lib/tasks/permissions';

interface Session {
  userId: string;
  fullName: string;
  role?: Role;
}

async function readSession(): Promise<Session> {
  const cookieStore = await cookies();
  const c = cookieStore.get('ypit_session');
  if (!c) return { userId: 'system', fullName: 'System Actions' };
  try {
    const s = JSON.parse(c.value);
    return { userId: s.userId, fullName: s.fullName, role: s.role };
  } catch {
    return { userId: 'system', fullName: 'System Actions' };
  }
}

function collectAttachments(
  formData: FormData,
  prefix: string,
  actor: Session
): TaskAttachment[] {
  const out: TaskAttachment[] = [];
  for (let i = 0; i < 5; i++) {
    const url = (formData.get(`${prefix}_${i}_Url`) as string | null) ?? '';
    if (!url) continue;
    const filename = (formData.get(`${prefix}_${i}_Filename`) as string | null) ?? 'file';
    const contentType = (formData.get(`${prefix}_${i}_ContentType`) as string | null) ?? 'application/octet-stream';
    const sizeStr = (formData.get(`${prefix}_${i}_Size`) as string | null) ?? '0';
    out.push({
      url,
      filename,
      contentType,
      size: parseInt(sizeStr, 10) || 0,
      uploadedAt: new Date().toISOString(),
      uploadedById: actor.userId,
      uploadedByName: actor.fullName,
    });
  }
  return out;
}

function genActivityId(prefix: string): string {
  return `act_${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function pushNotification(userId: string, title: string, message: string, type: NotificationType, taskId: string) {
  if (!userId || userId === 'system') return;
  mockNotifications.unshift({
    id: `ntf_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    title,
    message,
    type,
    read: false,
    link: `/tasks?taskId=${taskId}`,
    entityId: taskId,
    createdAt: new Date().toISOString(),
  });
}

function pushAuditLog(actor: Session, action: 'TASK_ASSIGNED' | 'TASK_SUBMITTED' | 'TASK_REVIEWED' | 'TASK_BLOCKED', detail: string, taskId: string) {
  mockAuditLogs.unshift({
    id: `aud_${Math.random().toString(36).slice(2, 9)}`,
    userId: actor.userId,
    userName: actor.fullName,
    userRole: actor.role ?? 'OPERATIONS',
    action,
    module: 'tasks',
    detail,
    entityId: taskId,
    entityType: 'task',
    timestamp: new Date().toISOString(),
  });
}

export async function addTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = taskCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the form validation errors.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const actor = await readSession();
  const assigneeIdRaw = parsed.data.assignedToId?.trim();
  const isSelfAssign = !assigneeIdRaw || assigneeIdRaw === actor.userId;
  const assignee = isSelfAssign
    ? mockUsers.find((u) => u.id === actor.userId)
    : mockUsers.find((u) => u.id === assigneeIdRaw);

  if (!isSelfAssign && !assignee) {
    return { success: false, message: 'Invalid assignee selected.' };
  }

  const resolvedAssigneeId = assignee?.id ?? actor.userId;
  const resolvedAssigneeName = assignee?.fullName ?? actor.fullName;
  const resolvedDepartment = assignee?.department ?? 'Personal';
  const isPersonal = resolvedAssigneeId === actor.userId;

  const referenceAttachments = collectAttachments(formData, 'reference', actor);
  const tags = (parsed.data.tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const createdEntry: TaskActivityEntry = {
    id: genActivityId('created'),
    type: 'CREATED',
    at: new Date().toISOString(),
    actorId: actor.userId,
    actorName: actor.fullName,
    attachments: referenceAttachments.length > 0 ? referenceAttachments : undefined,
  };

  const newTask: Task = {
    id: `tsk_${Math.random().toString(36).slice(2, 9)}`,
    title: parsed.data.title,
    description: parsed.data.description,
    assignedToIds: [resolvedAssigneeId],
    assignedToNames: [resolvedAssigneeName],
    assignedById: actor.userId,
    assignedByName: actor.fullName,
    department: resolvedDepartment,
    priority: parsed.data.priority,
    status: 'TODO',
    dueDate: new Date(parsed.data.dueDate).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags,
    referenceAttachments: referenceAttachments.length > 0 ? referenceAttachments : undefined,
    activity: [createdEntry],
    isPersonal,
    currentRound: 0,
  };

  mockTasks.unshift(newTask);

  if (!isPersonal) {
    pushNotification(
      resolvedAssigneeId,
      `New task: ${newTask.title}`,
      `Assigned by ${actor.fullName}`,
      'TASK_ASSIGNED',
      newTask.id
    );
    pushAuditLog(actor, 'TASK_ASSIGNED', `Assigned "${newTask.title}" to ${resolvedAssigneeName}`, newTask.id);
  }

  revalidatePath('/tasks');
  return {
    success: true,
    message: isPersonal ? 'Personal task added.' : 'Task assigned successfully!',
  };
}

export async function startTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskStartSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: 'Invalid input.' };

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canStart(task, actor.userId)) {
    return { success: false, message: 'You cannot start this task.' };
  }

  task.status = 'IN_PROGRESS';
  task.updatedAt = new Date().toISOString();
  task.activity.push({
    id: genActivityId('started'),
    type: 'STARTED',
    at: task.updatedAt,
    actorId: actor.userId,
    actorName: actor.fullName,
  });

  revalidatePath('/tasks');
  return { success: true, message: 'Task started.' };
}

export async function blockTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskBlockSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: 'Block reason must be at least 3 characters.' };
  }

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canBlock(task, actor.userId)) {
    return { success: false, message: 'You cannot block this task.' };
  }

  task.status = 'BLOCKED';
  task.updatedAt = new Date().toISOString();
  task.activity.push({
    id: genActivityId('blocked'),
    type: 'BLOCKED',
    at: task.updatedAt,
    actorId: actor.userId,
    actorName: actor.fullName,
    note: parsed.data.reason,
  });
  pushAuditLog(actor, 'TASK_BLOCKED', `Blocked "${task.title}": ${parsed.data.reason}`, task.id);
  if (!isPersonalTask(task)) {
    pushNotification(
      task.assignedById,
      `Task blocked: ${task.title}`,
      parsed.data.reason,
      'SYSTEM_ALERT',
      task.id
    );
  }

  revalidatePath('/tasks');
  return { success: true, message: 'Task blocked.' };
}

export async function unblockTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskUnblockSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: 'Invalid input.' };

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canUnblock(task, actor.userId)) {
    return { success: false, message: 'You cannot unblock this task.' };
  }

  task.status = 'IN_PROGRESS';
  task.updatedAt = new Date().toISOString();
  task.activity.push({
    id: genActivityId('unblocked'),
    type: 'UNBLOCKED',
    at: task.updatedAt,
    actorId: actor.userId,
    actorName: actor.fullName,
  });

  revalidatePath('/tasks');
  return { success: true, message: 'Task unblocked.' };
}
export async function submitTaskReport(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskSubmitSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the form validation errors.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canSubmit(task, actor.userId)) {
    return { success: false, message: 'You cannot submit this task.' };
  }

  const attachments = collectAttachments(formData, 'deliverable', actor);
  const entry: TaskActivityEntry = {
    id: genActivityId('submitted'),
    type: 'SUBMITTED',
    at: new Date().toISOString(),
    actorId: actor.userId,
    actorName: actor.fullName,
    note: parsed.data.summary,
    progressMade: parsed.data.progressMade,
    percentageComplete: parsed.data.percentageComplete,
    nextActions: parsed.data.nextActions,
    blockers: parsed.data.blockers,
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  task.activity.push(entry);
  task.currentRound += 1;
  task.updatedAt = entry.at;
  task.status = isPersonalTask(task) ? 'COMPLETED' : 'SUBMITTED';

  pushAuditLog(actor, 'TASK_SUBMITTED', `Submitted "${task.title}" (round ${task.currentRound})`, task.id);
  if (!isPersonalTask(task)) {
    pushNotification(
      task.assignedById,
      `Report submitted: ${task.title}`,
      `From ${actor.fullName} — ${parsed.data.summary}`,
      'REPORT_SUBMITTED',
      task.id
    );
  }

  revalidatePath('/tasks');
  return { success: true, message: 'Report submitted.' };
}
export async function reviewTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskReviewSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid input.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canReview(task, actor.userId)) {
    return { success: false, message: 'You cannot review this task.' };
  }

  const now = new Date().toISOString();
  let nextStatus: Task['status'];
  let activityType: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  let notifTitle: string;

  switch (parsed.data.decision) {
    case 'APPROVE':
      nextStatus = 'COMPLETED';
      activityType = 'APPROVED';
      notifTitle = `Task approved: ${task.title}`;
      break;
    case 'REQUEST_CHANGES':
      nextStatus = 'CHANGES_REQUESTED';
      activityType = 'CHANGES_REQUESTED';
      notifTitle = `Changes requested: ${task.title}`;
      break;
    case 'REJECT':
      nextStatus = 'REJECTED';
      activityType = 'REJECTED';
      notifTitle = `Task rejected: ${task.title}`;
      break;
  }

  task.status = nextStatus;
  task.updatedAt = now;
  task.activity.push({
    id: genActivityId('review'),
    type: activityType,
    at: now,
    actorId: actor.userId,
    actorName: actor.fullName,
    note: parsed.data.note,
  });

  pushAuditLog(actor, 'TASK_REVIEWED', `${parsed.data.decision} on "${task.title}"`, task.id);
  task.assignedToIds.forEach((aid) =>
    pushNotification(
      aid,
      notifTitle,
      parsed.data.note ?? 'No additional notes.',
      'TASK_REVIEWED',
      task.id
    )
  );

  revalidatePath('/tasks');
  return { success: true, message: 'Review recorded.' };
}
export async function editTask(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = taskEditSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please fix the form validation errors.',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const actor = await readSession();
  const task = mockTasks.find((t) => t.id === parsed.data.taskId);
  if (!task) return { success: false, message: 'Task not found.' };
  if (!canEdit(task, actor.userId)) {
    return { success: false, message: 'You cannot edit this task.' };
  }

  const changes: string[] = [];
  if (parsed.data.title && parsed.data.title !== task.title) {
    changes.push(`title: "${task.title}" → "${parsed.data.title}"`);
    task.title = parsed.data.title;
  }
  if (parsed.data.description && parsed.data.description !== task.description) {
    changes.push('description updated');
    task.description = parsed.data.description;
  }
  if (parsed.data.priority && parsed.data.priority !== task.priority) {
    changes.push(`priority: ${task.priority} → ${parsed.data.priority}`);
    task.priority = parsed.data.priority;
  }
  if (parsed.data.dueDate) {
    const next = new Date(parsed.data.dueDate).toISOString();
    if (next !== task.dueDate) {
      changes.push(`due date updated`);
      task.dueDate = next;
    }
  }
  if (parsed.data.tags !== undefined) {
    const nextTags = parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (JSON.stringify(nextTags) !== JSON.stringify(task.tags)) {
      changes.push('tags updated');
      task.tags = nextTags;
    }
  }

  if (changes.length === 0) {
    return { success: true, message: 'No changes to save.' };
  }

  task.updatedAt = new Date().toISOString();
  task.activity.push({
    id: genActivityId('edited'),
    type: 'EDITED',
    at: task.updatedAt,
    actorId: actor.userId,
    actorName: actor.fullName,
    note: changes.join('; '),
  });

  revalidatePath('/tasks');
  return { success: true, message: 'Task updated.' };
}
