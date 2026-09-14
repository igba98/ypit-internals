'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { modulesForAssistant } from '@/lib/permissions';
import { PermissionLevel, PermissionMap } from '@/types';

const LEVELS: { value: PermissionLevel | 'NONE'; label: string; hint: string }[] = [
  { value: 'NONE', label: 'None', hint: 'Hidden' },
  { value: 'VIEW', label: 'View', hint: 'Read only' },
  { value: 'EDIT', label: 'Edit', hint: 'Add + edit' },
  { value: 'FULL', label: 'Full', hint: 'Incl. delete' },
];

/**
 * Per-module access picker for assistant accounts. Renders hidden inputs
 * named `perm.<key>` so the surrounding <form action> submits the matrix
 * with everything else — no extra state plumbing needed.
 */
export function PermissionMatrix({
  assistantType,
  initial,
}: {
  assistantType: string;
  /** Existing matrix when editing. Undefined = new account → starts "just like the main role" (Edit everywhere). */
  initial?: PermissionMap | null;
}) {
  const offered = modulesForAssistant(assistantType);
  const [values, setValues] = useState<Record<string, PermissionLevel | 'NONE'>>(
    () => {
      const v: Record<string, PermissionLevel | 'NONE'> = {};
      for (const m of offered) {
        v[m.key] = initial === undefined ? (m.sensitive ? 'NONE' : 'EDIT') : (initial?.[m.key] ?? 'NONE');
      }
      return v;
    },
  );

  const granted = offered.filter((m) => values[m.key] !== 'NONE').length;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
          Access permissions
        </p>
        <span className="text-[11px] text-gray-500">
          {granted} of {offered.length} modules granted
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {offered.map((m) => (
          <div key={m.key} className="px-3 py-2 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900 flex items-center gap-1.5">
                {m.label}
                {m.sensitive && (
                  <span title="Sensitive — grant deliberately">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  </span>
                )}
              </p>
              <p className="text-[11px] text-gray-500 truncate">{m.description}</p>
            </div>
            <div className="flex rounded-md border border-gray-200 overflow-hidden shrink-0">
              {LEVELS.map((l) => {
                const active = values[m.key] === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    title={l.hint}
                    onClick={() => setValues((v) => ({ ...v, [m.key]: l.value }))}
                    className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                      active
                        ? l.value === 'NONE'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-primary text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
            {values[m.key] !== 'NONE' && (
              <input type="hidden" name={`perm.${m.key}`} value={values[m.key]} />
            )}
          </div>
        ))}
      </div>
      <p className="px-3 py-2 text-[11px] text-gray-500 bg-gray-50 border-t border-gray-100">
        The assistant is offered the same areas as the main role. Modules set to{' '}
        <b>None</b> are hidden from this person entirely; sensitive modules start
        at None — grant them only when specifically authorised.
      </p>
    </div>
  );
}
