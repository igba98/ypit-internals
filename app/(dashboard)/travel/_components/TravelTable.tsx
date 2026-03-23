'use client';

import { TravelRecord } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { ActionDropdown } from '@/components/shared/ActionDropdown';

interface TravelTableProps {
  data: TravelRecord[];
}

export function TravelTable({ data }: TravelTableProps) {
  const columns: ColumnDef<TravelRecord>[] = [
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
      accessorKey: 'destinationCity',
      header: 'Destination',
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-gray-900">{t.destinationCity}</span>
            <span className="text-xs text-gray-500">{t.destinationAirport}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'passportStatus',
      header: 'Passport',
      cell: ({ row }) => {
        const status = row.original.passportStatus;
        const colors = {
          HAS_PASSPORT: 'bg-green-100 text-green-700',
          APPLYING: 'bg-yellow-100 text-yellow-700',
          READY: 'bg-blue-100 text-blue-700'
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'visaStatus',
      header: 'Visa',
      cell: ({ row }) => {
        const status = row.original.visaStatus;
        const colors = {
          NOT_STARTED: 'bg-gray-100 text-gray-700',
          DOCUMENTS_GATHERING: 'bg-yellow-100 text-yellow-700',
          APPLIED: 'bg-blue-100 text-blue-700',
          APPOINTMENT_BOOKED: 'bg-indigo-100 text-indigo-700',
          APPROVED: 'bg-green-100 text-green-700 font-bold',
          REJECTED: 'bg-red-100 text-red-700',
          APPEALING: 'bg-orange-100 text-orange-700'
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'flightDate',
      header: 'Flight Date',
      cell: ({ row }) => {
        const date = row.original.flightDate;
        return <span className="text-gray-500">{date ? formatDate(date) : '-'}</span>;
      },
    },
    {
      accessorKey: 'airline',
      header: 'Airline',
    },
    {
      accessorKey: 'airportPickupArranged',
      header: 'Pickup',
      cell: ({ row }) => {
        const arranged = row.original.airportPickupArranged;
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${arranged ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {arranged ? 'Yes' : 'No'}
          </span>
        );
      },
    },
    {
      accessorKey: 'travelStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.travelStatus;
        const colors = {
          PLANNING: 'bg-gray-100 text-gray-700',
          VISA_PENDING: 'bg-yellow-100 text-yellow-700',
          READY: 'bg-green-100 text-green-700 font-bold',
          TRAVELLED: 'bg-primary text-white font-bold'
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionDropdown basePath="/travel" record={row.original} />,
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
