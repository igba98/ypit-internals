'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eraser, Loader2, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PaymentRecord } from '@/types';
import {
  correctPayments,
  getPaymentRecord,
  PaymentCorrectionLine,
  PaymentLineInput,
  recordPayments,
} from '@/lib/actions/paymentActions';

export interface StudentOption {
  id: string;
  fullName: string;
  registrationNumber: string;
  pipelineStage: string;
}

type Bucket = 'APPLICATION' | 'TUITION' | 'AGENCY' | 'HOSTEL';

const BUCKETS: { key: Bucket; label: string; feeField: keyof PaymentRecord; paidField: keyof PaymentRecord }[] = [
  { key: 'APPLICATION', label: 'Application fee', feeField: 'applicationFee', paidField: 'applicationFeePaid' },
  { key: 'TUITION', label: 'Tuition fee', feeField: 'tuitionFee', paidField: 'tuitionFeePaid' },
  { key: 'AGENCY', label: 'Agency fee', feeField: 'agencyFee', paidField: 'agencyFeePaid' },
  { key: 'HOSTEL', label: 'Hostel fee', feeField: 'hostelFee', paidField: 'hostelFeePaid' },
];

const METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
];

const money = (n: number) => `TSh ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const num = (v: string) => {
  const n = Number(v.replace(/[,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
/** Same, but 0 is a real value when correcting (it clears the entry). */
const numOrZero = (v: string) => {
  const n = Number(v.replace(/[,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
/** Module-level so render stays pure. */
const todayISO = () => new Date().toISOString().slice(0, 10);

/** `pay` is money coming in now; `paid` is the corrected total in fix mode. */
type Row = { fee: string; pay: string; paid: string };
const blank: Row = { fee: '', pay: '', paid: '' };
const emptyRows = (): Record<Bucket, Row> => ({
  APPLICATION: { ...blank },
  TUITION: { ...blank },
  AGENCY: { ...blank },
  HOSTEL: { ...blank },
});

/**
 * Finance records everything a student paid in one sheet: each fee type's fee
 * and what came in today. Totals, balance and status are computed here for
 * display and recomputed server-side on save.
 */
/** Pre-fill the fee column - and, for fixing, what is recorded as paid. */
function rowsFrom(record: PaymentRecord | null): Record<Bucket, Row> {
  const next = emptyRows();
  for (const b of BUCKETS) {
    const fee = record ? Number(record[b.feeField] ?? 0) : 0;
    const paid = record ? Number(record[b.paidField] ?? 0) : 0;
    next[b.key] = {
      fee: fee > 0 ? String(fee) : '',
      pay: '',
      paid: paid > 0 ? String(paid) : '',
    };
  }
  return next;
}

export function PaymentSheet({
  students,
  initialStudentId,
  initialRecord = null,
  onDone,
}: {
  students: StudentOption[];
  initialStudentId?: string;
  /** The row's record when opened from the table - saves a round-trip. */
  initialRecord?: PaymentRecord | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [studentId, setStudentId] = useState(initialStudentId ?? '');
  const [record, setRecord] = useState<PaymentRecord | null>(initialRecord);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<Bucket, Row>>(() => rowsFrom(initialRecord));
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(todayISO);
  const [notes, setNotes] = useState('');
  // Finance asked for a way to undo a mis-typed amount (1,350,000 for 135,000):
  // in "fix" mode the numbers are what should stand, not what to add.
  const [mode, setMode] = useState<'record' | 'fix'>('record');
  const [reason, setReason] = useState('');
  const fixing = mode === 'fix';

  /**
   * Picking a student loads their current fees, so "paid so far" and the
   * balance are the real ones. Done in the handler, not an effect.
   */
  const pickStudent = (id: string) => {
    setStudentId(id);
    setRecord(null);
    setRows(emptyRows());
    setReason('');
    if (!id) return;
    setLoading(true);
    startTransition(async () => {
      const r = await getPaymentRecord(id);
      setRecord(r);
      setRows(rowsFrom(r));
      setLoading(false);
    });
  };

  /** Switching mode starts from the saved figures again. */
  const switchMode = (next: 'record' | 'fix') => {
    setMode(next);
    setRows(rowsFrom(record));
    setReason('');
  };

  /** Wipe every recorded payment for this student (fees are left alone). */
  const clearAll = () =>
    setRows((r) => {
      const next = { ...r };
      for (const b of BUCKETS) next[b.key] = { ...next[b.key], paid: '0' };
      return next;
    });

  const totals = useMemo(() => {
    let fees = 0;
    let paidBefore = 0;
    let paying = 0;
    let corrected = 0;
    for (const b of BUCKETS) {
      const already = record ? Number(record[b.paidField] ?? 0) : 0;
      const typedFee = num(rows[b.key].fee);
      const pay = num(rows[b.key].pay);
      const nowPaid = fixing ? numOrZero(rows[b.key].paid) : already;
      // A fee left blank falls back to what is already paid plus what is being
      // paid now, so the balance never goes negative.
      fees += Math.max(typedFee, nowPaid + pay);
      paidBefore += already;
      paying += pay;
      corrected += nowPaid;
    }
    const paid = (fixing ? corrected : paidBefore) + paying;
    return { fees, paidBefore, paying, corrected, paid, balance: fees - paid };
  }, [rows, record, fixing]);

  const set = (b: Bucket, field: keyof Row) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRows((r) => ({ ...r, [b]: { ...r[b], [field]: e.target.value } }));

  const submitCorrection = () => {
    if (!record) {
      toast.error('This student has no payment record to correct yet.');
      return;
    }
    const lines: PaymentCorrectionLine[] = [];
    for (const b of BUCKETS) {
      const wasPaid = Number(record[b.paidField] ?? 0);
      const wasFee = Number(record[b.feeField] ?? 0);
      const nowPaid = numOrZero(rows[b.key].paid);
      const nowFee = numOrZero(rows[b.key].fee);
      const line: PaymentCorrectionLine = { bucket: b.key };
      if (nowPaid !== wasPaid) line.paid = nowPaid;
      if (nowFee !== wasFee) line.fee = nowFee;
      if (line.paid === undefined && line.fee === undefined) continue;
      lines.push(line);
    }
    if (lines.length === 0) {
      toast.error('Nothing to correct - change an amount first.');
      return;
    }
    if (reason.trim().length < 4) {
      toast.error('Say why it is being corrected - it goes on the cash book entry.');
      return;
    }

    startTransition(async () => {
      const res = await correctPayments(studentId, {
        lines,
        reason: reason.trim(),
        paymentMethod,
        date: paymentDate,
      });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      onDone();
      router.refresh();
    });
  };

  const submit = () => {
    if (!studentId) {
      toast.error('Choose the student first.');
      return;
    }
    if (fixing) {
      submitCorrection();
      return;
    }
    const lines: PaymentLineInput[] = [];
    for (const b of BUCKETS) {
      const fee = num(rows[b.key].fee);
      const pay = num(rows[b.key].pay);
      const already = record ? Number(record[b.paidField] ?? 0) : 0;
      const feeChanged = fee !== (record ? Number(record[b.feeField] ?? 0) : 0);
      if (pay <= 0 && !feeChanged) continue;
      if (fee > 0 && already + pay > fee) {
        toast.error(`${b.label}: paid ${money(already + pay)} is more than the fee ${money(fee)}.`);
        return;
      }
      lines.push({ bucket: b.key, ...(fee > 0 ? { fee } : {}), ...(pay > 0 ? { amount: pay } : {}) });
    }
    if (lines.length === 0) {
      toast.error('Nothing to save - enter a fee or an amount.');
      return;
    }
    if (totals.paying > 0 && receiptNumber.trim().length === 0) {
      toast.error('Enter the receipt number for the money received.');
      return;
    }

    startTransition(async () => {
      const res = await recordPayments(studentId, {
        lines,
        receiptNumber: receiptNumber.trim() || undefined,
        paymentMethod,
        paymentDate,
        notes: notes.trim() || undefined,
      });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      onDone();
      router.refresh();
    });
  };

  const awaiting = students.filter((s) => s.pipelineStage === 'PAYMENT_PENDING');
  const others = students.filter((s) => s.pipelineStage !== 'PAYMENT_PENDING');

  return (
    <div className="space-y-4">
      {!initialStudentId && (
        <div className="space-y-2">
          <Label htmlFor="ps-student">Student *</Label>
          <Select id="ps-student" value={studentId} onChange={(e) => pickStudent(e.target.value)}>
            <option value="">Choose a student…</option>
            {awaiting.length > 0 && (
              <optgroup label="Awaiting payment">
                {awaiting.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.registrationNumber})</option>
                ))}
              </optgroup>
            )}
            {others.length > 0 && (
              <optgroup label="Other students">
                {others.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.registrationNumber})</option>
                ))}
              </optgroup>
            )}
          </Select>
        </div>
      )}

      {studentId && (
        <>
          {/* Nothing to correct until the student has a saved record. */}
          <div className={`flex flex-wrap items-center gap-2 ${record ? '' : 'hidden'}`}>
            {([
              { key: 'record' as const, label: 'Record payment' },
              { key: 'fix' as const, label: 'Correct / clear' },
            ]).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => switchMode(t.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  mode === t.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
            {fixing && (
              <Button type="button" variant="ghost" onClick={clearAll} className="gap-1.5 text-red-700 h-8">
                <Eraser className="w-3.5 h-3.5" />
                Clear all payments
              </Button>
            )}
          </div>

          {fixing && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Type what the figures <b>should be</b> - they replace what is saved,
              they are not added to it. Set an amount to 0 to remove it. The
              difference is posted to the cash book as a correction.
            </p>
          )}

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">Fee type</th>
                  <th className="px-3 py-2 text-right font-medium">Fee (TSh)</th>
                  <th className="px-3 py-2 text-right font-medium">{fixing ? 'Recorded' : 'Paid so far'}</th>
                  <th className="px-3 py-2 text-right font-medium">{fixing ? 'Should be' : 'Paying now'}</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {BUCKETS.map((b) => {
                  const already = record ? Number(record[b.paidField] ?? 0) : 0;
                  const pay = num(rows[b.key].pay);
                  const standing = fixing ? numOrZero(rows[b.key].paid) : already;
                  const fee = Math.max(num(rows[b.key].fee), standing + pay);
                  const left = fee - standing - pay;
                  return (
                    <tr key={b.key}>
                      <td className="px-3 py-2 font-medium text-gray-900">{b.label}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={rows[b.key].fee}
                          onChange={set(b.key, 'fee')}
                          placeholder="0"
                          className="h-8 text-right tabular-nums"
                          aria-label={`${b.label} total fee`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                        {loading ? '…' : already > 0 ? already.toLocaleString('en-US') : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={fixing ? rows[b.key].paid : rows[b.key].pay}
                          onChange={set(b.key, fixing ? 'paid' : 'pay')}
                          placeholder="0"
                          className={`h-8 text-right tabular-nums ${
                            fixing && standing !== already ? 'border-amber-400 bg-amber-50' : ''
                          }`}
                          aria-label={
                            fixing
                              ? `${b.label} corrected amount paid`
                              : `${b.label} amount paid now`
                          }
                        />
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums ${left > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                        {left > 0 ? left.toLocaleString('en-US') : 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-900">
                  <td className="px-3 py-2">Totals</td>
                  <td className="px-3 py-2 text-right tabular-nums">{totals.fees.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">{totals.paidBefore.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-primary">
                    {(fixing ? totals.corrected : totals.paying).toLocaleString('en-US')}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${totals.balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {Math.max(0, totals.balance).toLocaleString('en-US')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
            <Stat label="Total fees" value={money(totals.fees)} />
            <Stat label={fixing ? 'Total paid after fix' : 'Total paid'} value={money(totals.paid)} accent="text-green-700" />
            <Stat label="Amount due" value={money(Math.max(0, totals.balance))} accent={totals.balance > 0 ? 'text-amber-700' : 'text-green-700'} />
            <Stat
              label="Status after save"
              value={totals.fees > 0 && totals.paid >= totals.fees ? 'Cleared' : totals.paid > 0 ? 'Partial' : 'Pending'}
            />
          </div>

          {fixing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ps-reason">Why is it being corrected? *</Label>
                <Input
                  id="ps-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Typed 1,350,000 instead of 135,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-fix-date">Correction date</Label>
                <Input id="ps-fix-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
            </div>
          )}

          {!fixing && totals.paying > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ps-receipt">Receipt number *</Label>
                <Input id="ps-receipt" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} placeholder="RCP-0001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-method">Received by</Label>
                <Select id="ps-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-date">Payment date</Label>
                <Input id="ps-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
            </div>
          )}

          <div className={`space-y-2 ${fixing ? 'hidden' : ''}`}>
            <Label htmlFor="ps-notes">Notes</Label>
            <Textarea id="ps-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth recording about this payment…" />
          </div>

          <p className="text-[11px] text-gray-500">
            {fixing
              ? 'The corrected figures replace what is saved. Totals and the amount due are recalculated, and the difference is written to the cash book with your reason so the books still balance.'
              : 'Fill in as many fee types as you need and save once. The totals and the amount due are worked out for you; money received is posted to the cash book as a single receipt.'}
          </p>
        </>
      )}

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy || !studentId} className="gap-2">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : fixing ? (
            <Eraser className="w-4 h-4" />
          ) : totals.paying > 0 ? (
            <Receipt className="w-4 h-4" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          {fixing ? 'Save correction' : totals.paying > 0 ? 'Record payment' : 'Save fees'}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'text-gray-900' }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-base font-bold tabular-nums mt-0.5 ${accent}`}>{value}</p>
    </div>
  );
}
