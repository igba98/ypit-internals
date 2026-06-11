'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ActionResult, LetterTemplate } from '@/types';
import { formatDate } from '@/lib/utils';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  BadgeCheck,
  Eye,
  FileUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  activateLetterTemplate,
  createLetterTemplate,
  deleteLetterTemplate,
  importWordTemplate,
  updateLetterTemplate,
} from '@/lib/actions/letterActions';

const PLACEHOLDERS = [
  'fullName',
  'nationality',
  'passportNo',
  'gender',
  'courseInterested',
  'contactNumber',
  'fatherName',
  'motherName',
  'parentContact',
  'dateOfBirth',
  'address',
  'date',
  'noticeNumber',
  'registrationNumber',
  'targetUniversity',
  'targetCountry',
];

const SAMPLE_DATA: Record<string, string> = {
  fullname: 'Erick Elisha',
  nationality: 'Tanzanian',
  passportno: 'TZ1234567',
  gender: 'Male',
  courseinterested: 'BSc Computer Science',
  contactnumber: '+255 712 000 000',
  fathername: 'Elisha Mwakasege',
  mothername: 'Anna Mwakasege',
  parentcontact: '+255 713 000 000',
  dateofbirth: '12 March 2004',
  address: 'Mbezi Beach, Dar es Salaam',
  date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  noticenumber: 'PAN-2026-0001',
  registrationnumber: 'YP-2026-001',
  targetuniversity: 'University of Leeds',
  targetcountry: 'United Kingdom',
};

function renderPreview(body: string): string {
  return body.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, token: string) => {
    const key = token.toLowerCase().replace(/[\s_-]/g, '');
    return SAMPLE_DATA[key] ?? '';
  });
}

type PanelMode =
  | { kind: 'closed' }
  | { kind: 'new' }
  | { kind: 'import' }
  | { kind: 'edit'; template: LetterTemplate }
  | { kind: 'view'; template: LetterTemplate };

