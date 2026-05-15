'use client';

import { Document, Role } from '@/types';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatDate, cn } from '@/lib/utils';
import { canEdit } from '@/lib/statusOptions';
import { setDocumentVerification } from '@/lib/actions/documentActions';
import {
  BookOpen,
  Award,
  Image as ImageIcon,
  FileText,
  Plane,
  Wallet,
  UserCheck,
  File as FileIcon,
  CheckCircle2,
  Clock,
  Upload,
  Download,
  StickyNote,
  Loader2,
} from 'lucide-react';

interface DocumentsTabProps {
  documents: Document[];
  userRole: Role;
}

function VerificationToggle({ doc, editable }: { doc: Document; editable: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    if (!editable || isPending) return;
    startTransition(async () => {
      const result = await setDocumentVerification(doc.id, !doc.verified);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const pill = (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold backdrop-blur-sm transition',
      editable && !isPending && 'cursor-pointer hover:bg-white/30',
      isPending && 'opacity-60',
    )}>
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : doc.verified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {doc.verified ? 'Verified' : 'Pending'}
    </span>
  );

  if (!editable) return pill;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={doc.verified ? 'Mark as pending' : 'Mark as verified'}
      aria-label={doc.verified ? `Mark ${doc.name} as pending` : `Mark ${doc.name} as verified`}
    >
      {pill}
    </button>
  );
}

const DOC_META: Record<Document['type'], { label: string; icon: React.ElementType; accent: string; chip: string }> = {
  PASSPORT: { label: 'Passport', icon: BookOpen, accent: 'from-blue-500 to-blue-700', chip: 'bg-blue-50 text-blue-700 border-blue-100' },
  TRANSCRIPT: { label: 'Transcript', icon: FileText, accent: 'from-purple-500 to-purple-700', chip: 'bg-purple-50 text-purple-700 border-purple-100' },
  CERTIFICATE: { label: 'Certificate', icon: Award, accent: 'from-amber-500 to-amber-700', chip: 'bg-amber-50 text-amber-700 border-amber-100' },
  OFFER_LETTER: { label: 'Offer Letter', icon: Award, accent: 'from-green-500 to-green-700', chip: 'bg-green-50 text-green-700 border-green-100' },
  VISA: { label: 'Visa', icon: Plane, accent: 'from-primary to-primary-dark', chip: 'bg-primary-muted text-primary border-primary/20' },
  BANK_STATEMENT: { label: 'Bank Statement', icon: Wallet, accent: 'from-emerald-500 to-emerald-700', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  PHOTO: { label: 'Photo', icon: ImageIcon, accent: 'from-pink-500 to-pink-700', chip: 'bg-pink-50 text-pink-700 border-pink-100' },
  REFERENCE_LETTER: { label: 'Reference', icon: UserCheck, accent: 'from-indigo-500 to-indigo-700', chip: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  OTHER: { label: 'Other', icon: FileIcon, accent: 'from-gray-500 to-gray-700', chip: 'bg-gray-50 text-gray-700 border-gray-200' },
};

export function DocumentsTab({ documents, userRole }: DocumentsTabProps) {
  const total = documents.length;
  const verified = documents.filter(d => d.verified).length;
  const pending = total - verified;
  const editable = canEdit('documentVerified', userRole);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Upload className="w-7 h-7 text-gray-400" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">No documents uploaded</h4>
        <p className="text-xs text-gray-500 mt-1">Documents like passport, transcripts and visas will appear here once uploaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-100 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="rounded-lg border border-green-100 bg-green-50/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-green-700">Verified</p>
          <p className="text-xl font-bold text-green-700 mt-1">{verified}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-700">Pending</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{pending}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => {
          const meta = DOC_META[doc.type] ?? DOC_META.OTHER;
          const Icon = meta.icon;
          return (
            <div key={doc.id} className="rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-card-hover transition-shadow">
              <div className={`bg-gradient-to-br ${meta.accent} px-4 py-5 text-white flex items-center justify-between`}>
                <Icon className="w-7 h-7 opacity-90" />
                <VerificationToggle doc={doc} editable={editable} />
              </div>
              <div className="p-4">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.chip}`}>{meta.label}</span>
                <p className="text-sm font-semibold text-gray-900 mt-2 truncate" title={doc.name}>{doc.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Uploaded {formatDate(doc.uploadedAt)} by {doc.uploadedBy}
                </p>

                {doc.notes && (
                  <div className="mt-3 rounded-md bg-amber-50/60 border border-amber-100 px-2.5 py-2 flex items-start gap-2">
                    <StickyNote className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-900 leading-relaxed">{doc.notes}</p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-end pt-3 border-t border-gray-100">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
