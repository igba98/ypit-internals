import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { pageAllowed } from '@/lib/permissions';
import { Session, User } from '@/types';
import { Users, UserCheck, UserX } from 'lucide-react';
import {
  AllocateStudents,
  AllocatableStudent,
} from '../student-leads/_components/AllocateStudents';

// IT runs the allocation; the MD and the Administrator can too.
const ALLOWED = ['IT_ADMIN', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'OPERATIONS'];

interface Officer {
  id: string;
  fullName: string;
  role: string;
}

async function loadStudents(): Promise<AllocatableStudent[]> {
  try {
    const res = await backendFetch('/students?limit=500');
    if (!res.ok) return [];
    const body = (await res.json()) as {
      items: {
        id: string;
        fullName: string;
        registrationNumber: string;
        pipelineStage: string;
        marketingStaffId?: string | null;
        marketingStaffName?: string | null;
      }[];
    };
    return (body.items ?? []).map((s) => ({
      id: s.id,
      fullName: s.fullName,
      registrationNumber: s.registrationNumber,
      pipelineStage: s.pipelineStage,
      marketingStaffId: s.marketingStaffId ?? null,
      officerName: s.marketingStaffName ?? null,
    }));
  } catch {
    return [];
  }
}

async function loadOfficers(): Promise<Officer[]> {
  try {
    const res = await backendFetch('/staff?limit=500&status=ACTIVE');
    if (!res.ok) return [];
    const body = (await res.json()) as { items: User[] };
    return (body.items ?? [])
      .filter((u) => ['MARKETING_STAFF', 'TRAVEL', 'MARKETING_MANAGER'].includes(u.role))
      .map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }));
  } catch {
    return [];
  }
}

/**
 * Hand students to Relations Officers (client report, Nov 2026). The leads
 * board only ever covered leads, so students - especially the ones entered
 * before the officers existed - had nowhere to be allocated from.
 */
export default async function StudentAllocationPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'leads', ALLOWED)) redirect('/dashboard');

  const [students, officers] = await Promise.all([loadStudents(), loadOfficers()]);
  const unassigned = students.filter((s) => !s.marketingStaffId).length;

  // How the book is split today, so IT can see who is carrying what.
  const perOfficer = officers
    .map((o) => ({
      name: o.fullName,
      count: students.filter((s) => s.marketingStaffId === o.id).length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Allocation"
        description="Every student in the pipeline and the Relations Officer carrying them. Move students between officers here."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Students" value={students.length} icon={Users} />
        <KPICard label="Allocated" value={students.length - unassigned} icon={UserCheck} />
        <KPICard label="Not allocated" value={unassigned} icon={UserX} />
      </div>

      {perOfficer.length > 0 && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">
            Current split
          </p>
          <div className="flex flex-wrap gap-2">
            {perOfficer.map((o) => (
              <span
                key={o.name}
                className="px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-700"
              >
                {o.name} <b className="text-gray-900">{o.count}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      <AllocateStudents students={students} officers={officers} />
    </div>
  );
}
