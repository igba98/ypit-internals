import { Printer } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
/** Local dates - toISOString() would slip a day back in East Africa. */
const monthStartISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Pick a period and open the printable report in a new tab. A plain GET form,
 * so it works without JavaScript and the dates land in the URL the print page
 * already reads.
 */
export function PrintRangeForm({
  action,
  label = 'Print report',
  from,
  to,
}: {
  action: string;
  label?: string;
  from?: string;
  to?: string;
}) {
  return (
    <form
      action={action}
      method="GET"
      target="_blank"
      className="flex items-end gap-2"
    >
      <div className="space-y-1">
        <label htmlFor="pr-from" className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
          From
        </label>
        <input
          id="pr-from"
          name="from"
          type="date"
          defaultValue={from ?? monthStartISO()}
          className="block rounded-md border border-gray-200 px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="pr-to" className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
          To
        </label>
        <input
          id="pr-to"
          name="to"
          type="date"
          defaultValue={to ?? todayISO()}
          className="block rounded-md border border-gray-200 px-2.5 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3.5 py-2"
      >
        <Printer className="w-3.5 h-3.5" />
        {label}
      </button>
    </form>
  );
}
