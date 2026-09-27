'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Check,
  Crop,
  Loader2,
  RotateCcw,
  Save,
  Upload,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CmsSlot,
  DEFAULT_IMAGE_ASPECT,
  DEFAULT_IMAGE_MAX_WIDTH,
} from '@/lib/cms-slots';
import { formatBytes, prepareImage, PreparedImage } from '@/lib/image-resize';
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

type Focus = 'top' | 'center' | 'bottom';

/** Browser → R2 direct PUT via the presigned URL. */
function putToR2(
  uploadUrl: string,
  body: Blob,
  contentType: string,
  onProgress: (pct: number) => void,
): Promise<{ ok: boolean; status: number }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    });
    xhr.onload = () =>
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status });
    xhr.onerror = () => resolve({ ok: false, status: xhr.status || 0 });
    xhr.send(body);
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

function shapeLabel(aspect: number | null | undefined): string {
  if (!aspect) return 'original shape';
  const known: [number, string][] = [
    [16 / 9, 'wide 16:9'],
    [4 / 3, '4:3'],
    [3 / 2, '3:2'],
    [1, 'square'],
    [3 / 4, 'portrait 3:4'],
  ];
  const hit = known.find(([v]) => Math.abs(v - aspect) < 0.02);
  return hit ? hit[1] : `${aspect.toFixed(2)}:1`;
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
  // Picked-but-not-yet-uploaded image, so the crop can be checked first.
  const [pending, setPending] = useState<{
    file: File;
    prepared: PreparedImage;
    previewUrl: string;
    focus: Focus;
    original: boolean;
  } | null>(null);

  const isCustom = current !== null;
  const aspect = slot.aspect === undefined ? DEFAULT_IMAGE_ASPECT : slot.aspect;
  const maxWidth = slot.maxWidth ?? DEFAULT_IMAGE_MAX_WIDTH;

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

  /** Re-run the resize when the crop position or "original" toggle changes. */
  const reprepare = async (file: File, focus: Focus, original: boolean) => {
    const prepared = await prepareImage(file, {
      maxWidth: original ? 4000 : maxWidth,
      aspect: original ? null : aspect,
      focus,
    });
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending({
      file,
      prepared,
      previewUrl: URL.createObjectURL(prepared.blob),
      focus,
      original,
    });
  };

  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.');
      return;
    }
    startTransition(async () => {
      try {
        await reprepare(file, 'center', false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not read that image.');
      }
    });
  };

  const onUpload = () => {
    if (!pending) return;
    const { prepared } = pending;
    if (prepared.blob.size > MAX_BYTES) {
      toast.error(`Still ${formatBytes(prepared.blob.size)} after resizing - use a smaller image.`);
      return;
    }
    startTransition(async () => {
      const ticketRes = await requestSlotUploadUrl(slot.key, {
        originalName: prepared.name,
        mimeType: prepared.type,
        sizeBytes: prepared.blob.size,
      });
      if (!ticketRes.success || !ticketRes.ticket) {
        toast.error(ticketRes.message);
        return;
      }
      setProgress(0);
      const put = await putToR2(
        ticketRes.ticket.uploadUrl,
        prepared.blob,
        prepared.type,
        setProgress,
      );
      if (!put.ok) {
        setProgress(null);
        toast.error(`Upload failed (HTTP ${put.status}).`);
        return;
      }
      const fin = await finalizeSlotUpload(slot.key, ticketRes.ticket.storageKey);
      setProgress(null);
      if (fin.success) {
        toast.success(fin.message);
        URL.revokeObjectURL(pending.previewUrl);
        setPending(null);
        router.refresh();
      } else {
        toast.error(fin.message);
      }
    });
  };

  const cancelPending = () => {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
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
          <div className="mt-2 flex items-start gap-2">
            {slot.multiline ? (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder={slot.defaultValue || 'Uses the built-in wording'}
                className="max-w-2xl"
              />
            ) : (
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={slot.defaultValue || 'Uses the built-in wording'}
                className="max-w-xl"
              />
            )}
            <Button onClick={onSaveText} disabled={busy} size="sm" className="gap-1.5 shrink-0">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        ) : pending ? (
          /* Chosen image: resized and cropped, waiting for a look before upload. */
          <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pending.previewUrl} alt="New image preview" className="w-40 rounded-md border border-gray-200 bg-white" />
              <div className="text-[11px] text-gray-700 space-y-1">
                <p className="font-semibold text-gray-900">Ready to upload</p>
                <p>
                  {pending.prepared.width}×{pending.prepared.height} ·{' '}
                  {formatBytes(pending.prepared.blob.size)}
                  {pending.prepared.blob.size < pending.file.size && (
                    <span className="text-green-700"> (was {formatBytes(pending.file.size)})</span>
                  )}
                </p>
                <p className="text-gray-500">{pending.original ? 'Original shape kept' : `Cropped to ${shapeLabel(aspect)} for this spot`}</p>
              </div>
            </div>

            {!pending.original && aspect && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-gray-500 inline-flex items-center gap-1"><Crop className="w-3 h-3" /> Keep</span>
                {(['top', 'center', 'bottom'] as Focus[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    disabled={busy}
                    onClick={() => startTransition(async () => reprepare(pending.file, f, false))}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${pending.focus === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}
                  >
                    {f}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startTransition(async () => reprepare(pending.file, pending.focus, true))}
                  className="px-2 py-0.5 rounded text-[11px] font-medium border bg-white text-gray-600 border-gray-200 hover:border-primary"
                >
                  don&apos;t crop
                </button>
              </div>
            )}

            {progress !== null && (
              <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-2 transition-all" style={{ width: `${Math.round(progress)}%` }} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onUpload} disabled={busy} className="gap-1.5">
                {busy && progress !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {progress !== null ? `Uploading ${Math.round(progress)}%` : 'Use this image'}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelPending} disabled={busy} className="gap-1">
                <X className="w-3.5 h-3.5" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-600 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Replace image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <span className="text-[11px] text-gray-400">
              Any size - it is resized to {maxWidth}px{aspect ? ` and cropped to ${shapeLabel(aspect)}` : ''} before upload.
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
