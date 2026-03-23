'use client';

import { DataTable } from '@/components/shared/DataTable';
import { Task } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { ReportTaskPanel } from './ReportTaskPanel';

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: 'Task Title',
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
    cell: ({ row }) => {
      const status = row.original.status;
      let badge = "bg-gray-100 text-gray-600";
      if (status === 'IN_PROGRESS') badge = "bg-blue-100 text-blue-700";
      if (status === 'COMPLETED') badge = "bg-green-100 text-green-700";
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge}`}>
          {status.replace('_', ' ')}
        </span>
      );
    }
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => (
       <span className={`text-xs font-semibold ${
        row.original.priority === 'URGENT' ? 'text-red-600' :
        row.original.priority === 'HIGH' ? 'text-orange-500' :
        row.original.priority === 'MEDIUM' ? 'text-blue-500' : 'text-gray-500'
      }`}>
        {row.original.priority}
      </span>
    )
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => (
      <span className="text-gray-600">
        {new Date(row.original.dueDate).toLocaleDateString()}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex justify-end pr-4">
        <ReportTaskPanel task={row.original} />
      </div>
    )
  }
];

export function TaskListView({ initialTasks }: { initialTasks: Task[] }) {
  return (
    <div className="pt-2">
      <DataTable 
        columns={columns} 
        data={initialTasks} 
        searchKey="title"
        emptyMessage="No tasks found matching this criteria."
      />
    </div>
  );
}
