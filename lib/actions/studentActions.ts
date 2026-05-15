'use server';

import { z } from 'zod';
import { studentSchema } from '../validations/student';
import { mockStudents } from '../mock/mockStudents';
import { revalidatePath } from 'next/cache';
import { ActionResult, Student, ADMITTED_STAGES, PipelineStage, PIPELINE_STAGES } from '@/types';

const PIPELINE_STAGE_VALUES = Object.values(PIPELINE_STAGES);

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

export async function updateStudentStage(studentId: string, newStage: string): Promise<ActionResult> {
  if (!PIPELINE_STAGE_VALUES.includes(newStage as PipelineStage)) {
    return { success: false, message: "Invalid pipeline stage." };
  }
  const student = mockStudents.find(s => s.id === studentId);
  if (!student) {
    return { success: false, message: "Student not found." };
  }
  if (student.pipelineStage === newStage) {
    return { success: false, message: "Already at that stage." };
  }
  student.pipelineStage = newStage as PipelineStage;
  student.updatedAt = new Date().toISOString();

  revalidatePath('/students');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/leads');

  return { success: true, message: `Stage updated to ${newStage.replace(/_/g, ' ').toLowerCase()}.` };
}

export async function admitStudent(studentId: string): Promise<ActionResult> {
  if (!studentId) {
    return { success: false, message: "Missing student ID." };
  }

  const student = mockStudents.find(s => s.id === studentId);
  if (!student) {
    return { success: false, message: "Student not found." };
  }

  if (ADMITTED_STAGES.includes(student.pipelineStage)) {
    return { success: false, message: `${student.fullName} is already admitted.` };
  }

  student.pipelineStage = 'UNIVERSITY_ACCEPTED';
  student.updatedAt = new Date().toISOString();

  revalidatePath('/students');
  revalidatePath(`/students/${studentId}`);
  revalidatePath('/leads');

  return { success: true, message: `${student.fullName} marked as admitted.` };
}
