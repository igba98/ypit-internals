'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DocumentType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  File as FileIcon,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  finalizeDocumentUpload,
  requestDocumentUploadUrl,
} from '@/lib/actions/documentActions';

interface DocumentUploadModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'PASSPORT',
  'TRANSCRIPT',
  'CERTIFICATE',
  'OFFER_LETTER',
  'VISA',
  'BANK_STATEMENT',
  'PHOTO',
  'REFERENCE_LETTER',
  'OTHER',
];

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB - backend cap

export function DocumentUploadModal({
  studentId,
  isOpen,
  onClose,
  onUploaded,
}: DocumentUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('PASSPORT');
  const [progress, setProgress] = useState<{ phase: string; pct?: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setDocType('PASSPORT');
    setProgress(null);
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    if (selectedFile.size > MAX_BYTES) {
      toast.error(`File is ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB - max is 25 MB.`);
      return;
    }

    setProgress({ phase: 'Requesting upload URL' });
    const ticketRes = await requestDocumentUploadUrl({
      studentId,
      type: docType,
      originalName: selectedFile.name,
      mimeType: selectedFile.type || 'application/octet-stream',
      sizeBytes: selectedFile.size,
    });
    if (!ticketRes.success || !ticketRes.ticket) {
      setProgress(null);
      toast.error(ticketRes.message);
      return;
    }
    const ticket = ticketRes.ticket;

    setProgress({ phase: 'Uploading to storage', pct: 0 });
    const uploaded = await putToR2(ticket.uploadUrl, selectedFile, (pct) =>
      setProgress({ phase: 'Uploading to storage', pct }),
    );
    if (!uploaded.ok) {
      setProgress(null);
      toast.error(`Upload failed (${uploaded.status})`);
      return;
    }

    setProgress({ phase: 'Finalizing' });
    const finalize = await finalizeDocumentUpload(ticket.documentId, studentId);
    setProgress(null);
    if (!finalize.success) {
      toast.error(finalize.message);
      return;
    }
    toast.success('Document uploaded.');
    reset();
    onUploaded();
  };

  const onButtonClick = () => inputRef.current?.click();

  const handleOpenChange = (open: boolean) => {
    if (!open && !progress) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Files go directly to Cloudflare R2. Max 25 MB. PDF, images, or Office documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <Select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              disabled={!!progress}
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={handleChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC, XLS (max 25 MB)</p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-white border border-gray-200 rounded-md">
                    <FileIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  disabled={!!progress}
                  className="shrink-0 text-gray-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {progress && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-blue-900">
                  <span className="font-medium flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {progress.phase}
                  </span>
                  {progress.pct !== undefined && <span>{Math.round(progress.pct)}%</span>}
                </div>
                {progress.pct !== undefined && (
                  <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${progress.pct}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={!!progress}>
            Cancel
          </Button>
          <Button onClick={handleUploadClick} disabled={!selectedFile || !!progress}>
            {progress ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Direct browser → R2 upload via the presigned PUT URL.
 * Uses XHR so we can report progress (fetch() has no native progress).
 */
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
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status });
    xhr.onerror = () => resolve({ ok: false, status: xhr.status || 0 });
    xhr.send(file);
  });
}
