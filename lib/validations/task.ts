import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(5, "Task title must be at least 5 characters long"),
  description: z.string().min(10, "Please provide a more detailed description"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().min(10, "Due date is required"),
  assignedToId: z.string().min(2, "You must assign this task to someone"),
  department: z.string().optional()
});

export type TaskFormValues = z.infer<typeof taskSchema>;
