'use client';

import { Application, Role } from '@/types';
import { formatDate } from '@/lib/utils';
import { StatusSelect } from '@/components/shared/StatusSelect';
import { APPLICATION_STATUS_OPTIONS, canEdit } from '@/lib/statusOptions';
import { updateApplicationStatus } from '@/lib/actions/applicationActions';
import {
  GraduationCap,
  MapPin,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ExternalLink,
  Award,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface ApplicationTabProps {
  application: Application | null;
  userRole: Role;
}

const STATUS_META: Record<Application['status'], { label: string; bg: string; text: string; icon: React.ElementType }> = {
  PREPARING: { label: 'Preparing', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', icon: Layers },
  SUBMITTED: { label: 'Submitted', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: FileText },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
  ACCEPTED: { label: 'Accepted', bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: XCircle },
  WAITLISTED: { label: 'Waitlisted', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: AlertTriangle },
  DEFERRED: { label: 'Deferred', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', icon: Clock },
};

const STAGES = ['PREPARING', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED'] as const;

function StageTrack({ current }: { current: Application['status'] }) {
  // Special handling for rejected/waitlisted - show their own segment.
  const currentIdx = STAGES.includes(current as typeof STAGES[number])
    ? STAGES.indexOf(current as typeof STAGES[number])
    : current === 'REJECTED' || current === 'WAITLISTED' || current === 'DEFERRED'
      ? 2 /* sat at review */
      : 0;

  return (
    <div className="flex items-center w-full">
      {STAGES.map((s, i) => {
        const meta = STATUS_META[s];
        const done = i < currentIdx;
        const here = i === currentIdx;
        const Icon = meta.icon;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${done ? 'bg-green-500 border-green-500 text-white' : here ? 'bg-primary border-primary text-white shadow-primary-glow' : 'bg-white border-gray-200 text-gray-300'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className={`text-[10px] font-medium mt-1.5 whitespace-nowrap ${here ? 'text-primary' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                {meta.label}
              </p>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ApplicationTab({ application, userRole }: ApplicationTabProps) {
  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <FileText className="w-7 h-7 text-gray-400" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">No application started</h4>
        <p className="text-xs text-gray-500 mt-1">Admissions will create an application once the student completes counseling and pays the agency fee.</p>
      </div>
    );
  }

  const editable = canEdit('applicationStatus', userRole);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-muted via-white to-white p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shadow-primary-glow shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-urbanist">{application.university}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {application.country}</span>
                  <span className="text-gray-300">•</span>
                  <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {application.program}</span>
                </div>
              </div>
            </div>

            <StatusSelect
              value={application.status}
              options={APPLICATION_STATUS_OPTIONS}
              action={next => updateApplicationStatus(application.id, next)}
              editable={editable}
            />
          </div>

          <div className="mt-6">
            <StageTrack current={application.status} />
          </div>
        </div>
      </div>

      {/* Key details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-gray-100 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Level</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{application.level.charAt(0) + application.level.slice(1).toLowerCase()}</p>
        </div>
        <div className="rounded-lg border border-gray-100 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Intake</p>
          <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {application.intake}</p>
        </div>
        <div className="rounded-lg border border-gray-100 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Submitted</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{application.submissionDate ? formatDate(application.submissionDate) : '-'}</p>
        </div>
        <div className="rounded-lg border border-gray-100 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Decision</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{application.decisionDate ? formatDate(application.decisionDate) : <span className="text-gray-400">Pending</span>}</p>
        </div>
      </div>

      {/* Offer documents */}
      {(application.offerLetterUrl || application.conditionsUrl) && (
        <section>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Offer Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {application.offerLetterUrl && (
              <a href={application.offerLetterUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 p-4 rounded-lg border border-green-200 bg-green-50/40 hover:bg-green-50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-green-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Offer Letter</p>
                    <p className="text-[11px] text-gray-500">Issued by {application.university}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-700" />
              </a>
            )}
            {application.conditionsUrl && (
              <a href={application.conditionsUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Conditions Document</p>
                    <p className="text-[11px] text-gray-500">Outstanding requirements</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-700" />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Notes */}
      {application.decisionNotes && (
        <section className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Admissions Note</p>
          <p className="text-sm text-gray-700 leading-relaxed">{application.decisionNotes}</p>
        </section>
      )}
    </div>
  );
}
