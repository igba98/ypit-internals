'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  Upload,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { importContacts, ImportActionResult } from '@/lib/actions/campaignActions';

export function ImportPanel() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, startTransition] = useTransition();
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportActionResult | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await importContacts(formData);
      setResult(res);
      if (res.success) {
        toast.success(res.message);
        formRef.current?.reset();
        setFileName('');
        router.refresh();
      } else {
        toast.error(res.message);
        // Still refresh: a partial import may have created the group.
        if (res.result?.group) router.refresh();
      }
    });
  };

  const rejected = result?.result?.rejected ?? [];

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-gray-900">Import Contacts</h2>
        </div>
        <a
          href="/api/contact-template"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Download className="w-4 h-4" /> Template
        </a>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="p-4 space-y-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          Download the template, fill in one parent per row, then upload it here.
          Rows that fail validation are skipped — you&apos;ll see exactly which
          and why below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="groupName">Group name</Label>
            <Input
              id="groupName"
              name="groupName"
              placeholder="e.g. Batch 2"
              required
              minLength={2}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. June open-day list"
              maxLength={300}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="file">Contacts file (.xlsx / .csv)</Label>
          <label className="mt-1 flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <Upload className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600 truncate">
              {fileName || 'Choose file…'}
            </span>
            <input
              id="file"
              name="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              required
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            />
          </label>
        </div>

        <Button type="submit" disabled={busy} className="gap-2">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Import contacts
        </Button>
      </form>

      {result && (
        <div className="px-4 pb-4 space-y-3">
          {result.result?.group && (
            <div className="flex items-start gap-2 text-sm bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <b>{result.result.imported}</b> imported into{' '}
                <b>{result.result.group.name}</b>.
              </span>
            </div>
          )}

          {rejected.length > 0 && (
            <div className="border border-amber-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 border-b border-amber-200">
                <AlertTriangle className="w-4 h-4" />
                {rejected.length} row{rejected.length === 1 ? '' : 's'} skipped —
                did not meet the criteria
              </div>
              <ul className="max-h-56 overflow-y-auto divide-y divide-amber-100">
                {rejected.map((r, i) => (
                  <li
                    key={`${r.row}-${i}`}
                    className="px-3 py-2 text-sm flex items-start gap-2"
                  >
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5 shrink-0">
                      row {r.row}
                    </span>
                    <span className="text-gray-900 font-medium shrink-0">
                      {r.name}
                    </span>
                    <span className="text-gray-400">—</span>
                    <span className="text-amber-700">{r.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
