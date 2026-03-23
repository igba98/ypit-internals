'use client';

import { Application } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { ActionDropdown } from '@/components/shared/ActionDropdown';

interface ApplicationsTableProps {
  data: Application[];
}

export function ApplicationsTable({ data }: ApplicationsTableProps) {
  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
            <img src={`https://i.pravatar.cc/150?u=${row.original.studentId}`} alt={row.original.studentName} className="w-full h-full object-cover" />
          </div>
          <span className="font-medium text-gray-900">{row.original.studentName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'university',
      header: 'University',
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-gray-900">{app.university}</span>
            <span className="text-xs text-gray-500">{app.country}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'program',
      header: 'Program',
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-gray-900">{app.program}</span>
            <span className="text-xs text-gray-500">{app.level} • {app.intake}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'submissionDate',
      header: 'Submitted',
      cell: ({ row }) => {
        const date = row.original.submissionDate;
        return <span className="text-gray-500">{date ? formatDate(date) : '-'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colors = {
          PREPARING: 'bg-gray-100 text-gray-700',
          SUBMITTED: 'bg-blue-100 text-blue-700',
          UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
          ACCEPTED: 'bg-green-100 text-green-700 font-bold',
          REJECTED: 'bg-red-100 text-red-700',
          WAITLISTED: 'bg-purple-100 text-purple-700',
          DEFERRED: 'bg-orange-100 text-orange-700'
        };
        
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'decisionDate',
      header: 'Decision Date',
      cell: ({ row }) => {
        const date = row.original.decisionDate;
        return <span className="text-gray-500">{date ? formatDate(date) : '-'}</span>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionDropdown basePath="/applications" record={row.original} />,
    },
  ];

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="studentName" 
    />
  );
}
