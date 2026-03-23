'use client';

import { Student } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { MoreHorizontal, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudentsTableProps {
  data: Student[];
}

export function StudentsTable({ data }: StudentsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'fullName',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
              {student.avatar ? (
                <img src={student.avatar} alt={student.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
                  {student.fullName.charAt(0)}
                </div>
              )}
            </div>
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
      accessorKey: 'assignedAgentName',
      header: 'Assigned To',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created Date',
      cell: ({ row }) => <span className="text-gray-500">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/students/${row.original.id}`);
            }}
            className="p-2 text-gray-400 hover:text-primary rounded-md hover:bg-primary-muted transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        );
      },
    },
  ];

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="fullName" 
      onRowClick={(row) => router.push(`/students/${row.id}`)}
    />
  );
}
