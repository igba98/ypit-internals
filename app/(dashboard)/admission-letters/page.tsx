import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { backendFetch } from '@/lib/backend';
import {
  LetterTemplate,
  PreAdmissionNoticeRow,
  Session,
  Student,
} from '@/types';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, ExternalLink, Mail, MessageCircle, XCircle } from 'lucide-react';
import { TemplatesSection } from './_components/TemplatesSection';
import { GenerateNoticeButton, NoticeStudent } from './_components/GenerateNoticeButton';

async function load(): Promise<{
  templates: LetterTemplate[];
  notices: PreAdmissionNoticeRow[];
  students: NoticeStudent[];
  error: string | null;
}> {
  try {
    const [tplRes, noticeRes, studentRes] = await Promise.all([
      backendFetch('/letters/templates'),
      backendFetch('/letters/notices'),
      backendFetch('/students?limit=500'),
    ]);
    if (!tplRes.ok) {
      return { templates: [], notices: [], students: [], error: `Failed to load templates (HTTP ${tplRes.status})` };
    }
    const templates = ((await tplRes.json()) as { items: LetterTemplate[] }).items ?? [];
    const notices = noticeRes.ok
      ? ((await noticeRes.json()) as { items: PreAdmissionNoticeRow[] }).items ?? []
      : [];
    const studentsRaw = studentRes.ok
      ? ((await studentRes.json()) as { items: Student[] }).items ?? []
      : [];
    const students: NoticeStudent[] = studentsRaw.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      registrationNumber: s.registrationNumber,
      nationality: s.nationality,
      passportNumber: s.passportNumber ?? '',
      gender: s.gender,
      targetProgram: s.targetProgram ?? '',
      phone: s.phone ?? '',
      dateOfBirth: s.dateOfBirth ?? '',
      email: s.email ?? '',
    }));
    return { templates, notices, students, error: null };
  } catch {
    return { templates: [], notices: [], students: [], error: 'Unable to reach the backend.' };
  }
}

export default async function AdmissionLettersPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;

  const allowedRoles = ['ADMISSIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'OPERATIONS'];
  if (!allowedRoles.includes(session.role)) redirect('/dashboard');
  const canEdit = ['ADMISSIONS', 'MANAGING_DIRECTOR'].includes(session.role);

  const { templates, notices, students, error } = await load();
  const activeTemplate = templates.find((t) => t.isActive) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admission Letters"
        description="Pre-admission notice templates and the letters generated from them."
        actions={
          canEdit ? (
            <GenerateNoticeButton students={students} hasActiveTemplate={!!activeTemplate} />
          ) : undefined
        }
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <TemplatesSection templates={templates} canEdit={canEdit} />

      <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Generated Notices</h3>
          <span className="text-xs text-gray-500">{notices.length} letters</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Notice</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notices.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-gray-900">{n.noticeNumber}</p>
                    <p className="text-[11px] text-gray-500">
                      {formatDate(n.createdAt)} · by {n.createdByName}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-900">{n.studentName}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{n.templateName}</td>
                  <td className="px-4 py-3.5">
                    {n.emailSentAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sent to {n.emailTo}
                      </span>
                    ) : n.emailError ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600" title={n.emailError}>
                        <XCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {n.whatsappQueued ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <MessageCircle className="w-3.5 h-3.5" /> Queued
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/print/notice/${n.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-light"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {notices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No notices generated yet.
                    {activeTemplate
                      ? ' Click "Generate Notice" to issue the first one.'
                      : ' Create and activate a template first.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
