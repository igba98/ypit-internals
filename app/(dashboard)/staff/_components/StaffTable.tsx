'use client';

import { User } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { Phone, Mail } from 'lucide-react';
import { ActionDropdown } from '@/components/shared/ActionDropdown';

interface StaffTableProps {
  data: User[];
}

export function StaffTable({ data }: StaffTableProps) {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'fullName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
            <img src={`https://i.pravatar.cc/150?u=${row.original.id}`} alt={row.original.fullName} className="w-full h-full object-cover" />
          </div>
          <span className="font-medium text-gray-900">{row.original.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => {
        const dept = row.original.department;
        return <span className="text-gray-600">{dept ? dept.replace('_', ' ') : '-'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionDropdown basePath="/staff" record={row.original} />,
    },
  ];

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="fullName" 
    />
  );
}
