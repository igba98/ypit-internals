import { notFound } from 'next/navigation';
import { backendFetch } from '@/lib/backend';
import { PettyCashTransaction } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { PrintButton } from '@/app/print/_components/PrintButton';
import { Letterhead, PrintPage, PrintFooter, SignatureLines } from '@/app/print/_components/Letterhead';

export const metadata = {
  title: 'Petty Cash Voucher · YPIT',
};

async function loadTx(id: string): Promise<PettyCashTransaction | null> {
  try {
    const res = await backendFetch(`/finance/petty-cash/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as PettyCashTransaction;
  } catch {
    return null;
  }
}

const TYPE_LABEL: Record<string, string> = {
  EXPENSE: 'Payment out of petty cash',
  REPLENISHMENT: 'Petty cash top-up',
  INITIAL_FLOAT: 'Opening float',
};

/** The single voucher finance prints, signs and files with the receipt. */
export default async function PettyCashVoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tx = await loadTx(id);
  if (!tx) notFound();

  const ref = tx.voucherNumber || tx.txNumber || tx.id;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[820px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Petty Cash Voucher</p>
            <p className="text-sm text-gray-700">{ref} · {formatCurrency(tx.amount, { currency: tx.currency })}</p>
          </div>
          <PrintButton />
        </div>

        <PrintPage>
          <Letterhead documentType="Petty Cash Voucher" reference={ref} />

          <section className="grid grid-cols-2 gap-8 mt-6 text-sm">
            <div className="space-y-2">
              <Field label="Date" value={formatDate(tx.date)} />
              <Field label="Paid to" value={tx.recipient || '-'} />
              <Field
                label="Category"
                value={tx.category ? tx.category.replace(/_/g, ' ').toLowerCase() : '-'}
              />
            </div>
            <div className="space-y-2">
              <Field label="Type" value={TYPE_LABEL[tx.type] ?? tx.type} />
              <Field label="Recorded by" value={tx.recordedByName || '-'} />
              <Field label="Balance after" value={formatCurrency(tx.balanceAfter, { currency: tx.currency })} />
            </div>
          </section>

          <section className="mt-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-600 border-y border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold">Particulars</th>
                  <th className="text-right px-3 py-2 font-semibold w-40">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-4 text-gray-900 align-top">
                    {tx.description}
                    {tx.notes && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{tx.notes}</p>}
                  </td>
                  <td className="px-3 py-4 text-right font-semibold text-gray-900 align-top">
                    {formatCurrency(tx.amount, { currency: tx.currency })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td className="px-3 py-3 font-bold text-gray-900">Total</td>
                  <td className="px-3 py-3 text-right font-bold text-base text-gray-900">
                    {formatCurrency(tx.amount, { currency: tx.currency })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {tx.receiptFilename && (
            <p className="mt-4 text-xs text-gray-500">
              Supporting receipt on file: {tx.receiptFilename}
            </p>
          )}

          <SignatureLines left="Paid by (Cashier)" right="Authorised by" third="Received by" />
          <PrintFooter />
        </PrintPage>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium capitalize border-b border-dotted border-gray-300 flex-1">{value}</span>
    </div>
  );
}
