import { PageHeader } from '@/components/shared/PageHeader';
import { SettingsForm } from './_components/SettingsForm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Session } from '@/types';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and system settings."
      />

      <SettingsForm session={session} />
    </div>
  );
}
