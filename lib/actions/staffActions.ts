'use server';

import { staffSchema } from '../validations/staff';
import { mockUsers } from '../mock/mockUsers';
import { revalidatePath } from 'next/cache';
import { ActionResult, User } from '@/types';

export async function addStaff(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = staffSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Please fix the validation errors.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { fullName, email, role, department, status } = validatedFields.data;

    // Check for dupes
    if (mockUsers.some(u => u.email === email)) {
      return { success: false, message: "A staff member with this email already exists." };
    }

    const newStaff: User = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      fullName,
      email,
      role,
      department,
      status,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      createdAt: new Date().toISOString()
    };

    // Simulate DB update natively
    mockUsers.unshift(newStaff);
    
    revalidatePath('/staff');

    return { success: true, message: "Staff member added successfully!" };
  } catch (error) {
    return { success: false, message: "Unexpected server error." };
  }
}
