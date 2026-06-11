'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ActionResult,
  EquipmentAssignment,
  EquipmentCondition,
  EquipmentStatus,
} from '@/types';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/shared/Avatar';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2, PackageCheck, PackageX } from 'lucide-react';
import { markEquipmentLost, returnEquipment } from '@/lib/actions/equipmentActions';

const STATUS_BADGE: Record<EquipmentStatus, string> = {
  ASSIGNED: 'bg-blue-50 text-blue-700',
  RETURNED: 'bg-green-50 text-green-700',
  LOST: 'bg-red-50 text-red-700',
};

const CONDITION_BADGE: Record<EquipmentCondition, string> = {
  NEW: 'bg-green-50 text-green-700',
  GOOD: 'bg-emerald-50 text-emerald-700',
  FAIR: 'bg-amber-50 text-amber-700',
  DAMAGED: 'bg-red-50 text-red-700',
};

export function EquipmentTable({ items }: { items: EquipmentAssignment[] }) {
  const [returningItem, setReturningItem] = useState<EquipmentAssignment | null>(null);
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  const onMarkLost = (item: EquipmentAssignment) => {
    const notes = window.prompt(`Mark "${item.name}" (${item.assetNumber}) as LOST - how was it lost?`);
    if (!notes || !notes.trim()) return;
    startTransition(async () => {
      const res = await markEquipmentLost(item.id, notes.trim());
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Asset Register</h3>
        <span className="text-xs text-gray-500">{items.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Holder</th>
              <th className="px-4 py-3 font-medium">Issued</th>
              <th className="px-4 py-3 font-medium">Condition Out → In</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-gray-900">{e.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {e.assetNumber}{e.serialNumber ? ` · S/N ${e.serialNumber}` : ''} · {e.category.toLowerCase()}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={e.staffName} size="sm" />
                    <span className="text-gray-900">{e.staffName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-xs text-gray-700">{formatDate(e.issuedAt)}</p>
                  <p className="text-[11px] text-gray-500">by {e.issuedByName}</p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${CONDITION_BADGE[e.conditionOut]}`}>
                      {e.conditionOut}
                    </span>
                    {e.conditionIn && (
                      <>
                        <span className="text-gray-400 text-xs">→</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${CONDITION_BADGE[e.conditionIn]}`}>
                          {e.conditionIn}
                        </span>
                      </>
                    )}
                  </div>
                  {e.faultNotes && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      {e.faultNotes}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[e.status]}`}>
                    {e.status}
                  </span>
                  {e.returnedAt && e.status !== 'ASSIGNED' && (
                    <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(e.returnedAt)}</p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {e.status === 'ASSIGNED' && (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => setReturningItem(e)} className="gap-1">
                        <PackageCheck className="w-3.5 h-3.5" /> Return
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkLost(e)}
                        disabled={busy}
                        className="gap-1 text-red-600 hover:bg-red-50"
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageX className="w-3.5 h-3.5" />}
                        Lost
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  No equipment recorded yet. Click <strong>Issue Equipment</strong> to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={!!returningItem}
        onClose={() => setReturningItem(null)}
        title={returningItem ? `Return · ${returningItem.name}` : 'Return Equipment'}
        description={returningItem ? `${returningItem.assetNumber} · held by ${returningItem.staffName}` : ''}
      >
        {returningItem && (
          <ReturnForm item={returningItem} onSuccess={() => setReturningItem(null)} />
        )}
      </SlideInPanel>
    </section>
  );
}

function ReturnForm({
  item,
  onSuccess,
}: {
  item: EquipmentAssignment;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [condition, setCondition] = useState<EquipmentCondition>('GOOD');
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> =>
      returnEquipment(item.id, _prev, formData),
    null,
  );
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="conditionIn">Condition on Return *</Label>
          <Select
            id="conditionIn"
            name="conditionIn"
            required
            value={condition}
            onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
          >
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="DAMAGED">Damaged</option>
          </Select>
          {errors.conditionIn && <p className="text-xs text-red-600">{errors.conditionIn[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="returnedAt">Return Date</Label>
          <Input
            id="returnedAt"
            name="returnedAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="faultNotes">
          Fault Description {condition === 'DAMAGED' ? '*' : '(optional)'}
        </Label>
        <Textarea
          id="faultNotes"
          name="faultNotes"
          rows={3}
          required={condition === 'DAMAGED'}
          placeholder={condition === 'DAMAGED' ? 'Describe the fault - what is broken, missing, or worn?' : 'Any remarks about the item'}
        />
        {errors.faultNotes && <p className="text-xs text-red-600">{errors.faultNotes[0]}</p>}
      </div>

      {condition === 'DAMAGED' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>The fault will be recorded permanently against this asset and shown on the register.</p>
        </div>
      )}

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Recording...' : 'Record Return'}
        </Button>
      </div>
    </form>
  );
}
