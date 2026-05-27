'use client';

import Link from 'next/link';
import { useState } from 'react';
import { University } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Building2 } from 'lucide-react';
import { UniversityForm } from './UniversityForm';

interface Props {
  universities: Array<University & { packageCount: number }>;
  selectedId?: string;
}

export function UniversityList({ universities, selectedId }: Props) {
  const [showArchived, setShowArchived] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const filtered = universities.filter(u => (showArchived ? true : u.status === 'ACTIVE'));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">Universities</h3>
        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>
      <label className="flex items-center gap-2 px-4 py-2 text-[11px] text-gray-500 border-b border-gray-100">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={e => setShowArchived(e.target.checked)}
        />
        Show archived
      </label>
      <ul className="divide-y divide-gray-100">
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-gray-400">No universities.</li>
        )}
        {filtered.map(u => (
          <li key={u.id}>
            <Link
              href={`/finance/catalog?uni=${u.id}`}
              className={cn(
                'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                u.id === selectedId && 'bg-primary-muted/40',
              )}
            >
              <div className="w-9 h-9 rounded-md bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {u.name}
                  {u.status === 'ARCHIVED' && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      Archived
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {u.country}
                  {u.city ? ` · ${u.city}` : ''} · {u.packageCount} package{u.packageCount === 1 ? '' : 's'}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {openCreate && <UniversityForm mode="create" onClose={() => setOpenCreate(false)} />}
    </div>
  );
}
