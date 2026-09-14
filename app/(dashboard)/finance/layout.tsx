import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FinanceSubNav } from './_components/FinanceSubNav';
import { PermissionMap, Role } from '@/types';
import { pageAllowed } from '@/lib/permissions';

const ALLOWED_ROLES: Role[] = ['FINANCE', 'MANAGING_DIRECTOR'];

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');

  let session: { role: Role; permissions?: PermissionMap };
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect('/login');
  }

  // Finance + MD natively; a Finance Assistant needs the 'finance' module granted.
  if (!pageAllowed(session, 'finance', ALLOWED_ROLES)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <FinanceSubNav />
      {children}
    </div>
  );
}
