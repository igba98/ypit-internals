import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Session } from '@/types';
import { CMS_SECTIONS, ALL_CMS_SLOTS } from '@/lib/cms-slots';
import { listSiteContent } from '@/lib/actions/siteContentActions';
import { Globe, Image as ImageIcon, Type, Info } from 'lucide-react';
import { SlotEditor } from './_components/SlotEditor';

const ALLOWED = ['IT_ADMIN', 'MANAGING_DIRECTOR'];

export default async function WebsiteCmsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!ALLOWED.includes(session.role)) redirect('/dashboard');

  const rows = await listSiteContent();
  const byKey = new Map(rows.map((r) => [r.key, r]));

  const customised = ALL_CMS_SLOTS.filter((s) => byKey.has(s.key)).length;
  const imageSlots = ALL_CMS_SLOTS.filter((s) => s.type === 'IMAGE').length;
  const textSlots = ALL_CMS_SLOTS.length - imageSlots;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Content"
        description="Change the photos and wording on the public website. Anything you don't touch keeps its current design."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Editable slots" value={ALL_CMS_SLOTS.length} icon={Globe} />
        <KPICard label="Images / Text" value={`${imageSlots} / ${textSlots}`} icon={ImageIcon} />
        <KPICard label="Customised" value={customised} icon={Type} />
      </div>

      <p className="text-sm text-blue-900 bg-blue-50/70 border border-blue-100 rounded-lg px-3 py-2 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Changes appear on the public site within about a minute. Every slot has
          a <b>Reset</b> that puts the original design back, so nothing here can
          permanently break the site. Images should be landscape and under 8&nbsp;MB.
        </span>
      </p>

      {CMS_SECTIONS.map((section) => (
        <section
          key={section.id}
          className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                {section.page}
              </span>
              <h2 className="font-semibold text-gray-900">{section.title}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">{section.description}</p>
          </div>

          <div className="divide-y divide-gray-100">
            {section.slots.map((slot) => (
              <SlotEditor
                key={slot.key}
                slot={slot}
                current={byKey.get(slot.key) ?? null}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
