import { AGENCY_INFO } from '@/lib/agency-info';

/**
 * The letterhead every printed finance document carries. Kept in one place so
 * an invoice, a payslip and a petty-cash voucher all look like they came from
 * the same office.
 */
export function Letterhead({
  documentType,
  reference,
  badge,
}: {
  documentType: string;
  reference?: string;
  badge?: React.ReactNode;
}) {
  return (
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
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{documentType}</p>
        {reference && <p className="text-xl font-bold text-gray-900 mt-1">{reference}</p>}
        {badge}
      </div>
    </header>
  );
}

/** Page frame shared by the printable documents. */
export function PrintPage({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`bg-white shadow-md print:shadow-none border border-gray-200 print:border-0 rounded-lg print:rounded-none p-10 print:p-12 ${className}`}
    >
      {children}
    </article>
  );
}

export function PrintFooter({ note }: { note?: string }) {
  return (
    <footer className="mt-10 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-500">
      {note ?? `${AGENCY_INFO.name} · ${AGENCY_INFO.email} · ${AGENCY_INFO.phone}`}
    </footer>
  );
}

/** Two ruled lines for wet signatures - finance asked for signable vouchers. */
export function SignatureLines({
  left = 'Prepared by',
  right = 'Approved by',
  third,
}: {
  left?: string;
  right?: string;
  third?: string;
}) {
  const cols = third ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <section className={`grid ${cols} gap-8 mt-12 text-xs text-gray-600`}>
      {[left, right, ...(third ? [third] : [])].map((label) => (
        <div key={label}>
          <div className="border-b border-gray-400 h-10" />
          <p className="mt-1.5">{label}</p>
          <p className="text-[10px] text-gray-400">Name · Signature · Date</p>
        </div>
      ))}
    </section>
  );
}
