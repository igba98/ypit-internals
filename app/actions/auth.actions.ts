'use server';

import { ActionResult } from '@/types';
import { findUserByEmail } from '@/lib/mock/mockUsers';
import { simulateDelay } from '@/lib/mock/utils';
import { cookies } from 'next/headers';

export async function validateLogin(formData: FormData): Promise<ActionResult> {
  await simulateDelay(500);
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return { success: false, message: 'Email and password are required' };
  }
  
  const user = findUserByEmail(email);
  
  if (!user || user.password !== password) {
    return { success: false, message: 'Invalid email or password' };
  }
  
  if (user.status !== 'ACTIVE') {
    return { success: false, message: 'Account is not active' };
  }
  
  const session = {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    department: user.department,
    avatar: user.avatar,
  };
  
  const cookieStore = await cookies();
  cookieStore.set('ypit_session', JSON.stringify(session), { path: '/', maxAge: 86400 });
  
  return { success: true, message: 'Login successful', data: user };
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('ypit_session');
}
