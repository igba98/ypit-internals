'use client';

import { useState } from 'react';
import Link from 'next/link';
import { University, Package, StudyLevel } from '@/types';
import { Plus, Building2 } from 'lucide-react';
import { UniversityForm } from './UniversityForm';
import { PackageForm } from './PackageForm';
import { ArchiveRestoreButton, DuplicatePackageButton } from './CatalogActions';
import { formatCurrency } from '@/lib/format';

interface Props {
  university: University;
  packages: Array<Package & { studentCount: number }>;
}

const LEVEL_ORDER: StudyLevel[] = ['FOUNDATION', 'BACHELOR', 'MASTERS', 'PHD', 'DIPLOMA'];

export function PackageList({ university, packages }: Props) {
  const [editUni, setEditUni] = useState(false);
  const [newPackage, setNewPackage] = useState(false);
  const [editPackage, setEditPackage] = useState<Package & { studentCount: number } | null>(null);

  const grouped = LEVEL_ORDER
    .map(level => ({ level, items: packages.filter(p => p.studyLevel === level) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <header className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-primary-muted text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900 truncate">{university.name}</h3>
            {university.status === 'ARCHIVED' && (
              <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Archived</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {university.country}
            {university.city && ` · ${university.city}`}
            {university.contactEmail && ` · ${university.contactEmail}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setEditUni(true)} className="text-xs font-medium text-gray-600 hover:text-gray-900">Edit</button>
          <ArchiveRestoreButton kind="university" id={university.id} status={university.status} />
          <button
            onClick={() => setNewPackage(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-md hover:bg-primary-dark"
          >
            <Plus className="w-3.5 h-3.5" />
            New Package
          </button>
        </div>
      </header>

      {packages.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm font-semibold text-gray-900">No packages yet</p>
          <p className="text-xs text-gray-500 mt-1">Click <strong>New Package</strong> to add one.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {grouped.map(g => (
            <section key={g.level} className="p-5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">{g.level}</h4>
              <ul className="space-y-2">
                {g.items.map(pkg => (
                  <li key={pkg.id} className="border border-gray-100 rounded-md p-4 flex items-start justify-between gap-3 hover:shadow-card transition-shadow">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                      <p className="text-[11px] text-gray-500">{pkg.program} · {pkg.studentCount} student{pkg.studentCount === 1 ? '' : 's'}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {pkg.feeDefaults.map((d, i) => (
                          <li key={i} className="text-[10px] bg-gray-50 text-gray-700 px-1.5 py-0.5 rounded">
                            {d.type}: {formatCurrency(d.amount, { currency: d.currency })}
                            {!d.required && ' (opt)'}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Link href={`/finance/catalog/${pkg.id}`} className="text-xs font-medium text-primary hover:underline">View</Link>
                      <button onClick={() => setEditPackage(pkg)} className="text-xs font-medium text-gray-600 hover:text-gray-900">Edit</button>
                      <DuplicatePackageButton id={pkg.id} />
                      <ArchiveRestoreButton kind="package" id={pkg.id} status={pkg.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editUni && <UniversityForm mode="edit" university={university} onClose={() => setEditUni(false)} />}
      {newPackage && <PackageForm mode="create" universityId={university.id} onClose={() => setNewPackage(false)} />}
      {editPackage && <PackageForm mode="edit" universityId={university.id} pkg={editPackage} studentCount={editPackage.studentCount} onClose={() => setEditPackage(null)} />}
    </div>
  );
}
