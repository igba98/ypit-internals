'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { quickAddLead } from '@/lib/actions/leadActions';
import { Officer } from './LeadsTable';

const SOURCES = [
  { value: 'WALK_IN', label: 'Walk in' },
  { value: 'SOCIAL_MEDIA', label: 'Social media' },
  { value: 'SCHOOL_VISIT', label: 'School visit' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'WEBSITE', label: 'Website' },
];

const EMPTY = { fullName: '', phone: '', interestedIn: '', assignedToId: '', source: 'WALK_IN' };

/** IT types the leads as they come in and picks the Relations Officer on the spot. */
export function QuickAddLead({ officers }: { officers: Officer[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [f, setF] = useState(EMPTY);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = () => {
    if (f.fullName.trim().length < 2) {
      toast.error("Type the student's name.");
      return;
    }
    if (f.phone.trim().length < 7) {
      toast.error('Type a phone number.');
      return;
    }
    startTransition(async () => {
      const res = await quickAddLead(f);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      // Keep the chosen officer and source - IT usually enters a batch at once.
      setF((v) => ({ ...EMPTY, assignedToId: v.assignedToId, source: v.source }));
      router.refresh();
    });
  };

  return (
    <section className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-1">
        <UserPlus className="w-4 h-4" /> Add a lead
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Type the name and number, choose the Relations Officer, press Add. Leave the officer empty to
        park it in the unassigned queue and distribute later.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="qa-name">Student name *</Label>
          <Input id="qa-name" value={f.fullName} onChange={set('fullName')} placeholder="Amina Juma" onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-phone">Phone *</Label>
          <Input id="qa-phone" value={f.phone} onChange={set('phone')} placeholder="+255 7.." onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-interest">Interested in</Label>
          <Input id="qa-interest" value={f.interestedIn} onChange={set('interestedIn')} placeholder="Nursing, India…" onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qa-officer">Relations Officer</Label>
          <Select id="qa-officer" value={f.assignedToId} onChange={set('assignedToId')}>
            <option value="">- Unassigned -</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>{o.fullName}{o.role === 'SUB_AGENT' ? ' (agent)' : ''}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Select value={f.source} onChange={set('source')} aria-label="Source" className="w-28">
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Button onClick={submit} disabled={busy} className="gap-1.5 shrink-0">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            Add
          </Button>
        </div>
      </div>
    </section>
  );
}
