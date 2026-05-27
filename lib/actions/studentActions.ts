'use server';

import { z } from 'zod';
import { studentSchema } from '../validations/student';
import { mockStudents } from '../mock/mockStudents';
import { revalidatePath } from 'next/cache';
import { ActionResult, Student } from '@/types';

export async function addStudent(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = studentSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the errors in the form.",
        errors: z.flattenError(parsed.error).fieldErrors,
      };
    }

    const birthYear = new Date(parsed.data.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    const newStudent: Student = {
      id: `std_${Math.random().toString(36).slice(2, 11)}`,
      registrationNumber: `YP-${currentYear}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      pipelineStage: 'COUNSELING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      age,
      ...parsed.data,
    } as Student;

    mockStudents.unshift(newStudent);

    revalidatePath('/students');

    return { success: true, message: "Student onboarded successfully!" };
  } catch {
    return { success: false, message: "An unexpected error occurred processing the student." };
  }
}

