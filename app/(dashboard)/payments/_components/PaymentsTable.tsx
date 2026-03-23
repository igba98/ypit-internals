'use client';

import { PaymentRecord } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ActionDropdown } from '@/components/shared/ActionDropdown';

interface PaymentsTableProps {
  data: PaymentRecord[];
}

export function PaymentsTable({ data }: PaymentsTableProps) {
  const columns: ColumnDef<PaymentRecord>[] = [
    {
      accessorKey: 'lastPaymentDate',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.original.lastPaymentDate;
        return <span className="text-gray-500">{date ? formatDate(date) : '-'}</span>;
      },
    },
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.studentName}</span>,
    },
    {
      accessorKey: 'receiptNumbers',
      header: 'Receipt(s)',
      cell: ({ row }) => {
        const receipts = row.original.receiptNumbers;
        if (!receipts || receipts.length === 0) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex flex-col gap-1">
            {receipts.map(r => (
              <span key={r} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{r}</span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'agencyFee',
      header: 'Agency Fee',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col text-xs">
            <span className="text-gray-900">{formatCurrency(p.agencyFeePaid)}</span>
            <span className="text-gray-400">/ {formatCurrency(p.agencyFee)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'applicationFee',
      header: 'App Fee',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col text-xs">
            <span className="text-gray-900">{formatCurrency(p.applicationFeePaid)}</span>
            <span className="text-gray-400">/ {formatCurrency(p.applicationFee)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalPaid',
      header: 'Total Paid',
      cell: ({ row }) => <span className="font-medium text-green-600">{formatCurrency(row.original.totalPaid)}</span>,
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => <span className="font-medium text-red-600">{formatCurrency(row.original.balance)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colors = {
          PENDING: 'bg-gray-100 text-gray-700',
          PARTIAL: 'bg-green-50 text-green-700 italic',
          CLEARED: 'bg-gray-200 text-gray-800 font-bold',
          OVERDUE: 'bg-orange-100 text-orange-700'
        };
        
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionDropdown basePath="/payments" record={row.original} />,
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
