'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Partner, PartnerKind, PartnerStatus } from '@/types';
import { createPartner, updatePartner } from '@/lib/actions/partnerActions';
import { PARTNER_KIND, PARTNER_STATUS } from './partner-config';

export function AddPartnerButton({ kind }: { kind: PartnerKind }) {
  const [open, setOpen] = useState(false);
  const cfg = PARTNER_KIND[kind];
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> Add {cfg.singular}
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Add ${cfg.singular}`}
        description={`Register a ${cfg.singular.toLowerCase()} profile. Contracts and follow-ups are added from its page.`}
      >
        <PartnerForm kind={kind} onDone={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

export function PartnerForm({
  kind,
  existing,
  onDone,
}: {
  kind: PartnerKind;
  existing?: Partner;
  onDone: () => void;
}) {
  const router = useRouter();
  const cfg = PARTNER_KIND[kind];
  const [busy, startTransition] = useTransition();
  const [f, setF] = useState({
    name: existing?.name ?? '',
    category: existing?.category ?? '',
    country: existing?.country ?? (kind === 'SCHOOL' ? 'Tanzania' : ''),
    city: existing?.city ?? '',
    address: existing?.address ?? '',
    website: existing?.website ?? '',
    contactName: existing?.contactName ?? '',
    contactRole: existing?.contactRole ?? '',
    contactPhone: existing?.contactPhone ?? '',
    contactEmail: existing?.contactEmail ?? '',
    status: (existing?.status ?? 'PROSPECT') as PartnerStatus,
    startDate: existing?.startDate?.slice(0, 10) ?? '',
    expiryDate: existing?.expiryDate?.slice(0, 10) ?? '',
    notes: existing?.notes ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = () => {
    if (f.name.trim().length < 2) {
      toast.error(`Give the ${cfg.singular.toLowerCase()} a name.`);
      return;
    }
    startTransition(async () => {
      const payload = {
        ...f,
        name: f.name.trim(),
        contactEmail: f.contactEmail.trim() || undefined,
        startDate: f.startDate || undefined,
        expiryDate: f.expiryDate || undefined,
      };
      const res = existing
        ? await updatePartner(kind, existing.id, payload)
        : await createPartner(kind, payload);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      onDone();
      if (!existing && 'id' in res && res.id) router.push(`${cfg.base}/${res.id}`);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{cfg.singular} name *</Label>
        <Input id="name" value={f.name} onChange={set('name')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="category">{cfg.categoryLabel}</Label>
          <Input id="category" value={f.category} onChange={set('category')} placeholder={cfg.categoryHint} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Partnership status</Label>
          <Select id="status" value={f.status} onChange={set('status')}>
            {PARTNER_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={f.country} onChange={set('country')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City / region</Label>
          <Input id="city" value={f.city} onChange={set('city')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={f.address} onChange={set('address')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" value={f.website} onChange={set('website')} placeholder="https://" />
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-2">Contact person</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="contactName">Name</Label>
          <Input id="contactName" value={f.contactName} onChange={set('contactName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactRole">Role / title</Label>
          <Input id="contactRole" value={f.contactRole} onChange={set('contactRole')} placeholder="e.g. Headmaster, HR Manager" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Phone</Label>
          <Input id="contactPhone" value={f.contactPhone} onChange={set('contactPhone')} placeholder="+255 ..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" type="email" value={f.contactEmail} onChange={set('contactEmail')} />
        </div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-2">Partnership period</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start</Label>
          <Input id="startDate" type="date" value={f.startDate} onChange={set('startDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry / review</Label>
          <Input id="expiryDate" type="date" value={f.expiryDate} onChange={set('expiryDate')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} value={f.notes} onChange={set('notes')} placeholder="Key terms, history, who introduced us…" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {existing ? 'Save changes' : `Create ${cfg.singular.toLowerCase()}`}
        </Button>
      </div>
    </div>
  );
}
