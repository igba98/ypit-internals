'use client';

import { useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Builds the URL for a print-ready report and opens it in a new tab, where
 * the browser's Print dialog saves it as PDF.
 */
export function GenerateReportCard({ currentYear }: { currentYear: number }) {
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(''); // '' = whole year

  const href = `/print/report/leads?year=${year}${month ? `&month=${month}` : ''}`;
  const periodLabel = month ? `${MONTHS[Number(month) - 1]} ${year}` : `Year ${year}`;

  return (
    <section className="print:hidden bg-white rounded-xl shadow-card border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-gray-900">Generate PDF Report</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Leads &amp; Admissions — month-by-month performance, best month, sources,
        and per-owner conversion. Opens print-ready; choose “Save as PDF”.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="report-type">Report</Label>
          <Select id="report-type" value="leads" disabled className="min-w-[200px]">
            <option value="leads">Leads &amp; Admissions</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-year">Year</Label>
          <Select
            id="report-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-month">Period</Label>
          <Select
            id="report-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Whole year (monthly breakdown)</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m} only</option>
            ))}
          </Select>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary-light text-white text-sm font-medium px-4 py-2"
        >
          Generate <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">Will produce: {periodLabel}</p>
    </section>
  );
}
