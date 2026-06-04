'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Activity, AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { OperationsRecord, ActionResult, WellbeingStatus } from '@/types';
import {
  confirmEnrollment,
  deEscalateMonitoring,
  escalateMonitoring,
  recordWellnessCheckIn,
} from '@/lib/actions/monitoringActions';
import { formatDate } from '@/lib/utils';

interface Props {
  record: OperationsRecord;
}

const WELLBEING_COLORS: Record<WellbeingStatus, string> = {
  GOOD: 'bg-green-100 text-green-800',
  NEEDS_ATTENTION: 'bg-yellow-100 text-yellow-800',
  ESCALATED: 'bg-red-100 text-red-800',
};

export function CheckInPanel({ record }: Props) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  const onEscalate = () => {
    const reason = window.prompt(`Escalate ${record.studentName} — what's the reason?`);
    if (!reason || !reason.trim()) return;
    startTransition(async () => {
      const res = await escalateMonitoring(record.id, reason.trim(), record.studentId);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  };

  const onDeEscalate = () => {
    if (!window.confirm(`Clear escalation flag for ${record.studentName}?`)) return;
    startTransition(async () => {
      const res = await deEscalateMonitoring(record.id, record.studentId);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold font-urbanist text-gray-900">{record.studentName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {record.university} · {record.country}
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${WELLBEING_COLORS[record.wellbeingStatus]}`}
            >
              {record.wellbeingStatus === 'ESCALATED' && <AlertTriangle className="w-3 h-3" />}
              {record.wellbeingStatus.replace(/_/g, ' ')}
            </span>
            <span className="text-gray-500">
              {record.checkInCount} check-in{record.checkInCount === 1 ? '' : 's'}
            </span>
            {record.lastCheckIn && (
              <span className="text-gray-500">· Last on {formatDate(record.lastCheckIn)}</span>
            )}
            {record.enrollmentConfirmed ? (
              <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                Enrolled
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                Not yet enrolled
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {record.escalationFlag ? (
            <Button variant="outline" size="sm" onClick={onDeEscalate} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Clear escalation
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onEscalate} disabled={busy} className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              Escalate
            </Button>
          )}
        </div>
      </div>

      {record.escalationFlag && record.escalationReason && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Escalation reason
          </p>
          <p className="mt-0.5">{record.escalationReason}</p>
        </div>
      )}

      <CheckInForm record={record} />

      {!record.enrollmentConfirmed && <EnrollmentForm record={record} />}
    </div>
  );
}

function CheckInForm({ record }: { record: OperationsRecord }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> =>
      recordWellnessCheckIn(record.id, _prev, formData),
    null,
  );
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      setResetKey((k) => k + 1);
      router.refresh();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} key={resetKey} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
      <div className="space-y-2">
        <Label htmlFor="wellbeingStatus" className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Wellbeing
        </Label>
        <Select id="wellbeingStatus" name="wellbeingStatus" defaultValue="GOOD" required>
          <option value="GOOD">Good</option>
          <option value="NEEDS_ATTENTION">Needs attention</option>
          <option value="ESCALATED">Escalated</option>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notes *</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Brief summary of the check-in conversation."
          required
        />
      </div>
      <div className="md:col-span-3 flex items-center justify-end gap-2">
        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {isPending ? 'Recording...' : 'Record check-in'}
        </Button>
      </div>
    </form>
  );
}

function EnrollmentForm({ record }: { record: OperationsRecord }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> =>
      confirmEnrollment(record.id, _prev, formData),
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
      <div className="space-y-2">
        <Label htmlFor="enrollmentDate" className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Enrollment date *
        </Label>
        <Input id="enrollmentDate" name="enrollmentDate" type="date" required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="studentIdNumber">Student ID number</Label>
        <Input id="studentIdNumber" name="studentIdNumber" placeholder="e.g. HVD-2026-001" />
      </div>
      <div className="md:col-span-3 flex items-center justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Confirm enrollment'}
        </Button>
      </div>
    </form>
  );
}
