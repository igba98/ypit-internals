'use client';

import Link from 'next/link';
import { Student, Session } from '@/types';
import { mockStudents } from '@/lib/mock/mockStudents';
import { getStageOwners } from '@/lib/pipeline/stageOwnership';
import { AdvanceStageButton } from './AdvanceStageButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  session: Session;
  title?: string;
  emptyText?: string;
  limit?: number;
}

export function MyQueue({ session, title = 'My Queue', emptyText = 'No students waiting on you right now.', limit = 10 }: Props) {
  const students = mockStudents
    .filter(s => {
      const owners = getStageOwners(s.pipelineStage);
      return owners.includes(session.role) || s.stageOwnerId === session.userId;
    })
    .sort((a, b) => (a.stageEnteredAt ?? a.createdAt).localeCompare(b.stageEnteredAt ?? b.createdAt))
    .slice(0, limit);

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {students.length === 0 && <p className="text-sm text-gray-500">{emptyText}</p>}
        {students.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {students.map(s => <QueueRow key={s.id} student={s} session={session} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function QueueRow({ student, session }: { student: Student; session: Session }) {
  const days = daysSince(student.stageEnteredAt ?? student.createdAt);
  const badgeClass =
    days > 14 ? 'bg-red-100 text-red-700' :
    days > 7 ? 'bg-yellow-100 text-yellow-700' :
    'bg-gray-100 text-gray-600';

  return (
    <li className="py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <Link href={`/students/${student.id}`} className="font-medium text-gray-900 hover:underline truncate block">{student.fullName}</Link>
        <p className="text-xs text-gray-500 truncate">
          {student.pipelineStage.replace(/_/g, ' ').toLowerCase()} · <span className={`px-1.5 py-0.5 rounded ${badgeClass}`}>{days}d waiting</span>
        </p>
      </div>
      <AdvanceStageButton student={student} session={session} size="sm" />
    </li>
  );
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}