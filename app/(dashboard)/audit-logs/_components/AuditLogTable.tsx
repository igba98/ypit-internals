'use client';

import { AuditLog } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatRelativeTime } from '@/lib/utils';
import { Shield, Edit, Plus, Trash2, LogIn, LogOut } from 'lucide-react';
import { ActionDropdown } from '@/components/shared/ActionDropdown';

interface AuditLogTableProps {
  data: AuditLog[];
}

export function AuditLogTable({ data }: AuditLogTableProps) {
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.original.action;
        let Icon = Shield;
        let colorClass = 'text-gray-500 bg-gray-100';

        switch (action) {
          case 'CREATE':
            Icon = Plus;
            colorClass = 'text-green-600 bg-green-100';
            break;
          case 'UPDATE':
            Icon = Edit;
            colorClass = 'text-blue-600 bg-blue-100';
            break;
          case 'DELETE':
            Icon = Trash2;
            colorClass = 'text-red-600 bg-red-100';
            break;
          case 'LOGIN':
            Icon = LogIn;
            colorClass = 'text-indigo-600 bg-indigo-100';
            break;
          case 'LOGOUT':
            Icon = LogOut;
            colorClass = 'text-orange-600 bg-orange-100';
            break;
        }

        return (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="font-medium text-gray-900">{action}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
            <img src={`https://i.pravatar.cc/150?u=${row.original.userId}`} alt={row.original.userName} className="w-full h-full object-cover" />
          </div>
          <span className="text-gray-700">{row.original.userName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-mono">
          {row.original.module}
        </span>
      ),
    },
    {
      accessorKey: 'detail',
      header: 'Details',
      cell: ({ row }) => <span className="text-gray-600 truncate max-w-xs block" title={row.original.detail}>{row.original.detail}</span>,
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => <span className="text-gray-500 font-mono text-xs">{row.original.ipAddress}</span>,
    },
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ row }) => <span className="text-gray-500 whitespace-nowrap">{formatRelativeTime(row.original.timestamp)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="flex justify-end pr-2">
            <ActionDropdown basePath="/audit-logs" record={row.original} hideEdit hideDelete />
          </div>
        );
      },
    },
  ];

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="userName" 
    />
  );
}
