'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Boxes, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AssetCategory, AssetStatus, CompanyAsset } from '@/types';
import { formatDate } from '@/lib/utils';
import { deleteAsset, saveAsset } from '@/lib/actions/adminRecordActions';

const CATEGORY: Record<AssetCategory, string> = {
  FURNITURE: 'Furniture',
  ELECTRONICS: 'Electronics',
  OFFICE_EQUIPMENT: 'Office equipment',
  VEHICLE: 'Vehicle',
  PROPERTY: 'Property',
  OTHER: 'Other',
};
const STATUS: Record<AssetStatus, { label: string; cls: string }> = {
  IN_USE: { label: 'In use', cls: 'bg-green-100 text-green-800' },
  IN_STORAGE: { label: 'In storage', cls: 'bg-gray-100 text-gray-700' },
  UNDER_REPAIR: { label: 'Under repair', cls: 'bg-amber-100 text-amber-800' },
  DISPOSED: { label: 'Disposed', cls: 'bg-red-100 text-red-700' },
};

export function AssetsTable({ assets, canEdit }: { assets: CompanyAsset[]; canEdit: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'' | AssetCategory>('');
  const [editing, setEditing] = useState<CompanyAsset | 'new' | null>(null);

  const term = q.trim().toLowerCase();
  const rows = assets.filter(
    (a) =>
      (!cat || a.category === cat) &&
      (!term || [a.assetTag, a.name, a.serialNumber, a.location, a.custodian].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))),
  );

  const remove = (a: CompanyAsset) => {
    if (!confirm(`Remove ${a.assetTag} (${a.name}) from the register?`)) return;
    startTransition(async () => {
      const r = await deleteAsset(a.id);
      if (r.success) {
        toast.success(r.message);
        router.refresh();
      } else toast.error(r.message);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tag, name, serial, location, custodian…" className="pl-9" />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value as '' | AssetCategory)} className="w-48">
          <option value="">All categories</option>
          {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        {canEdit && <Button size="sm" onClick={() => setEditing('new')} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Register asset</Button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Location / custodian</th>
              <th className="px-4 py-3 font-medium">Purchased</th>
              <th className="px-4 py-3 font-medium text-right">Cost (TSh)</th>
              <th className="px-4 py-3 font-medium">Condition</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3"><p className="font-medium text-gray-900">{a.name}</p><p className="text-[11px] text-gray-500 font-mono">{a.assetTag}{a.serialNumber ? ` · SN ${a.serialNumber}` : ''}</p></td>
                <td className="px-4 py-3 text-xs text-gray-700">{CATEGORY[a.category]}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{a.location ?? '-'}{a.custodian && <p className="text-[11px] text-gray-500">{a.custodian}</p>}</td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{a.purchaseDate ? formatDate(a.purchaseDate) : '-'}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{a.purchaseCost != null ? a.purchaseCost.toLocaleString('en-US') : '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{a.condition.charAt(0) + a.condition.slice(1).toLowerCase()}</td>
                <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span></td>
                <td className="px-4 py-3 text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(a)} className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-gray-100" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(a)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50" title="Remove"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500"><Boxes className="w-6 h-6 mx-auto mb-2 text-gray-300" />{assets.length === 0 ? 'No assets registered yet.' : 'Nothing matches that filter.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <SlideInPanel isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Register asset' : 'Edit asset'} description="An asset tag (AS-YYYY-NNNN) is assigned automatically.">
        {editing && <AssetForm existing={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </SlideInPanel>
    </div>
  );
}

function AssetForm({ existing, onDone }: { existing: CompanyAsset | null; onDone: () => void }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [f, setF] = useState({
    name: existing?.name ?? '',
    category: existing?.category ?? 'OTHER',
    serialNumber: existing?.serialNumber ?? '',
    location: existing?.location ?? '',
    custodian: existing?.custodian ?? '',
    purchaseDate: existing?.purchaseDate?.slice(0, 10) ?? '',
    purchaseCost: existing?.purchaseCost != null ? String(existing.purchaseCost) : '',
    condition: existing?.condition ?? 'GOOD',
    status: existing?.status ?? 'IN_USE',
    notes: existing?.notes ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((v) => ({ ...v, [k]: e.target.value }));
  const submit = () => {
    if (f.name.trim().length < 2) {
      toast.error('Name the asset.');
      return;
    }
    startTransition(async () => {
      const payload: Record<string, unknown> = { name: f.name.trim(), category: f.category, condition: f.condition, status: f.status };
      for (const k of ['serialNumber', 'location', 'custodian', 'purchaseDate', 'notes'] as const) if (f[k].trim()) payload[k] = f[k].trim();
      if (f.purchaseCost.trim()) payload.purchaseCost = Number(f.purchaseCost);
      const r = await saveAsset(existing?.id ?? null, payload);
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
      <div className="space-y-2"><Label htmlFor="as-name">Name *</Label><Input id="as-name" value={f.name} onChange={set('name')} placeholder="e.g. Toyota Noah T123 ABC, Boardroom table" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="as-cat">Category</Label><Select id="as-cat" value={f.category} onChange={set('category')}>{Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></div>
        <div className="space-y-2"><Label htmlFor="as-sn">Serial / reg. number</Label><Input id="as-sn" value={f.serialNumber} onChange={set('serialNumber')} /></div>
        <div className="space-y-2"><Label htmlFor="as-loc">Location</Label><Input id="as-loc" value={f.location} onChange={set('location')} placeholder="NIC House, 4th floor" /></div>
        <div className="space-y-2"><Label htmlFor="as-cust">Custodian</Label><Input id="as-cust" value={f.custodian} onChange={set('custodian')} placeholder="Person or department" /></div>
        <div className="space-y-2"><Label htmlFor="as-date">Purchase date</Label><Input id="as-date" type="date" value={f.purchaseDate} onChange={set('purchaseDate')} /></div>
        <div className="space-y-2"><Label htmlFor="as-cost">Cost (TSh)</Label><Input id="as-cost" type="number" min={0} value={f.purchaseCost} onChange={set('purchaseCost')} /></div>
        <div className="space-y-2"><Label htmlFor="as-cond">Condition</Label><Select id="as-cond" value={f.condition} onChange={set('condition')}><option value="NEW">New</option><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="DAMAGED">Damaged</option></Select></div>
        <div className="space-y-2"><Label htmlFor="as-status">Status</Label><Select id="as-status" value={f.status} onChange={set('status')}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="as-notes">Notes</Label><Textarea id="as-notes" rows={2} value={f.notes} onChange={set('notes')} /></div>
      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Boxes className="w-4 h-4" />}{existing ? 'Save changes' : 'Register asset'}</Button>
      </div>
    </div>
  );
}
