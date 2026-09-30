'use client';

import { Printer } from 'lucide-react';

export function PrintButton({ label = 'Download / Print PDF' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium px-4 py-2 shadow-sm"
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
