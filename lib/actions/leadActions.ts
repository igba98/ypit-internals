'use server';

import { z } from 'zod';
import { mockUsers } from '../mock/mockUsers';
import { leadSchema } from '../validations/lead';
import { revalidatePath } from 'next/cache';
import { ActionResult, User } from '@/types';

export async function addLead(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = leadSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        message: "Please fix the validation errors.",
        errors: z.flattenError(parsed.error).fieldErrors,
      };
    }

    const { fullName, email, phone, role, department } = parsed.data;

    if (mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return {
        success: false,
        message: "A user with this email already exists.",
        errors: { email: ["This email is already in use."] },
      };
    }

    const newUser: User = {
      id: `usr_${Math.random().toString(36).slice(2, 11)}`,
      fullName,
      email,
      phone,
      role,
      department,
      password: 'ypit2026',
      status: 'ACTIVE',
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString(),
    };

    mockUsers.unshift(newUser);

    revalidatePath('/leads');
    revalidatePath('/staff');

    return { success: true, message: "Employee lead added successfully!" };
  } catch {
    return { success: false, message: "An unexpected error occurred processing the lead." };
  }
}
