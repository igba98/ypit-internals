'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Send, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PartnerFollowUp, PartnerKind } from '@/types';
import { formatDate } from '@/lib/utils';
import { addPartnerFollowUp } from '@/lib/actions/partnerActions';

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function FollowUpCard({
  kind,
  partnerId,
  followUps,
  canEdit,
}: {
  kind: PartnerKind;
  partnerId: string;
  followUps: PartnerFollowUp[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [notes, setNotes] = useState('');
  const [nextActionAt, setNextActionAt] = useState('');

  const submit = () => {
    if (notes.trim().length < 2) {
      toast.error('Write what happened.');
      return;
    }
    startTransition(async () => {
      const res = await addPartnerFollowUp(kind, partnerId, {
        notes: notes.trim(),
        nextActionAt: nextActionAt || undefined,
      });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setNotes('');
      setNextActionAt('');
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> Follow-up activity
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Calls, visits, meetings - and what needs to happen next.</p>
      </div>

      {canEdit && (
        <div className="p-5 border-b border-gray-100 space-y-3 bg-gray-50/50">
          <div className="space-y-1.5">
            <Label htmlFor="fu-notes">What happened?</Label>
            <Textarea id="fu-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Met the headmaster, agreed to host a career talk in October." />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fu-next">Next action due</Label>
              <Input id="fu-next" type="date" value={nextActionAt} onChange={(e) => setNextActionAt(e.target.value)} />
            </div>
            <Button size="sm" onClick={submit} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Log follow-up
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
        {followUps.map((f) => (
          <div key={f.id} className="px-5 py-3.5">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{f.notes}</p>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>{f.createdByName} · {formatDate(f.createdAt)}</span>
              {f.nextActionAt && (
                <span className={`inline-flex items-center gap-1 ${isPast(f.nextActionAt) ? 'text-red-600 font-medium' : 'text-amber-700'}`}>
                  <CalendarClock className="w-3 h-3" /> next: {formatDate(f.nextActionAt)}
                </span>
              )}
            </p>
          </div>
        ))}
        {followUps.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No follow-ups logged yet.</p>
        )}
      </div>
    </div>
  );
}
