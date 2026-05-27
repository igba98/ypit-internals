import { z } from 'zod';

export const taskCreateSchema = z.object({
  title: z.string().min(5, 'Task title must be at least 5 characters'),
  description: z.string().min(10, 'Please provide a more detailed description'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().min(10, 'Due date is required'),
  assignedToId: z.string().optional(),
  tags: z.string().optional(),
});

export const taskSubmitSchema = z.object({
  taskId: z.string().min(1),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  progressMade: z.string().min(10, 'Describe what was accomplished'),
  percentageComplete: z.coerce.number().min(0).max(100),
  nextActions: z.string().optional(),
  blockers: z.string().optional(),
});

export const taskReviewSchema = z
  .object({
    taskId: z.string().min(1),
    decision: z.enum(['APPROVE', 'REQUEST_CHANGES', 'REJECT']),
    note: z.string().optional(),
  })
  .refine(
    (d) => d.decision === 'APPROVE' || (d.note != null && d.note.trim().length >= 3),
    { message: 'A reason is required when requesting changes or rejecting', path: ['note'] }
  );

export const taskBlockSchema = z.object({
  taskId: z.string().min(1),
  reason: z.string().min(3, 'Block reason must be at least 3 characters'),
});

export const taskUnblockSchema = z.object({
  taskId: z.string().min(1),
});

export const taskStartSchema = z.object({
  taskId: z.string().min(1),
});

export const taskEditSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(5, 'Task title must be at least 5 characters').optional(),
  description: z.string().min(10, 'Please provide a more detailed description').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
});

export type TaskCreateValues = z.infer<typeof taskCreateSchema>;
export type TaskSubmitValues = z.infer<typeof taskSubmitSchema>;
export type TaskReviewValues = z.infer<typeof taskReviewSchema>;
