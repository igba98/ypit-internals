'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BadgeCheck, Loader2, ShieldAlert, ShieldCheck, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TravelFinanceStatus } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import {
  revokeTravelVerification,
  verifyTravelPayments,
} from '@/lib/actions/travelActions';

/**
 * Finance payment verification (IT change request, Oct 2026 §1.2). The ticket
 * is only issued once Finance confirms every required payment is in, so the
 * step is shown to everyone and actioned by Finance.
 */
export function FinanceClearanceCard({
  travelId,
  studentName,
  status,
  isFinance,
}: {
  travelId: string;
  studentName: string;
  status: TravelFinanceStatus;
  isFinance: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [note, setNote] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [reason, setReason] = useState('');

  const verify = () => {
    startTransition(async () => {
      const res = await verifyTravelPayments(travelId, note);
      if (res.success) {
        toast.success(res.message);
        setNote('');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const revoke = () => {
    if (reason.trim().length < 4) {
      toast.error('Say why clearance is being withdrawn.');
      return;
    }
    startTransition(async () => {
      const res = await revokeTravelVerification(travelId, reason);
      if (res.success) {
        toast.success(res.message);
        setRevoking(false);
        setReason('');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const owes = status.outstanding ?? 0;

  return (
    <section
      className={`rounded-xl border p-5 ${
        status.verified ? 'bg-green-50/60 border-green-200' : 'bg-amber-50/60 border-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {status.verified ? (
          <ShieldCheck className="w-6 h-6 text-green-700 shrink-0" />
        ) : (
          <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900">Finance payment verification</h2>

          {status.verified ? (
            <p className="text-sm text-green-900 mt-0.5">
              Cleared for travel by {status.verifiedByName ?? 'Finance'}
              {status.verifiedAt ? ` on ${formatDate(status.verifiedAt)}` : ''}.
              {status.note ? ` ${status.note}` : ''}
            </p>
          ) : (
            <p className="text-sm text-amber-900 mt-0.5">
              {status.outstanding === null
                ? `${studentName} has no payment record yet, so Finance cannot verify.`
                : owes > 0
                  ? `${studentName} still owes ${formatCurrency(owes)}. The ticket cannot be issued until Finance verifies.`
                  : `Nothing outstanding - waiting for Finance to confirm and clear ${studentName} for travel.`}
            </p>
          )}

          <p className="text-[11px] text-gray-500 mt-1.5">
            Admission → Travel planning → <b>Finance verification</b> → Travel approval → ticket issued
          </p>

          {isFinance && !status.verified && (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-[220px]">
                <Label htmlFor="fv-note">Note (optional)</Label>
                <Input
                  id="fv-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. final instalment received, receipt RCP-0188"
                />
              </div>
              <Button onClick={verify} disabled={busy || owes > 0 || status.outstanding === null} className="gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                Verify payments
              </Button>
            </div>
          )}

          {isFinance && status.verified && !revoking && (
            <Button variant="ghost" onClick={() => setRevoking(true)} className="mt-3 gap-1.5 text-red-700">
              <Undo2 className="w-3.5 h-3.5" /> Withdraw clearance
            </Button>
          )}

          {isFinance && status.verified && revoking && (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-[220px]">
                <Label htmlFor="fv-reason">Why is clearance being withdrawn? *</Label>
                <Input
                  id="fv-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. the bank reversed the last transfer"
                />
              </div>
              <Button variant="ghost" onClick={() => setRevoking(false)}>Cancel</Button>
              <Button onClick={revoke} disabled={busy} className="gap-2 bg-red-600 hover:bg-red-700">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                Withdraw
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
