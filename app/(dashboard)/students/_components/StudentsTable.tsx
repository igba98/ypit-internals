'use client';

import { useState, useMemo } from 'react';
import { Avatar } from '@/components/shared/Avatar';
import { Student, ROLES, Role } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getStageOwners } from '@/lib/pipeline/stageOwnership';

interface StudentsTableProps {
  data: Student[];
  userRole?: string;
}

export function StudentsTable({ data }: StudentsTableProps) {
  const router = useRouter();
  const [filterRole, setFilterRole] = useState<Role | null>(null);

  const filteredData = useMemo(() => {
    if (!filterRole) return data;
    return data.filter(s => getStageOwners(s.pipelineStage).includes(filterRole));
  }, [data, filterRole]);

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'fullName',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={student.fullName} size="md" />
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{student.fullName}</span>
              <span className="text-xs text-gray-500">{student.registrationNumber}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'nationality',
      header: 'Nationality',
    },
    {
      accessorKey: 'targetUniversity',
      header: 'Target University',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-gray-900">{student.targetUniversity}</span>
            <span className="text-xs text-gray-500">{student.targetCountry}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'pipelineStage',
      header: 'Stage',
      cell: ({ row }) => <StatusBadge status={row.original.pipelineStage} variant="pipeline" />,
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: ({ row }) => {
        const s = row.original;
        if (!s.stageOwnerId) return <span className="text-gray-400 text-sm">Unassigned</span>;
        return <span className="text-sm text-gray-700">{s.stageOwnerName ?? 'Unknown'}</span>;
      },
    },
    {
      accessorKey: 'assignedAgentName',
      header: 'Assigned Lead',
      cell: ({ row }) => {
        const student = row.original;
        if (!student.assignedAgentId || !student.assignedAgentName) {
          return <span className="text-gray-400 text-sm">Unassigned</span>;
        }
        
        return (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/leads/${student.assignedAgentId}`);
            }}
            className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-md text-xs font-medium cursor-pointer transition-colors"
          >
            {student.assignedAgentName}
          </div>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Created Date',
      cell: ({ row }) => <span className="text-gray-500">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/students/${student.id}`);
              }}
              className="p-2 text-gray-400 hover:text-primary rounded-md hover:bg-primary-muted transition-colors"
              title="View Details"
              aria-label={`View ${student.fullName}`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setFilterRole(null)}
          className={`px-2.5 py-1 rounded ${filterRole === null ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All
        </button>
        {[ROLES.MARKETING_STAFF, ROLES.FINANCE, ROLES.ADMISSIONS, ROLES.TRAVEL, ROLES.OPERATIONS].map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-2.5 py-1 rounded ${filterRole === r ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Waiting on {r.replace(/_/g, ' ').toLowerCase()}
          </button>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="fullName"
        onRowClick={(row) => router.push(`/students/${row.id}`)}
      />
    </div>
  );
}
