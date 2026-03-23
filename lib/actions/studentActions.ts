'use server';

import { studentSchema } from '../validations/student';
import { mockStudents } from '../mock/mockStudents';
import { revalidatePath } from 'next/cache';
import { ActionResult, Student } from '@/types';

export async function addStudent(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = studentSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Please fix the errors in the form.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Auto calculate age (mock calculation)
    const birthYear = new Date(validatedFields.data.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    const newStudent: Student = {
      id: `std_${Math.random().toString(36).substr(2, 9)}`,
      registrationNumber: `YP-${currentYear}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      pipelineStage: 'COUNSELING', // Start at counseling since they're fully added as students
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      age: age,
      ...validatedFields.data
    } as Student;

    // Mutate the mock array natively without a DB
    mockStudents.unshift(newStudent);
    
    revalidatePath('/students');

    return { success: true, message: "Student onboarded successfully!" };
  } catch (error) {
    return { success: false, message: "An unexpected error occurred processing the student." };
  }
}
