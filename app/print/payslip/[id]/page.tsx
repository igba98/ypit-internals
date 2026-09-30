import { notFound } from 'next/navigation';
import { backendFetch } from '@/lib/backend';
import { PayrollEntry } from '@/types';
import { PrintButton } from '@/app/print/_components/PrintButton';
import { PayslipDocument } from '../_components/PayslipDocument';

export const metadata = {
  title: 'Salary Slip · YPIT',
};

async function loadEntry(id: string): Promise<PayrollEntry | null> {
  try {
    const res = await backendFetch(`/finance/payroll/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as PayrollEntry;
  } catch {
    return null;
  }
}

/** One staff member's slip, printed on its own. */
export default async function PayslipPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await loadEntry(id);
  if (!entry) notFound();

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[820px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Salary Slip</p>
            <p className="text-sm text-gray-700">{entry.staffName} · {entry.period}</p>
          </div>
          <PrintButton />
        </div>
        <PayslipDocument entry={entry} />
      </div>
    </div>
  );
}
