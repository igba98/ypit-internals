import { GenericDetailPage } from '@/components/shared/GenericDetailPage';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { DocumentManagement } from '../_components/DocumentManagement';
import { backendFetch } from '@/lib/backend';
import { Application } from '@/types';

async function loadApplication(id: string): Promise<Application | null> {
  try {
    const res = await backendFetch(`/applications/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as Application;
  } catch {
    return null;
  }
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('ypit_session')) redirect('/login');

  const { id } = await params;
  const record = await loadApplication(id);
  if (!record) notFound();

  return (
    <div className="space-y-8">
      <GenericDetailPage
        title={`Application Lifecycle: ${record.studentName}`}
        data={record as unknown as Record<string, unknown>}
        backPath="/applications"
        backLabel="Applications"
      />

      <div className="max-w-5xl mx-auto px-4 md:px-0">
        <DocumentManagement studentId={record.studentId} />
      </div>
    </div>
  );
}
