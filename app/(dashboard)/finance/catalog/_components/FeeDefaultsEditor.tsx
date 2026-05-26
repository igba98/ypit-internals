'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FeeDefault, FeeType, Currency, FeeDueRule } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const FEE_TYPES: FeeType[] = ['APPLICATION', 'TUITION', 'HOSTEL', 'AGENCY', 'DEPOSIT', 'INSURANCE', 'VISA', 'AIRPORT_PICKUP', 'OTHER'];
const CURRENCIES: Currency[] = ['TZS', 'USD', 'GBP', 'EUR'];
const DUE_RULES: FeeDueRule['kind'][] = ['ON_ENROLLMENT', 'DAYS_FROM_ENROLLMENT', 'BEFORE_REPORTING_DATE', 'CUSTOM'];

interface Props {
  initial?: FeeDefault[];
  name: string;
}

export function FeeDefaultsEditor({ initial = [], name }: Props) {
  const [rows, setRows] = useState<FeeDefault[]>(initial);

  const update = (idx: number, patch: Partial<FeeDefault>) => {
    setRows(rs => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const remove = (idx: number) => setRows(rs => rs.filter((_, i) => i !== idx));
  const add = () =>
    setRows(rs => [
      ...rs,
      { type: 'TUITION', amount: 0, currency: 'GBP', dueRule: { kind: 'ON_ENROLLMENT' }, required: true },
    ]);

  return (
    <div className="space-y-3">
      <Label>Fee Defaults</Label>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.length === 0 && (
        <p className="text-xs text-gray-500">No fees yet. Click <strong>Add fee</strong> to add the first one.</p>
      )}
      {rows.map((r, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-start border border-gray-100 rounded-md p-3">
          <div className="col-span-3">
            <Select value={r.type} onChange={e => update(idx, { type: e.target.value as FeeType })}>
              {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="col-span-3">
            <Input
              type="number"
              min={1}
              value={r.amount || ''}
              onChange={e => update(idx, { amount: Number(e.target.value) })}
              placeholder="Amount"
            />
          </div>
          <div className="col-span-2">
            <Select value={r.currency} onChange={e => update(idx, { currency: e.target.value as Currency })}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="col-span-3">
            <Select
              value={r.dueRule.kind}
              onChange={e => {
                const kind = e.target.value as FeeDueRule['kind'];
                const rule: FeeDueRule =
                  kind === 'DAYS_FROM_ENROLLMENT' || kind === 'BEFORE_REPORTING_DATE'
                    ? { kind, days: 0 }
                    : { kind };
                update(idx, { dueRule: rule });
              }}
            >
              {DUE_RULES.map(k => <option key={k} value={k}>{k.replace(/_/g, ' ').toLowerCase()}</option>)}
            </Select>
            {(r.dueRule.kind === 'DAYS_FROM_ENROLLMENT' || r.dueRule.kind === 'BEFORE_REPORTING_DATE') && (
              <Input
                type="number"
                min={0}
                value={r.dueRule.days}
                onChange={e => update(idx, { dueRule: { ...r.dueRule, days: Number(e.target.value) } as FeeDueRule })}
                placeholder="days"
                className="mt-1"
              />
            )}
          </div>
          <div className="col-span-1 flex items-center pt-1.5">
            <label className="text-xs text-gray-600 flex items-center gap-1">
              <input
                type="checkbox"
                checked={r.required}
                onChange={e => update(idx, { required: e.target.checked })}
              />
              req
            </label>
          </div>
          <button
            type="button"
            onClick={() => remove(idx)}
            className="col-span-12 text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1 self-end ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" /> Add fee
      </button>
    </div>
  );
}
