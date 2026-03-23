import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const collapsedCookie = cookieStore.get('ypit_sidebar_collapsed');
  const initialCollapsed = collapsedCookie?.value === 'true';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar initialCollapsed={initialCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
