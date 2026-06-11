import { notFound } from 'next/navigation';
import { backendFetch } from '@/lib/backend';
import { PreAdmissionNotice } from '@/types';
import { formatDate } from '@/lib/utils';
import { PrintButton } from '../../invoice/[id]/_components/PrintButton';

export const metadata = {
  title: 'Pre-Admission Notice · YPIT',
};

async function loadNotice(id: string): Promise<PreAdmissionNotice | null> {
  try {
    const res = await backendFetch(`/letters/notices/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as PreAdmissionNotice;
  } catch {
    return null;
  }
}

export default async function NoticePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await loadNotice(id);
  if (!notice) notFound();

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-[820px] mx-auto px-4 py-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Pre-Admission Notice</p>
            <p className="text-sm text-gray-700">
              {notice.noticeNumber} · {notice.studentName} · {formatDate(notice.createdAt)}
            </p>
          </div>
          <PrintButton />
        </div>

        <article
          className="bg-white shadow-md print:shadow-none border border-gray-200 print:border-0 rounded-lg print:rounded-none p-10 print:p-12 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: notice.renderedHtml }}
        />
      </div>
    </div>
  );
}
