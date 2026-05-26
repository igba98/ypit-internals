import { Task } from '@/types';

export function isPersonalTask(task: Task): boolean {
  return (
    task.assignedToIds.length === 1 &&
    task.assignedToIds[0] === task.assignedById
  );
}

const CLOSED_STATUSES: Task['status'][] = ['COMPLETED', 'REJECTED'];

export function canStart(task: Task, userId: string): boolean {
  if (!task.assignedToIds.includes(userId)) return false;
  return task.status === 'TODO' || task.status === 'CHANGES_REQUESTED';
}

export function canSubmit(task: Task, userId: string): boolean {
  if (!task.assignedToIds.includes(userId)) return false;
  return task.status === 'IN_PROGRESS' || task.status === 'CHANGES_REQUESTED';
}

export function canReview(task: Task, userId: string): boolean {
  if (isPersonalTask(task)) return false;
  if (task.assignedById !== userId) return false;
  return task.status === 'SUBMITTED';
}

export function canBlock(task: Task, userId: string): boolean {
  if (CLOSED_STATUSES.includes(task.status)) return false;
  if (task.status === 'SUBMITTED') return false;
  if (task.status === 'BLOCKED') return false;
  return task.assignedToIds.includes(userId) || task.assignedById === userId;
}

export function canUnblock(task: Task, userId: string): boolean {
  if (task.status !== 'BLOCKED') return false;
  return task.assignedToIds.includes(userId) || task.assignedById === userId;
}

export function canEdit(task: Task, userId: string): boolean {
  if (CLOSED_STATUSES.includes(task.status)) return false;
  if (task.status === 'SUBMITTED') return false;
  return task.assignedById === userId;
}

export function needsMyAction(task: Task, userId: string): boolean {
  if (!task.assignedToIds.includes(userId)) return false;
  return (
    task.status === 'TODO' ||
    task.status === 'IN_PROGRESS' ||
    task.status === 'CHANGES_REQUESTED'
  );
}

export function awaitsMyReview(task: Task, userId: string): boolean {
  if (isPersonalTask(task)) return false;
  return task.assignedById === userId && task.status === 'SUBMITTED';
}

export type DayBin =
  | 'needs-submit'
  | 'awaiting-review'
  | 'due-today'
  | 'overdue'
  | 'blocked';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function binFor(task: Task, userId: string, now: Date): DayBin | null {
  if (CLOSED_STATUSES.includes(task.status)) return null;
  if (task.status === 'BLOCKED' && (task.assignedToIds.includes(userId) || task.assignedById === userId)) {
    return 'blocked';
  }
  if (awaitsMyReview(task, userId)) return 'awaiting-review';
  if (!task.assignedToIds.includes(userId)) return null;

  const due = new Date(task.dueDate);
  if (due < now && !isSameDay(due, now)) return 'overdue';
  if (isSameDay(due, now)) return 'due-today';
  return 'needs-submit';
}
