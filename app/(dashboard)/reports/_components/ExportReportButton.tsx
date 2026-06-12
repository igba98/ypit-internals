'use client';

import { Printer } from 'lucide-react';

export function ExportReportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      <Printer className="w-4 h-4" />
      Export Report
    </button>
  );
}
