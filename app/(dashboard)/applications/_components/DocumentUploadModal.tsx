'use client';

import { useState, useCallback, useRef } from 'react';
import { Document } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import { Select } from '@/components/ui/select';

interface DocumentUploadModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpload: (doc: Omit<Document, 'id' | 'uploadedAt' | 'uploadedBy' | 'verified'>) => void;
}

const DOCUMENT_TYPES = [
  'PASSPORT',
  'TRANSCRIPT',
  'CERTIFICATE',
  'OFFER_LETTER',
  'VISA',
  'BANK_STATEMENT',
  'PHOTO',
  'REFERENCE_LETTER',
  'OTHER'
];

export function DocumentUploadModal({ studentId, isOpen, onClose, onUpload }: DocumentUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('PASSPORT');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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

  const handleUploadClick = () => {
    if (!selectedFile) return;

    onUpload({
      studentId,
      type: docType as Document['type'],
      name: selectedFile.name,
      url: URL.createObjectURL(selectedFile), // Create local URL for mock purposes
    });

    // Reset
    setSelectedFile(null);
    setDocType('PASSPORT');
    onClose();
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document for this student. Supported formats: PDF, JPG, PNG.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOCUMENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
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
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG or PNG (max. 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-white border border-gray-200 rounded-md">
                    <FileIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  className="shrink-0 text-gray-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUploadClick} disabled={!selectedFile}>
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
