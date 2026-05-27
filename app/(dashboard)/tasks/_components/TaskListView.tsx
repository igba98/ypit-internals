'use client';

import { useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Task } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TaskDetailPanel } from './TaskDetailPanel';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export function TaskListView({
  initialTasks,
  currentUserId,
}: {
  initialTasks: Task[];
  currentUserId: string;
}) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const openTask = openTaskId ? initialTasks.find((t) => t.id === openTaskId) : null;

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'title',
      header: 'Task',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.title}</div>
          <div className="text-gray-500 text-xs truncate max-w-xs">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} variant="task" />,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <span
          className={
            row.original.priority === 'URGENT'
              ? 'text-xs font-semibold text-red-600'
              : row.original.priority === 'HIGH'
                ? 'text-xs font-semibold text-orange-500'
                : row.original.priority === 'MEDIUM'
                  ? 'text-xs font-semibold text-blue-500'
                  : 'text-xs font-semibold text-gray-500'
          }
        >
          {row.original.priority}
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due',
      cell: ({ row }) => (
        <span className="text-gray-600">{new Date(row.original.dueDate).toLocaleDateString()}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end pr-2">
          <Button size="sm" variant="outline" onClick={() => setOpenTaskId(row.original.id)}>
            <Eye className="w-3.5 h-3.5 mr-1" />
            Open
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="pt-2">
      <DataTable
        columns={columns}
        data={initialTasks}
        searchKey="title"
        emptyMessage="No tasks found matching this criteria."
      />
      {openTask && (
        <TaskDetailPanel
          task={openTask}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={() => setOpenTaskId(null)}
        />
      )}
    </div>
  );
}
