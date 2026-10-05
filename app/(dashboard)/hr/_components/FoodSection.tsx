'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2, UtensilsCrossed, Wallet } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FoodBudget, FoodScheduleEntry, MealSlot } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { deleteFoodEntry, saveFoodBudget, saveFoodEntry } from '@/lib/actions/hrActions';

const MEALS: { value: MealSlot; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
];

const MEAL_PILL: Record<MealSlot, string> = {
  BREAKFAST: 'bg-amber-50 text-amber-700',
  LUNCH: 'bg-emerald-50 text-emerald-700',
  DINNER: 'bg-indigo-50 text-indigo-700',
};

const dayName = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'long' });

/** Ratiba ya chakula - the month's menu, day by day. */
export function FoodScheduleSection({
  entries,
  canEdit,
}: {
  entries: FoodScheduleEntry[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FoodScheduleEntry | null>(null);

  const planned = entries.reduce((n, e) => n + (e.estimatedCost ?? 0), 0);

  const onDelete = (e: FoodScheduleEntry) => {
    if (!confirm(`Remove the menu for ${formatDate(e.date)}?`)) return;
    startTransition(async () => {
      const res = await deleteFoodEntry(e.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <UtensilsCrossed className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-semibold text-gray-900">Food Schedule</h2>
          <p className="text-[11px] text-gray-500">Ratiba ya chakula · this month</p>
        </div>
        <span className="text-xs text-gray-400 ml-3">
          {entries.length} day(s) · {formatCurrency(planned)} planned
        </span>
        {canEdit && (
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => setCreating(true)} disabled={busy}>
            <Plus className="w-4 h-4" /> Add menu
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Day</th>
              <th className="px-4 py-3 font-medium">Meal</th>
              <th className="px-4 py-3 font-medium">Menu</th>
              <th className="px-4 py-3 font-medium">Provided by</th>
              <th className="px-4 py-3 font-medium text-right">Pax</th>
              <th className="px-4 py-3 font-medium text-right">Est. cost</th>
              {canEdit && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{formatDate(e.date)}</p>
                  <p className="text-[11px] text-gray-500">{dayName(e.date)}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${MEAL_PILL[e.meal]}`}>
                    {MEALS.find((m) => m.value === e.meal)?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {e.menu}
                  {e.notes && <p className="text-[11px] text-gray-500">{e.notes}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700">{e.providedBy ?? <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 text-right text-gray-700">{e.headcount ?? <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {e.estimatedCost != null ? formatCurrency(e.estimatedCost) : <span className="text-gray-300">-</span>}
                </td>
                {canEdit && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(e)} className="text-gray-400 hover:text-primary p-1" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(e)} className="text-gray-400 hover:text-red-600 p-1" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="text-center py-12 text-gray-500">
                  No menu set for this month yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? `Edit menu · ${formatDate(editing.date)}` : 'Add a menu'}
        description="One menu per meal per day - saving the same slot again replaces it."
      >
        <FoodEntryForm
          existing={editing ?? undefined}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </SlideInPanel>
    </div>
  );
}

function FoodEntryForm({
  existing,
  onDone,
}: {
  existing?: FoodScheduleEntry;
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [date, setDate] = useState(existing?.date?.slice(0, 10) ?? '');
  const [meal, setMeal] = useState<MealSlot>(existing?.meal ?? 'LUNCH');
  const [menu, setMenu] = useState(existing?.menu ?? '');
  const [providedBy, setProvidedBy] = useState(existing?.providedBy ?? '');
  const [headcount, setHeadcount] = useState(existing?.headcount != null ? String(existing.headcount) : '');
  const [cost, setCost] = useState(existing?.estimatedCost != null ? String(existing.estimatedCost) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const submit = () => {
    if (!date) return toast.error('Pick the day.');
    if (menu.trim().length < 2) return toast.error('Type the menu.');

    startTransition(async () => {
      const payload = {
        date,
        meal,
        menu: menu.trim(),
        providedBy: providedBy.trim() || undefined,
        headcount: headcount !== '' ? Number(headcount) : undefined,
        estimatedCost: cost !== '' ? Number(cost) : undefined,
        notes: notes.trim() || undefined,
      };
      const res = await saveFoodEntry(existing?.id ?? null, payload);
      if (res.success) {
        toast.success(res.message);
        onDone();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fd-date">Day *</Label>
          <Input id="fd-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fd-meal">Meal</Label>
          <Select id="fd-meal" value={meal} onChange={(e) => setMeal(e.target.value as MealSlot)}>
            {MEALS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fd-menu">Menu *</Label>
        <Input id="fd-menu" value={menu} onChange={(e) => setMenu(e.target.value)} placeholder="e.g. Wali, maharage na nyama" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fd-by">Provided by</Label>
          <Input id="fd-by" value={providedBy} onChange={(e) => setProvidedBy(e.target.value)} placeholder="Cook / supplier" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fd-pax">Headcount</Label>
          <Input id="fd-pax" type="number" min="0" value={headcount} onChange={(e) => setHeadcount(e.target.value)} placeholder="18" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fd-cost">Est. cost (TSh)</Label>
          <Input id="fd-cost" type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="90000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fd-notes">Notes</Label>
        <Textarea id="fd-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, guests expected, changes…" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UtensilsCrossed className="w-4 h-4" />}
          {existing ? 'Save changes' : 'Save menu'}
        </Button>
      </div>
    </div>
  );
}

/** Bajeti ya chakula ya mwezi - budget against actual spend. */
export function FoodBudgetSection({
  budgets,
  canEdit,
}: {
  budgets: FoodBudget[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FoodBudget | null>(null);
  const current = budgets[0];

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-semibold text-gray-900">Monthly Food Budget</h2>
          <p className="text-[11px] text-gray-500">Bajeti ya chakula ya mwezi</p>
        </div>
        {canEdit && (
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4" /> Set a month
          </Button>
        )}
      </div>

      {current && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b border-gray-100 bg-gray-50/50">
          <Stat label="Month" value={new Date(current.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
          <Stat label="Budget" value={formatCurrency(current.budgetAmount)} />
          <Stat label="Spent" value={formatCurrency(current.actualSpent)} accent="text-amber-700" />
          <Stat
            label="Remaining"
            value={formatCurrency(current.budgetAmount - current.actualSpent)}
            accent={current.actualSpent > current.budgetAmount ? 'text-red-600' : 'text-green-700'}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium text-right">Budget</th>
              <th className="px-4 py-3 font-medium text-right">Spent</th>
              <th className="px-4 py-3 font-medium text-right">Variance</th>
              <th className="px-4 py-3 font-medium text-right">Pax</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              {canEdit && <th className="px-4 py-3 font-medium text-right">Edit</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {budgets.map((b) => {
              const variance = b.budgetAmount - b.actualSpent;
              return (
                <tr key={b.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {new Date(b.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(b.budgetAmount)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(b.actualSpent)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${variance < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {formatCurrency(variance)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{b.headcount ?? <span className="text-gray-300">-</span>}</td>
                  <td className="px-4 py-3 text-[11px] text-gray-500">{b.notes}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(b); setOpen(true); }} className="text-gray-400 hover:text-primary p-1" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {budgets.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="text-center py-12 text-gray-500">
                  No food budget set yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Update the month' : 'Set a monthly food budget'}
        description="One row per month - saving the same month again updates it."
      >
        <FoodBudgetForm existing={editing ?? undefined} onDone={() => setOpen(false)} />
      </SlideInPanel>
    </div>
  );
}

function FoodBudgetForm({ existing, onDone }: { existing?: FoodBudget; onDone: () => void }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [month, setMonth] = useState(existing?.month?.slice(0, 7) ?? new Date().toISOString().slice(0, 7));
  const [budget, setBudget] = useState(existing ? String(existing.budgetAmount) : '');
  const [spent, setSpent] = useState(existing ? String(existing.actualSpent) : '0');
  const [headcount, setHeadcount] = useState(existing?.headcount != null ? String(existing.headcount) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const submit = () => {
    if (!month) return toast.error('Pick the month.');
    if (budget === '' || Number(budget) < 0) return toast.error('Enter the budget amount.');

    startTransition(async () => {
      const res = await saveFoodBudget({
        month,
        budgetAmount: Number(budget),
        actualSpent: spent !== '' ? Number(spent) : 0,
        headcount: headcount !== '' ? Number(headcount) : undefined,
        notes: notes.trim() || undefined,
      });
      if (res.success) {
        toast.success(res.message);
        onDone();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fb-month">Month *</Label>
          <Input id="fb-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fb-pax">Headcount</Label>
          <Input id="fb-pax" type="number" min="0" value={headcount} onChange={(e) => setHeadcount(e.target.value)} placeholder="18" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fb-budget">Budget (TSh) *</Label>
          <Input id="fb-budget" type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="2400000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fb-spent">Spent so far (TSh)</Label>
          <Input id="fb-spent" type="number" min="0" value={spent} onChange={(e) => setSpent(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fb-notes">Notes</Label>
        <Textarea id="fb-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What the budget assumes…" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
          Save budget
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'text-gray-900' }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${accent}`}>{value}</p>
    </div>
  );
}
