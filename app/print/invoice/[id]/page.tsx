import { notFound } from 'next/navigation';
import { backendFetch } from '@/lib/backend';
import { Invoice } from '@/types';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { AGENCY_INFO } from '@/lib/agency-info';
import { PrintButton } from './_components/PrintButton';

export const metadata = {
  title: 'Invoice · YPIT',
};

async function loadInvoice(id: string): Promise<Invoice | null> {
  try {
    const res = await backendFetch(`/finance/invoices/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as Invoice;
  } catch {
    return null;
  }
}

const STATUS_BADGE: Record<Invoice['status'], string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
  OVERDUE: 'bg-red-50 text-red-700 border-red-200',
  VOID: 'bg-gray-100 text-gray-500 border-gray-200 line-through',
};

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await loadInvoice(id);
  if (!inv) notFound();

  const ccy = inv.currency;
  const balance = inv.total - inv.paidAmount;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[820px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Invoice Preview</p>
            <p className="text-sm text-gray-700">
              {inv.invoiceNumber ?? inv.id} · {inv.recipientName}
            </p>
          </div>
          <PrintButton />
        </div>

        <article className="bg-white shadow-md print:shadow-none border border-gray-200 print:border-0 rounded-lg print:rounded-none p-10 print:p-12">
          <header className="flex items-start justify-between gap-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{AGENCY_INFO.name}</h1>
              <p className="text-xs text-gray-500 mt-1">{AGENCY_INFO.tagline}</p>
              <div className="text-xs text-gray-600 mt-3 leading-relaxed">
                {AGENCY_INFO.address.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>{AGENCY_INFO.phone} · {AGENCY_INFO.email}</p>
                <p>{AGENCY_INFO.website} · {AGENCY_INFO.taxId}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Invoice</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{inv.invoiceNumber ?? inv.id}</p>
              <span
                className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_BADGE[inv.status]}`}
              >
                {inv.status}
              </span>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Bill To</p>
              <p className="text-base font-semibold text-gray-900 mt-1">{inv.recipientName}</p>
              <p className="text-xs text-gray-500 capitalize">{inv.recipientType.toLowerCase()}</p>
              {inv.description && (
                <p className="text-xs text-gray-700 mt-2">{inv.description}</p>
              )}
            </div>
            <div className="text-right">
              <dl className="text-xs space-y-1">
                <div className="flex items-center justify-end gap-3">
                  <dt className="text-gray-500">Issue Date:</dt>
                  <dd className="text-gray-900 font-medium w-28">{formatDate(inv.issueDate)}</dd>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <dt className="text-gray-500">Due Date:</dt>
                  <dd className="text-gray-900 font-medium w-28">{formatDate(inv.dueDate)}</dd>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <dt className="text-gray-500">Currency:</dt>
                  <dd className="text-gray-900 font-medium w-28">{ccy}</dd>
                </div>
                {inv.paidDate && (
                  <div className="flex items-center justify-end gap-3">
                    <dt className="text-gray-500">Paid On:</dt>
                    <dd className="text-gray-900 font-medium w-28">{formatDate(inv.paidDate)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>

          <section className="mt-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-600 border-y border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold">Description</th>
                  <th className="text-right px-3 py-2 font-semibold w-20">Qty</th>
                  <th className="text-right px-3 py-2 font-semibold w-32">Unit Price</th>
                  <th className="text-right px-3 py-2 font-semibold w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {inv.lineItems.map((li, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-3 text-gray-900">{li.description}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{li.quantity}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(li.unitPrice, { currency: ccy })}</td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900">{formatCurrency(li.total, { currency: ccy })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex justify-end mt-6">
            <dl className="w-72 text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="text-gray-900 font-medium">{formatCurrency(inv.subtotal, { currency: ccy })}</dd>
              </div>
              {inv.tax > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Tax</dt>
                  <dd className="text-gray-900 font-medium">{formatCurrency(inv.tax, { currency: ccy })}</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-300 pt-2 mt-2">
                <dt className="text-gray-900 font-bold">Total</dt>
                <dd className="text-gray-900 font-bold text-base">{formatCurrency(inv.total, { currency: ccy })}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Paid</dt>
                <dd className="text-green-700 font-semibold">{formatCurrency(inv.paidAmount, { currency: ccy })}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-300 pt-2 mt-2">
                <dt className="text-gray-900 font-bold">Balance Due</dt>
                <dd className={`font-bold text-base ${balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(balance, { currency: ccy })}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs text-gray-600">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Payment Instructions</p>
              <p>{AGENCY_INFO.bank.bankName}</p>
              <p>Account: {AGENCY_INFO.bank.accountName}</p>
              <p>A/C #: {AGENCY_INFO.bank.accountNumber}</p>
              <p>SWIFT: {AGENCY_INFO.bank.swift}</p>
            </div>
            {inv.notes && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Notes</p>
                <p className="whitespace-pre-wrap">{inv.notes}</p>
              </div>
            )}
          </section>

          <footer className="mt-10 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-500">
            Thank you for choosing {AGENCY_INFO.name}. For queries, contact {AGENCY_INFO.email}.
          </footer>
        </article>
      </div>
    </div>
  );
}
