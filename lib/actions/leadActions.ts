'use server';

import { leadSchema } from '../validations/lead';
import { mockLeads } from '../mock/mockLeads';
import { revalidatePath } from 'next/cache';
import { ActionResult, Lead } from '@/types';

export async function addLead(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = leadSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Please fix the errors in the form.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const newLead: Lead = {
      id: `ld_${Math.random().toString(36).substr(2, 9)}`,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...validatedFields.data
    } as Lead;

    // Mutate the mock array
    mockLeads.unshift(newLead);
    
    revalidatePath('/leads');

    return { success: true, message: "Lead added successfully!" };
  } catch (error) {
    return { success: false, message: "An unexpected error occurred." };
  }
}
