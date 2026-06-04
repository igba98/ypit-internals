'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Document } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DocumentUploadModal } from './DocumentUploadModal';
import {
  deleteDocument,
  getDocumentDownloadUrl,
  listStudentDocuments,
  rejectDocument,
  verifyDocument,
} from '@/lib/actions/documentActions';

interface DocumentManagementProps {
  studentId: string;
  initialDocuments: Document[];
}

function StatusBadge({ doc }: { doc: Document }) {
  if (doc.status === 'VERIFIED' || doc.verified) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Verified</Badge>;
  }
  if (doc.status === 'REJECTED') {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Rejected</Badge>;
  }
  if (doc.status === 'UPLOADING') {
    return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">Uploading</Badge>;
  }
  return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">Pending review</Badge>;
}

export function DocumentManagement({ studentId, initialDocuments }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const docs = await listStudentDocuments(studentId);
    setDocuments(docs);
    setLoading(false);
  }, [studentId]);

  const handleDownload = async (doc: Document) => {
    setBusyId(doc.id);
    const res = await getDocumentDownloadUrl(doc.id);
    setBusyId(null);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    window.open(res.url, '_blank', 'noopener,noreferrer');
  };

  const handleVerify = async (doc: Document) => {
    setBusyId(doc.id);
    const res = await verifyDocument(doc.id, studentId);
    setBusyId(null);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    refresh();
  };

  const handleReject = async (doc: Document) => {
    const reason = window.prompt(`Reject "${doc.name}" — what's the reason?`);
    if (!reason || !reason.trim()) return;
    setBusyId(doc.id);
    const res = await rejectDocument(doc.id, studentId, reason.trim());
    setBusyId(null);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    refresh();
  };

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Delete "${doc.name}"? This removes the file from storage too.`)) return;
    setBusyId(doc.id);
    const res = await deleteDocument(doc.id, studentId);
    setBusyId(null);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-urbanist text-gray-900">Required Documents</h2>
        <Button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
                  Loading documents...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No documents uploaded yet.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => {
                const busy = busyId === doc.id;
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{doc.name}</span>
                          {doc.sizeBytes && (
                            <span className="text-[11px] text-gray-500">
                              {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50">
                        {doc.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{formatDate(doc.uploadedAt)}</span>
                        <span className="text-xs text-gray-500">by {doc.uploadedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <StatusBadge doc={doc} />
                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <span className="text-[11px] text-red-600">{doc.rejectionReason}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download"
                          onClick={() => handleDownload(doc)}
                          disabled={busy || doc.status === 'UPLOADING'}
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-gray-600" />}
                        </Button>
                        {doc.status !== 'VERIFIED' && doc.status !== 'UPLOADING' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Verify"
                            onClick={() => handleVerify(doc)}
                            disabled={busy}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {doc.status !== 'REJECTED' && doc.status !== 'UPLOADING' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reject"
                            onClick={() => handleReject(doc)}
                            disabled={busy}
                          >
                            <XCircle className="w-4 h-4 text-amber-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => handleDelete(doc)}
                          disabled={busy}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DocumentUploadModal
        studentId={studentId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={() => {
          setIsUploadModalOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
