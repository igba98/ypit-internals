'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Paperclip, X, FileText, Image as ImageIcon, File } from 'lucide-react';

const ACCEPT =
  'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.doc,.docx,.xls,.xlsx';

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB raw; base64 ~4MB, server-action body cap is 5MB (next.config.ts)

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function iconFor(contentType: string) {
  if (contentType.startsWith('image/')) return ImageIcon;
  if (contentType === 'application/pdf' || contentType.includes('officedocument') || contentType.includes('ms-')) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  /** name prefix for hidden inputs — produces `${name}Url`, `${name}Filename`, `${name}ContentType` */
  name?: string;
  label?: string;
}

export function AttachmentField({ name = 'receipt', label = 'Receipt / proof of payment' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string>('');
  const [contentType, setContentType] = useState<string>('');
  const [size, setSize] = useState<number>(0);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const Icon = contentType ? iconFor(contentType) : Paperclip;

  const reset = () => {
    setFilename('');
    setContentType('');
    setSize(0);
    setDataUrl('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error(`File too large — max ${formatSize(MAX_BYTES)}. Compress and try again.`);
      reset();
      return;
    }
    setBusy(true);
    try {
      const url = await readAsDataUrl(file);
      setDataUrl(url);
      setFilename(file.name);
      setContentType(file.type || 'application/octet-stream');
      setSize(file.size);
    } catch {
      toast.error('Could not read file.');
      reset();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      {/* Hidden inputs carry the data into the form action */}
      <input type="hidden" name={`${name}Url`} value={dataUrl} />
      <input type="hidden" name={`${name}Filename`} value={filename} />
      <input type="hidden" name={`${name}ContentType`} value={contentType} />

      {!dataUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary hover:text-primary hover:bg-primary-muted/40 transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-4 h-4" />
          {busy ? 'Reading file…' : 'Attach receipt / document'}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
          <span className="w-9 h-9 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-600 shrink-0">
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
            <p className="text-[11px] text-gray-500">{formatSize(size)} · {contentType || 'unknown'}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-7 h-7 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-500"
            aria-label="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      <p className="text-[11px] text-gray-400">
        Images, PDF, Word, Excel. Max {formatSize(MAX_BYTES)}.
      </p>
    </div>
  );
}
