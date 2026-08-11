'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Save, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CmsSlot } from '@/lib/cms-slots';
import {
  finalizeSlotUpload,
  requestSlotUploadUrl,
  resetSiteSlot,
  setSiteSlot,
  SiteContentRow,
} from '@/lib/actions/siteContentActions';

const MAX_BYTES = 8 * 1024 * 1024;
const BACKEND_PUBLIC_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

/** Browser → R2 direct PUT via the presigned URL. */
function putToR2(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ ok: boolean; status: number }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    });
    xhr.onload = () =>
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status });
    xhr.onerror = () => resolve({ ok: false, status: xhr.status || 0 });
    xhr.send(file);
  });
}

/** Absolute URL for previewing whatever the slot currently resolves to. */
function previewSrc(row: SiteContentRow | null, fallback: string): string {
  const v = row?.resolvedValue;
  if (!v) return fallback;
  if (v.startsWith('http')) return v;
  if (v.startsWith('/public/site-content/')) return `${BACKEND_PUBLIC_URL}${v}`;
  return v;
}

export function SlotEditor({
  slot,
  current,
}: {
  slot: CmsSlot;
  current: SiteContentRow | null;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [text, setText] = useState(current?.value ?? '');
  const [progress, setProgress] = useState<number | null>(null);

  const isCustom = current !== null;

  const onSaveText = () => {
    startTransition(async () => {
      const res = await setSiteSlot(slot.key, 'TEXT', text.trim() || null);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const onReset = () => {
    if (!confirm(`Reset "${slot.label}" back to the website's default?`)) return;
    startTransition(async () => {
      const res = await resetSiteSlot(slot.key);
      if (res.success) {
        toast.success(res.message);
        setText('');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('That image is over the 8 MB limit.');
      return;
    }
    startTransition(async () => {
      const ticketRes = await requestSlotUploadUrl(slot.key, {
        originalName: file.name,
        mimeType: file.type || 'image/jpeg',
        sizeBytes: file.size,
      });
      if (!ticketRes.success || !ticketRes.ticket) {
        toast.error(ticketRes.message);
        return;
      }
      setProgress(0);
      const put = await putToR2(ticketRes.ticket.uploadUrl, file, setProgress);
      if (!put.ok) {
        setProgress(null);
        toast.error(`Upload failed (HTTP ${put.status}).`);
        return;
      }
      const fin = await finalizeSlotUpload(slot.key, ticketRes.ticket.storageKey);
      setProgress(null);
      if (fin.success) {
        toast.success(fin.message);
        router.refresh();
      } else {
        toast.error(fin.message);
      }
    });
  };

  return (
    <div className="px-5 py-4 flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{slot.label}</p>
          {isCustom ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700">
              <CheckCircle2 className="w-3 h-3" /> Customised
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
              Default
            </span>
          )}
        </div>
        {slot.hint && <p className="text-[11px] text-gray-500 mt-0.5">{slot.hint}</p>}

        {slot.type === 'TEXT' ? (
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={slot.defaultValue || 'Uses the built-in wording'}
              className="max-w-xl"
            />
            <Button onClick={onSaveText} disabled={busy} size="sm" className="gap-1.5">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              {busy && progress !== null ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {progress !== null ? `Uploading ${Math.round(progress)}%` : 'Replace image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <span className="text-[11px] text-gray-400">
              {isCustom ? 'Showing your uploaded image' : `Default: ${slot.defaultValue}`}
            </span>
          </div>
        )}
      </div>

      {/* Preview: images render, text slots show the effective copy. */}
      {slot.type === 'IMAGE' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc(current, slot.defaultValue)}
          alt={slot.label}
          className="w-28 h-20 object-cover rounded-md border border-gray-200 shrink-0 bg-gray-50"
        />
      ) : (
        <p className="w-28 shrink-0 text-[11px] text-gray-500 line-clamp-3">
          {current?.value || slot.defaultValue || '—'}
        </p>
      )}

      <button
        onClick={onReset}
        disabled={busy || !isCustom}
        title={isCustom ? 'Reset to default' : 'Already the default'}
        className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 p-1.5 rounded-md hover:bg-red-50 shrink-0"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
