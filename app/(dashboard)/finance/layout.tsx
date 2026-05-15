import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FinanceSubNav } from './_components/FinanceSubNav';
import { Role } from '@/types';

const ALLOWED_ROLES: Role[] = ['FINANCE', 'MANAGING_DIRECTOR'];

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');

  let session: { role: Role };
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect('/login');
  }

  if (!ALLOWED_ROLES.includes(session.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <FinanceSubNav />
      {children}
    </div>
  );
}
