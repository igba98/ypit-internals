'use client';

import { useState } from 'react';
import { Document } from '@/types';
import { getDocumentsByStudentId } from '@/lib/mock/mockDocuments';
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
import { Download, CheckCircle, Trash2, FileText, Upload } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DocumentUploadModal } from './DocumentUploadModal';

interface DocumentManagementProps {
  studentId: string;
}

export function DocumentManagement({ studentId }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<Document[]>(getDocumentsByStudentId(studentId));
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    // In a real app, this would be an API call
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const handleVerify = (id: string) => {
    // In a real app, this would be an API call
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, verified: true } : doc
    ));
  };

  const handleUpload = (newDoc: Omit<Document, 'id' | 'uploadedAt' | 'uploadedBy' | 'verified'>) => {
    const document: Document = {
      ...newDoc,
      id: `doc_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User', // Should come from session
      verified: false,
    };

    setDocuments([...documents, document]);
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
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No documents uploaded yet.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-50">
                      {doc.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900">{formatDate(doc.uploadedAt)}</span>
                      <span className="text-xs text-gray-500">by {doc.uploadedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.verified ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Verified</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={doc.url} download target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Download">
                        <Download className="w-4 h-4 text-gray-600" />
                      </a>
                      {!doc.verified && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Verify"
                          onClick={() => handleVerify(doc.id)}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DocumentUploadModal
        studentId={studentId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