export function TemplatesSection({
  templates,
  canEdit,
}: {
  templates: LetterTemplate[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<PanelMode>({ kind: 'closed' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const close = () => setPanel({ kind: 'closed' });

  const onActivate = (t: LetterTemplate) => {
    setBusyId(t.id);
    startTransition(async () => {
      const res = await activateLetterTemplate(t.id);
      setBusyId(null);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  };

  const onDelete = (t: LetterTemplate) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    setBusyId(t.id);
    startTransition(async () => {
      const res = await deleteLetterTemplate(t.id);
      setBusyId(null);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <section className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Letter Templates</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            The template marked <strong>In Use</strong> is what every new notice renders with.
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPanel({ kind: 'import' })} className="gap-1.5">
              <FileUp className="w-3.5 h-3.5" /> Import Word
            </Button>
            <Button size="sm" onClick={() => setPanel({ kind: 'new' })} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Template
            </Button>
          </div>
        )}
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-gray-500 px-5 py-10 text-center">
          No templates yet. Create one or import a Word document - use placeholders like{' '}
          <code className="bg-gray-100 px-1 rounded">{'{{fullName}}'}</code> where student details should go.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {templates.map((t) => (
            <li key={t.id} className="px-5 py-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{t.name}</p>
                  {t.isActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                      <BadgeCheck className="w-3 h-3" /> In Use
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {t.description ?? 'No description'} · updated {formatDate(t.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setPanel({ kind: 'view', template: t })} className="gap-1">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Button>
                {canEdit && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setPanel({ kind: 'edit', template: t })} className="gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    {!t.isActive && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onActivate(t)}
                          disabled={busyId === t.id}
                          className="gap-1"
                        >
                          {busyId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                          Use This
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(t)}
                          disabled={busyId === t.id}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* New / Edit */}
      <SlideInPanel
        isOpen={panel.kind === 'new' || panel.kind === 'edit'}
        onClose={close}
        title={panel.kind === 'edit' ? `Edit · ${panel.template.name}` : 'New Letter Template'}
        description="HTML body - drop {{placeholders}} where student details should appear."
      >
        <TemplateForm
          template={panel.kind === 'edit' ? panel.template : null}
          onSuccess={close}
        />
      </SlideInPanel>

      {/* Import Word */}
      <SlideInPanel
        isOpen={panel.kind === 'import'}
        onClose={close}
        title="Import Word Document"
        description="Upload a .docx - it's converted to an editable template. Placeholders typed in Word like {{fullName}} keep working."
      >
        <ImportForm onSuccess={close} />
      </SlideInPanel>

      {/* Preview */}
      <SlideInPanel
        isOpen={panel.kind === 'view'}
        onClose={close}
        title={panel.kind === 'view' ? `Preview · ${panel.template.name}` : 'Preview'}
        description="Rendered with sample student data."
      >
        {panel.kind === 'view' && (
          <div
            className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-6 bg-white"
            dangerouslySetInnerHTML={{ __html: renderPreview(panel.template.body) }}
          />
        )}
      </SlideInPanel>
    </section>
  );
}

function TemplateForm({
  template,
  onSuccess,
}: {
  template: LetterTemplate | null;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [body, setBody] = useState(template?.body ?? DEFAULT_TEMPLATE);
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> =>
      template
        ? updateLetterTemplate(template.id, _prev, formData)
        : createLetterTemplate(_prev, formData),
    null,
  );
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router, onSuccess]);

  const insertPlaceholder = (p: string) => {
    setBody((b) => `${b}{{${p}}}`);
  };

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name *</Label>
        <Input id="name" name="name" defaultValue={template?.name ?? ''} placeholder="e.g. Pre-Admission Notice v1" required />
        {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" defaultValue={template?.description ?? ''} placeholder="Short note about this version" />
      </div>

      <div className="space-y-2">
        <Label>Placeholders - click to insert</Label>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => insertPlaceholder(p)}
              className="px-2 py-0.5 rounded bg-gray-100 hover:bg-primary hover:text-white text-[11px] font-mono transition-colors"
            >
              {`{{${p}}}`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">Letter Body (HTML) *</Label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {showPreview ? 'Back to editor' : 'Preview with sample data'}
          </button>
        </div>
        {showPreview ? (
          <div
            className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-6 bg-white min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: renderPreview(body) }}
          />
        ) : (
          <Textarea
            id="body"
            name="body"
            rows={16}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            className="font-mono text-xs"
          />
        )}
        {/* keep the body in the form data even while previewing */}
        {showPreview && <input type="hidden" name="body" value={body} />}
        {errors.body && <p className="text-xs text-red-600">{errors.body[0]}</p>}
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}

function ImportForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(importWordTemplate, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name *</Label>
        <Input id="name" name="name" placeholder="e.g. Pre-Admission Notice (official)" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Word Document (.docx) *</Label>
        <Input id="file" name="file" type="file" accept=".docx" required />
        <p className="text-[11px] text-gray-500">
          Type placeholders directly in Word - e.g. <code className="bg-gray-100 px-1 rounded">{'{{fullName}}'}</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">{'{{gender}}'}</code> - they survive the conversion.
          You can also add them after import via Edit.
        </p>
      </div>
      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Converting...' : 'Import'}
        </Button>
      </div>
    </form>
  );
}

const DEFAULT_TEMPLATE = `<div style="font-family: Georgia, serif; line-height: 1.6;">
  <h2 style="text-align:center;">YPIT CONSULTANCIES</h2>
  <h3 style="text-align:center;">PRE-ADMISSION NOTICE</h3>
  <p style="text-align:right;">Ref: {{noticeNumber}}<br/>Date: {{date}}</p>

  <p>This is to certify that the student below has been pre-admitted through
  YPIT Consultancies and may proceed with preparations while awaiting the
  university's official admission letter.</p>

  <table style="width:100%; border-collapse:collapse;" border="1" cellpadding="6">
    <tr><td><strong>Full Name</strong></td><td>{{fullName}}</td></tr>
    <tr><td><strong>Nationality</strong></td><td>{{nationality}}</td></tr>
    <tr><td><strong>Passport No</strong></td><td>{{passportNo}}</td></tr>
    <tr><td><strong>Gender</strong></td><td>{{gender}}</td></tr>
    <tr><td><strong>Course Interested</strong></td><td>{{courseInterested}}</td></tr>
    <tr><td><strong>Contact Number</strong></td><td>{{contactNumber}}</td></tr>
    <tr><td><strong>Father's Name</strong></td><td>{{fatherName}}</td></tr>
    <tr><td><strong>Mother's Name</strong></td><td>{{motherName}}</td></tr>
    <tr><td><strong>Parent's Contact</strong></td><td>{{parentContact}}</td></tr>
    <tr><td><strong>Date of Birth</strong></td><td>{{dateOfBirth}}</td></tr>
    <tr><td><strong>Address</strong></td><td>{{address}}</td></tr>
  </table>

  <p style="margin-top:24px;">Yours sincerely,</p>
  <p><strong>Admissions Office</strong><br/>YPIT Consultancies</p>
</div>`;
