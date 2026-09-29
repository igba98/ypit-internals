'use client';

import { useState } from 'react';

import { User } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { Avatar } from '@/components/shared/Avatar';
import { Phone, Mail } from 'lucide-react';
import { ActionDropdown } from '@/components/shared/ActionDropdown';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { EditStaffPanel } from './EditStaffButton';

interface StaffTableProps {
  data: User[];
}

export function StaffTable({ data }: StaffTableProps) {
  const [editing, setEditing] = useState<User | null>(null);
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'fullName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.fullName} size="md" />
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
      cell: ({ row }) => <ActionDropdown
          viewHref={`/staff/${row.original.id}`}
          onEdit={() => setEditing(row.original)}
        />,
    },
  ];

  return (
    <>
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="fullName" 
    />

      <SlideInPanel
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit Staff · ${editing.fullName}` : 'Edit staff'}
        description="Update profile, salary, role and account status."
      >
        {editing && <EditStaffPanel staff={editing} onClose={() => setEditing(null)} />}
      </SlideInPanel>
    </>
  );
}
