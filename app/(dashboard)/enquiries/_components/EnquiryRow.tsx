'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EnquiryStatus, EnquiryType, WebsiteEnquiry } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Archive,
  UserPlus,
  Loader2,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  convertEnquiryToLead,
  updateEnquiryStatus,
} from '@/lib/actions/enquiryActions';

const TYPE_BADGE: Record<EnquiryType, string> = {
  CONTACT: 'bg-blue-50 text-blue-700',
  BOOKING: 'bg-purple-50 text-purple-700',
  APPLICATION: 'bg-emerald-50 text-emerald-700',
};

const STATUS_BADGE: Record<EnquiryStatus, string> = {
  NEW: 'bg-amber-100 text-amber-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  CONVERTED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export function EnquiryRow({ enquiry }: { enquiry: WebsiteEnquiry }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const act = (fn: () => Promise<{ success: boolean; message: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const isConverted = enquiry.status === 'CONVERTED';

  return (
    <>
      <tr className={`hover:bg-gray-50/60 transition-colors ${enquiry.status === 'NEW' ? 'bg-amber-50/30' : ''}`}>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen((v) => !v)} className="text-gray-400 hover:text-gray-700">
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div>
              <p className="font-semibold text-gray-900">{enquiry.fullName}</p>
              <p className="text-[11px] text-gray-500 font-mono">{enquiry.reference}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${TYPE_BADGE[enquiry.type]}`}>
            {enquiry.type}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <p className="text-sm text-gray-900 max-w-[220px] truncate" title={enquiry.topic ?? ''}>
            {enquiry.topic ?? '—'}
          </p>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
            <a href={`mailto:${enquiry.email}`} className="inline-flex items-center gap-1 hover:text-primary">
              <Mail className="w-3 h-3" /> {enquiry.email}
            </a>
            {enquiry.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" /> {enquiry.phone}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(enquiry.createdAt)}</td>
        <td className="px-4 py-3.5">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[enquiry.status]}`}>
            {enquiry.status}
          </span>
        </td>
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {enquiry.status === 'NEW' && (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => act(() => updateEnquiryStatus(enquiry.id, 'CONTACTED'))} className="gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Contacted
              </Button>
            )}
            {!isConverted && (
              <Button size="sm" disabled={busy} onClick={() => act(() => convertEnquiryToLead(enquiry.id))} className="gap-1">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Convert
              </Button>
            )}
            {enquiry.status !== 'ARCHIVED' && !isConverted && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => act(() => updateEnquiryStatus(enquiry.id, 'ARCHIVED'))} title="Archive" className="text-gray-500">
                <Archive className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50/50">
          <td colSpan={6} className="px-12 py-4">
            <div className="text-sm text-gray-700 space-y-2">
              {enquiry.message && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Message</p>
                  <p className="whitespace-pre-wrap mt-0.5">{enquiry.message}</p>
                </div>
              )}
              {enquiry.preferredDate && (
                <p><span className="text-gray-500">Preferred:</span> {enquiry.preferredDate}</p>
              )}
              {enquiry.interestedCountry && (
                <p><span className="text-gray-500">Country:</span> {enquiry.interestedCountry}</p>
              )}
              {enquiry.handledByName && (
                <p className="text-[11px] text-gray-500">Handled by {enquiry.handledByName}</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
