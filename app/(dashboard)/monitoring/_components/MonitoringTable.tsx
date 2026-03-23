'use client';

import { OperationsRecord } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { ActionDropdown } from '@/components/shared/ActionDropdown';

interface MonitoringTableProps {
  data: OperationsRecord[];
}

export function MonitoringTable({ data }: MonitoringTableProps) {
  const columns: ColumnDef<OperationsRecord>[] = [
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
        const o = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-gray-900">{o.university}</span>
            <span className="text-xs text-gray-500">{o.country}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'arrivalDate',
      header: 'Arrival Date',
      cell: ({ row }) => {
        const date = row.original.arrivalDate;
        return <span className="text-gray-500">{date ? formatDate(date) : '-'}</span>;
      },
    },
    {
      accessorKey: 'lastCheckIn',
      header: 'Last Check-in',
      cell: ({ row }) => {
        const date = row.original.lastCheckIn;
        return <span className="text-gray-500">{date ? formatDate(date) : '-'}</span>;
      },
    },
    {
      accessorKey: 'checkInCount',
      header: 'Check-ins',
      cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.checkInCount}</span>,
    },
    {
      accessorKey: 'wellbeingStatus',
      header: 'Wellbeing',
      cell: ({ row }) => {
        const status = row.original.wellbeingStatus;
        const colors = {
          GOOD: 'bg-green-100 text-green-700',
          NEEDS_ATTENTION: 'bg-yellow-100 text-yellow-700 animate-pulse',
          ESCALATED: 'bg-red-100 text-red-700 font-bold'
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${colors[status]}`}>
            {status === 'ESCALATED' && <AlertTriangle className="w-3 h-3" />}
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'enrollmentConfirmed',
      header: 'Enrolled',
      cell: ({ row }) => {
        const confirmed = row.original.enrollmentConfirmed;
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${confirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {confirmed ? 'Yes' : 'No'}
          </span>
        );
      },
    },
    {
      accessorKey: 'escalationFlag',
      header: 'Escalated',
      cell: ({ row }) => {
        const escalated = row.original.escalationFlag;
        return escalated ? (
          <span className="text-red-500" title={row.original.escalationReason}>
            <AlertTriangle className="w-5 h-5" />
          </span>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionDropdown basePath="/monitoring" record={row.original} />,
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
