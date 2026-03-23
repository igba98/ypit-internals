'use server';

import { taskSchema } from '../validations/task';
import { mockTasks } from '../mock/mockTasks';
import { mockUsers } from '../mock/mockUsers';
import { revalidatePath } from 'next/cache';
import { ActionResult, Task } from '@/types';
import { cookies } from 'next/headers';

export async function addTask(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = taskSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Please fix the form validation errors.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const assignedUser = mockUsers.find(u => u.id === validatedFields.data.assignedToId);
    if (!assignedUser) {
      return { success: false, message: "Invalid assignee selected." };
    }

    // Determine assigner from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ypit_session');
    let assignerId = 'system';
    let assignerName = 'System Actions';
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie.value);
        assignerId = session.userId;
        assignerName = session.fullName;
      } catch (e) {}
    }

    const newTask: Task = {
      id: `tsk_${Math.random().toString(36).substr(2, 9)}`,
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      priority: validatedFields.data.priority,
      status: 'TODO',
      dueDate: new Date(validatedFields.data.dueDate).toISOString(),
      assignedToIds: [assignedUser.id],
      assignedToNames: [assignedUser.fullName],
      assignedById: assignerId,
      assignedByName: assignerName,
      department: assignedUser.department,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockTasks.unshift(newTask);
    revalidatePath('/tasks');

    return { success: true, message: "Task assigned successfully!" };
  } catch (error) {
    return { success: false, message: "Unexpected server error." };
  }
}

export async function submitTaskReport(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const taskId = formData.get('taskId') as string;
    const taskSummary = formData.get('taskSummary') as string;
    const progressMade = formData.get('progressMade') as string;
    const tomorrowPlan = formData.get('tomorrowPlan') as string;
    const blockers = formData.get('blockers') as string;
    let percentageComplete = parseInt(formData.get('percentageComplete') as string);
    if (isNaN(percentageComplete)) percentageComplete = 0;

    if (!taskId || !taskSummary || !progressMade || !tomorrowPlan) {
      return { success: false, message: "Please fill out all required report fields." };
    }

    const taskIndex = mockTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return { success: false, message: "Task could not be found." };
    }

    // Determine assigner from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ypit_session');
    let submitterId = 'system';
    let submitterName = 'System Actions';
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie.value);
        submitterId = session.userId;
        submitterName = session.fullName;
      } catch (e) {}
    }

    mockTasks[taskIndex].endOfDayReport = {
      taskSummary,
      progressMade,
      tomorrowPlan,
      percentageComplete,
      blockers: blockers || undefined,
      submittedAt: new Date().toISOString(),
      submittedById: submitterId,
      submittedByName: submitterName
    };

    // Auto-complete the task if percentage is 100
    if (percentageComplete === 100) {
      mockTasks[taskIndex].status = 'COMPLETED';
    } else {
      mockTasks[taskIndex].status = 'IN_PROGRESS';
    }
    
    mockTasks[taskIndex].updatedAt = new Date().toISOString();

    revalidatePath('/tasks');

    return { success: true, message: "Task report submitted securely!" };
  } catch (error) {
    return { success: false, message: "Unexpected server error." };
  }
}
