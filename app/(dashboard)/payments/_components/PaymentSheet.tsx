'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PaymentRecord } from '@/types';
import { getPaymentRecord, PaymentLineInput, recordPayments } from '@/lib/actions/paymentActions';

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
/** Module-level so render stays pure. */
const todayISO = () => new Date().toISOString().slice(0, 10);

type Row = { fee: string; pay: string };
const emptyRows = (): Record<Bucket, Row> => ({
  APPLICATION: { fee: '', pay: '' },
  TUITION: { fee: '', pay: '' },
  AGENCY: { fee: '', pay: '' },
  HOSTEL: { fee: '', pay: '' },
});

/**
 * Finance records everything a student paid in one sheet: each fee type's fee
 * and what came in today. Totals, balance and status are computed here for
 * display and recomputed server-side on save.
 */
/** Pre-fill the fee column from a record we already have. */
function rowsFrom(record: PaymentRecord | null): Record<Bucket, Row> {
  const next = emptyRows();
  for (const b of BUCKETS) {
    const fee = record ? Number(record[b.feeField] ?? 0) : 0;
    next[b.key] = { fee: fee > 0 ? String(fee) : '', pay: '' };
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

  /**
   * Picking a student loads their current fees, so "paid so far" and the
   * balance are the real ones. Done in the handler, not an effect.
   */
  const pickStudent = (id: string) => {
    setStudentId(id);
    setRecord(null);
    setRows(emptyRows());
    if (!id) return;
    setLoading(true);
    startTransition(async () => {
      const r = await getPaymentRecord(id);
      setRecord(r);
      setRows(rowsFrom(r));
      setLoading(false);
    });
  };

  const totals = useMemo(() => {
    let fees = 0;
    let paidBefore = 0;
    let paying = 0;
    for (const b of BUCKETS) {
      const already = record ? Number(record[b.paidField] ?? 0) : 0;
      const typedFee = num(rows[b.key].fee);
      const pay = num(rows[b.key].pay);
      // A fee left blank falls back to what is already paid plus what is being
      // paid now, so the balance never goes negative.
      fees += Math.max(typedFee, already + pay);
      paidBefore += already;
      paying += pay;
    }
    const paid = paidBefore + paying;
    return { fees, paidBefore, paying, paid, balance: fees - paid };
  }, [rows, record]);

  const set = (b: Bucket, field: keyof Row) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRows((r) => ({ ...r, [b]: { ...r[b], [field]: e.target.value } }));

  const submit = () => {
    if (!studentId) {
      toast.error('Choose the student first.');
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
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">Fee type</th>
                  <th className="px-3 py-2 text-right font-medium">Fee (TSh)</th>
                  <th className="px-3 py-2 text-right font-medium">Paid so far</th>
                  <th className="px-3 py-2 text-right font-medium">Paying now</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {BUCKETS.map((b) => {
                  const already = record ? Number(record[b.paidField] ?? 0) : 0;
                  const pay = num(rows[b.key].pay);
                  const fee = Math.max(num(rows[b.key].fee), already + pay);
                  const left = fee - already - pay;
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
                          value={rows[b.key].pay}
                          onChange={set(b.key, 'pay')}
                          placeholder="0"
                          className="h-8 text-right tabular-nums"
                          aria-label={`${b.label} amount paid now`}
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
                  <td className="px-3 py-2 text-right tabular-nums text-primary">{totals.paying.toLocaleString('en-US')}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${totals.balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {Math.max(0, totals.balance).toLocaleString('en-US')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
            <Stat label="Total fees" value={money(totals.fees)} />
            <Stat label="Total paid" value={money(totals.paid)} accent="text-green-700" />
            <Stat label="Amount due" value={money(Math.max(0, totals.balance))} accent={totals.balance > 0 ? 'text-amber-700' : 'text-green-700'} />
            <Stat
              label="Status after save"
              value={totals.fees > 0 && totals.paid >= totals.fees ? 'Cleared' : totals.paid > 0 ? 'Partial' : 'Pending'}
            />
          </div>

          {totals.paying > 0 && (
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

          <div className="space-y-2">
            <Label htmlFor="ps-notes">Notes</Label>
            <Textarea id="ps-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth recording about this payment…" />
          </div>

          <p className="text-[11px] text-gray-500">
            Fill in as many fee types as you need and save once. The totals and the amount due are
            worked out for you; money received is posted to the cash book as a single receipt.
          </p>
        </>
      )}

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy || !studentId} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : totals.paying > 0 ? <Receipt className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
          {totals.paying > 0 ? 'Record payment' : 'Save fees'}
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
