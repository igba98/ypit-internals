'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Paperclip, X, FileText, Image as ImageIcon, File } from 'lucide-react';

const ACCEPT =
  'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.doc,.docx,.xls,.xlsx';
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_FILES = 5;

function iconFor(contentType: string) {
  if (contentType.startsWith('image/')) return ImageIcon;
  if (contentType === 'application/pdf' || contentType.includes('officedocument') || contentType.includes('ms-'))
    return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface Slot {
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

interface Props {
  name: string;
  label: string;
  helperText?: string;
}

export function MultiAttachmentField({ name, label, helperText }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const next: Slot[] = [...slots];
      for (const file of Array.from(files)) {
        if (next.length >= MAX_FILES) {
          toast.warning(`Max ${MAX_FILES} files. Skipping ${file.name}.`);
          break;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is too large - max ${formatSize(MAX_BYTES)}.`);
          continue;
        }
        const url = await readAsDataUrl(file);
        next.push({
          url,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
        });
      }
      setSlots(next);
    } catch {
      toast.error('Could not read one or more files.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx: number) => setSlots((s) => s.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      {slots.map((slot, i) => {
        const Icon = iconFor(slot.contentType);
        return (
          <div key={i}>
            <input type="hidden" name={`${name}_${i}_Url`} value={slot.url} />
            <input type="hidden" name={`${name}_${i}_Filename`} value={slot.filename} />
            <input type="hidden" name={`${name}_${i}_ContentType`} value={slot.contentType} />
            <input type="hidden" name={`${name}_${i}_Size`} value={String(slot.size)} />
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
              <span className="w-9 h-9 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{slot.filename}</p>
                <p className="text-[11px] text-gray-500">
                  {formatSize(slot.size)} · {slot.contentType || 'unknown'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="w-7 h-7 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-500"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {slots.length < MAX_FILES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary hover:text-primary hover:bg-primary-muted/40 transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-4 h-4" />
          {busy ? 'Reading file…' : slots.length === 0 ? 'Attach file(s)' : 'Add another'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <p className="text-[11px] text-gray-400">
        {helperText ?? `Images, PDF, Word, Excel. Up to ${MAX_FILES} files, max ${formatSize(MAX_BYTES)} each.`}
      </p>
    </div>
  );
}
