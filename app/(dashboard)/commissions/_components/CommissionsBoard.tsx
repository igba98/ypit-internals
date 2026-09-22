'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { HandCoins, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { CommissionLedger, CommissionStatus, Student, University, UniversityCommission } from '@/types';
import { formatDate } from '@/lib/utils';
import { deleteCommission, saveCommission, setCommissionStatus } from '@/lib/actions/commissionActions';

const STATUS: { value: CommissionStatus; label: string; cls: string }[] = [
  { value: 'EXPECTED', label: 'Expected', cls: 'bg-amber-100 text-amber-800' },
  { value: 'INVOICED', label: 'Invoiced', cls: 'bg-blue-100 text-blue-800' },
  { value: 'RECEIVED', label: 'Received', cls: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
];
const CURRENCIES = ['USD', 'GBP', 'EUR', 'TZS'];

function money(n: number, c: string): string {
  return `${c} ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
/** Module-level so render stays pure (react-hooks/purity). */
function isOverdue(c: UniversityCommission): boolean {
  return (c.status === 'EXPECTED' || c.status === 'INVOICED') && !!c.dueDate && new Date(c.dueDate).getTime() < Date.now();
}

type StudentOpt = Pick<Student, 'id' | 'fullName' | 'registrationNumber' | 'targetUniversity'>;

export function CommissionsBoard({
  ledger,
  universities,
  students,
  canEdit,
}: {
  ledger: CommissionLedger;
  universities: University[];
  students: StudentOpt[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [uniFilter, setUniFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | CommissionStatus>('');
  const [editing, setEditing] = useState<UniversityCommission | 'new' | null>(null);

  const rows = useMemo(
    () => ledger.items.filter((c) => (!uniFilter || c.universityId === uniFilter) && (!statusFilter || c.status === statusFilter)),
    [ledger.items, uniFilter, statusFilter],
  );
  const currencies = Object.keys(ledger.totals);

  const act = (fn: () => Promise<{ success: boolean; message: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.success) {
        toast.success(r.message);
        router.refresh();
      } else toast.error(r.message);
    });

  return (
    <div className="space-y-6">
      {/* Totals per currency - never summed across currencies. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['expected', 'invoiced', 'received'] as const).map((k) => (
          <div key={k} className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{k === 'expected' ? 'Expected (not yet invoiced)' : k === 'invoiced' ? 'Invoiced, awaiting payment' : 'Received'}</p>
            {currencies.length === 0 ? (
              <p className="text-2xl font-bold text-gray-300 mt-1">-</p>
            ) : (
              currencies.map((c) => (
                <p key={c} className={`text-xl font-bold mt-1 tabular-nums ${k === 'received' ? 'text-green-700' : 'text-gray-900'}`}>{money(ledger.totals[c][k], c)}</p>
              ))
            )}
          </div>
        ))}
      </div>

      {ledger.byUniversity.length > 0 && (
        <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">By university</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-2 text-left font-medium">University</th>
                  <th className="px-5 py-2 text-right font-medium">Records</th>
                  <th className="px-5 py-2 text-right font-medium">Outstanding</th>
                  <th className="px-5 py-2 text-right font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger.byUniversity.map((u) => (
                  <tr key={u.universityId} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setUniFilter(u.universityId)}>
                    <td className="px-5 py-2.5"><p className="font-medium text-gray-900">{u.name}</p><p className="text-[11px] text-gray-500">{u.country}</p></td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{u.count}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{Object.entries(u.byCurrency).map(([c, b]) => <div key={c}>{money(b.expected + b.invoiced, c)}</div>)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-green-700">{Object.entries(u.byCurrency).map(([c, b]) => <div key={c}>{money(b.received, c)}</div>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <Select value={uniFilter} onChange={(e) => setUniFilter(e.target.value)} className="w-64">
            <option value="">All universities</option>
            {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | CommissionStatus)} className="w-40">
            <option value="">All statuses</option>
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <span className="text-xs text-gray-500">{rows.length} record{rows.length === 1 ? '' : 's'}</span>
          <div className="flex-1" />
          {canEdit && (
            <Button size="sm" onClick={() => setEditing('new')} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Record commission</Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">University</th>
                <th className="px-4 py-3 font-medium">Student / intake</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((c) => {
                const st = STATUS.find((s) => s.value === c.status)!;
                return (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3"><p className="font-medium text-gray-900">{c.university.name}</p><p className="text-[11px] text-gray-500">{c.university.country}</p></td>
                    <td className="px-4 py-3 text-xs text-gray-700">{c.studentName ?? <span className="text-gray-400">Lump sum</span>}{c.intake && <p className="text-[11px] text-gray-500">{c.intake}</p>}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(c.amount, c.currency)}</td>
                    <td className={`px-4 py-3 text-xs whitespace-nowrap ${isOverdue(c) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {c.dueDate ? formatDate(c.dueDate) : '-'}{isOverdue(c) && <p className="text-[10px] uppercase">Overdue</p>}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <Select value={c.status} disabled={busy} onChange={(e) => act(() => setCommissionStatus(c.id, e.target.value))} className={`h-8 text-xs font-medium ${st.cls}`}>
                          {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </Select>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                      )}
                      {c.receivedAt && <p className="text-[10px] text-gray-500 mt-0.5">received {formatDate(c.receivedAt)}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.reference ?? '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditing(c)} className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-gray-100" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => confirm('Delete this commission record?') && act(() => deleteCommission(c.id))} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500"><HandCoins className="w-6 h-6 mx-auto mb-2 text-gray-300" />No commissions recorded{uniFilter || statusFilter ? ' for this filter' : ' yet'}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SlideInPanel
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Record commission' : 'Edit commission'}
        description="Link it to the student it was earned on, or leave the student empty for a lump sum."
      >
        {editing && (
          <CommissionForm
            existing={editing === 'new' ? null : editing}
            universities={universities}
            students={students}
            defaultUniversity={uniFilter}
            onDone={() => setEditing(null)}
          />
        )}
      </SlideInPanel>
    </div>
  );
}

function CommissionForm({
  existing,
  universities,
  students,
  defaultUniversity,
  onDone,
}: {
  existing: UniversityCommission | null;
  universities: University[];
  students: StudentOpt[];
  defaultUniversity: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [f, setF] = useState({
    universityId: existing?.universityId ?? defaultUniversity,
    studentId: existing?.studentId ?? '',
    intake: existing?.intake ?? '',
    amount: existing ? String(existing.amount) : '',
    currency: existing?.currency ?? 'USD',
    status: existing?.status ?? 'EXPECTED',
    dueDate: existing?.dueDate?.slice(0, 10) ?? '',
    reference: existing?.reference ?? '',
    notes: existing?.notes ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = () => {
    const amount = Number(f.amount);
    if (!f.universityId) {
      toast.error('Pick the university.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter the commission amount.');
      return;
    }
    startTransition(async () => {
      const r = await saveCommission(existing?.id ?? null, {
        universityId: f.universityId,
        studentId: f.studentId || (existing ? null : undefined),
        intake: f.intake || undefined,
        amount,
        currency: f.currency,
        status: f.status,
        dueDate: f.dueDate || (existing ? null : undefined),
        reference: f.reference || undefined,
        notes: f.notes || undefined,
      });
      if (!r.success) {
        toast.error(r.message);
        return;
      }
      toast.success(r.message);
      onDone();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cm-uni">University *</Label>
        <Select id="cm-uni" value={f.universityId} onChange={set('universityId')}>
          <option value="">Select…</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.country})</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cm-st">Student (leave empty for a lump sum)</Label>
        <Select id="cm-st" value={f.studentId} onChange={set('studentId')}>
          <option value="">- Lump sum -</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.fullName} · {s.registrationNumber}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2 col-span-2"><Label htmlFor="cm-amt">Amount *</Label><Input id="cm-amt" type="number" min={0} value={f.amount} onChange={set('amount')} /></div>
        <div className="space-y-2">
          <Label htmlFor="cm-cur">Currency</Label>
          <Select id="cm-cur" value={f.currency} onChange={set('currency')}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cm-status">Status</Label>
          <Select id="cm-status" value={f.status} onChange={set('status')}>{STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
        </div>
        <div className="space-y-2"><Label htmlFor="cm-due">Due date</Label><Input id="cm-due" type="date" value={f.dueDate} onChange={set('dueDate')} /></div>
        <div className="space-y-2"><Label htmlFor="cm-intake">Intake</Label><Input id="cm-intake" value={f.intake} onChange={set('intake')} placeholder="September 2026" /></div>
        <div className="space-y-2"><Label htmlFor="cm-ref">Invoice / reference</Label><Input id="cm-ref" value={f.reference} onChange={set('reference')} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="cm-notes">Notes</Label><Textarea id="cm-notes" rows={2} value={f.notes} onChange={set('notes')} placeholder="Rate, terms, who confirmed it…" /></div>
      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandCoins className="w-4 h-4" />}{existing ? 'Save changes' : 'Record commission'}</Button>
      </div>
    </div>
  );
}
