'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Student, Session, StageTransitionPayload } from '@/types';
import { TransitionDef } from '@/lib/pipeline/transitions';
import { FieldSpec } from '@/lib/pipeline/fields';
import { resolveRecipients } from '@/lib/pipeline/notify';
import { mockUsers } from '@/lib/mock/mockUsers';
import { getGuardiansForStudent } from '@/lib/mock/mockGuardians';
import { advanceStudent } from '@/lib/actions/pipelineActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Send } from 'lucide-react';

interface Props {
  student: Student;
  session: Session;
  transition: TransitionDef;
  open: boolean;
  onClose: () => void;
}

export function AdvanceStageModal({ student, session, transition, open, onClose }: Props) {
  const [values, setValues] = useState<StageTransitionPayload>(() => initialValues(transition.requiredFields));
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const eligibleAssignees = mockUsers.filter(u => u.role === transition.newOwnerRole && u.status === 'ACTIVE');

  const previewMessage = useMemo(() => {
    return transition.messageTemplate({
      studentName: student.fullName,
      university: student.targetUniversity,
      capturedData: values,
    });
  }, [transition, student, values]);

  const recipients = useMemo(() => {
    return transition.notify.flatMap(audience =>
      resolveRecipients({ audience, studentId: student.id, newOwnerRole: transition.newOwnerRole })
    );
  }, [transition, student.id]);

  const hasGuardians = getGuardiansForStudent(student.id).length > 0;
  const needsParent = transition.notify.some(a => a === 'PARENT_PRIMARY' || a === 'ALL_PARENTS');
  const showNoGuardianWarning = needsParent && !hasGuardians;

  function handleSubmit() {
    startTransition(async () => {
      const result = await advanceStudent({
        studentId: student.id,
        capturedData: values,
        assigneeId: assigneeId || null,
        session: { userId: session.userId, fullName: session.fullName, role: session.role },
      });
      if (result.success) {
        toast.success(result.message);
        recipients.forEach(r => {
          if (r.kind === 'WHATSAPP') toast.info(`WhatsApp (simulated) to ${r.name} ${r.phone ?? ''}`);
        });
        onClose();
      } else {
        const errs = (result.errors ?? {}) as Record<string, string[]>;
        setFieldErrors(errs);
        const detail = Object.entries(errs)
          .map(([k, v]) => `${k}: ${v[0]}`)
          .join(' · ');
        toast.error(detail ? `${result.message} — ${detail}` : result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transition.label}</DialogTitle>
          <p className="text-sm text-gray-500">
            {student.fullName} · {transition.from.replace(/_/g, ' ').toLowerCase()} → {transition.to.replace(/_/g, ' ').toLowerCase()}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {transition.requiredFields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key]}
              error={fieldErrors[field.key]?.[0]}
              onChange={(v) => setValues({ ...values, [field.key]: v })}
            />
          ))}

          <div>
            <Label htmlFor="assignee">Assign next owner ({transition.newOwnerRole.replace(/_/g, ' ').toLowerCase()})</Label>
            <select
              id="assignee"
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Assign later (role-wide queue)</option>
              {eligibleAssignees.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>

          {showNoGuardianWarning && (
            <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>No parent contacts on file - only the student will be notified. Consider adding a guardian first.</span>
            </div>
          )}

          <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <p className="text-xs uppercase font-semibold text-gray-500 mb-2 flex items-center gap-1"><Send size={12} /> Notification preview</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewMessage}</p>
            <p className="text-xs text-gray-500 mt-2">Will be sent (simulated) to:</p>
            <ul className="text-xs text-gray-700 mt-1 list-disc list-inside">
              {recipients.length === 0 && <li>No recipients resolved</li>}
              {recipients.map((r, i) => (
                <li key={i}>{r.kind === 'WHATSAPP' ? '📱' : '🔔'} {r.name}{r.phone ? ` - ${r.phone}` : ''} ({r.kind.toLowerCase()})</li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? 'Advancing…' : transition.label}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function initialValues(fields: FieldSpec[]): StageTransitionPayload {
  const init: StageTransitionPayload = {};
  for (const f of fields) {
    if (f.kind === 'boolean') init[f.key] = ('defaultValue' in f && typeof f.defaultValue === 'boolean') ? f.defaultValue : false;
  }
  return init;
}

interface FieldInputProps {
  field: FieldSpec;
  value: string | number | boolean | null | undefined;
  error?: string;
  onChange: (v: string | number | boolean | null) => void;
}

function FieldInput({ field, value, error, onChange }: FieldInputProps) {
  const errorEl = error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null;
  const labelEl = (
    <Label htmlFor={field.key}>
      {field.label}{field.required ? ' *' : ''}
    </Label>
  );
  switch (field.kind) {
    case 'text':
      return <div><span>{labelEl}</span><Input id={field.key} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />{errorEl}</div>;
    case 'url':
      return (
        <div>
          <span>{labelEl}</span>
          <Input id={field.key} type="url" placeholder="https://..." value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
          <p className="text-[11px] text-gray-500 mt-1">Paste a full link — https:// is added automatically if missing.</p>
          {errorEl}
        </div>
      );
    case 'textarea':
      return <div><span>{labelEl}</span><Textarea id={field.key} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />{errorEl}</div>;
    case 'number':
      return <div><span>{labelEl}</span><Input id={field.key} type="number" min={field.min} value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} /></div>;
    case 'date':
      return <div><span>{labelEl}</span><Input id={field.key} type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />{errorEl}</div>;
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input id={field.key} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {labelEl}
        </div>
      );
    case 'select':
      return (
        <div>
          <span>{labelEl}</span>
          <select id={field.key} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            <option value="">-</option>
            {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    case 'userSelect': {
      const candidates = mockUsers.filter(u => field.roles.includes(u.role));
      return (
        <div>
          <span>{labelEl}</span>
          <select id={field.key} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            <option value="">-</option>
            {candidates.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.role.replace(/_/g, ' ').toLowerCase()})</option>)}
          </select>
        </div>
      );
    }
    case 'paymentMethodSelect':
      return (
        <div>
          <span>{labelEl}</span>
          <select id={field.key} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            <option value="">-</option>
            {['BANK_TRANSFER', 'CASH', 'CHEQUE', 'CARD', 'MOBILE_MONEY', 'PETTY_CASH'].map(m => <option key={m} value={m}>{m.replace(/_/g, ' ').toLowerCase()}</option>)}
          </select>
        </div>
      );
    case 'file': {
      const dataUrl = typeof value === 'string' && value.startsWith('data:') ? value : null;
      const summary = dataUrl ? summarizeDataUrl(dataUrl) : null;
      const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (field.maxBytes && file.size > field.maxBytes) {
          toast.error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${Math.round(field.maxBytes / 1024 / 1024)}MB)`);
          e.target.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => onChange(String(reader.result));
        reader.onerror = () => toast.error('Could not read file');
        reader.readAsDataURL(file);
      };
      return (
        <div>
          <span>{labelEl}</span>
          <input
            id={field.key}
            type="file"
            accept={field.accept}
            onChange={handleFile}
            className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-muted file:text-primary hover:file:bg-primary/10"
          />
          {summary && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
              <span>📎 {summary.label}</span>
              <button type="button" onClick={() => onChange(null)} className="ml-auto text-red-600 hover:underline">Remove</button>
            </div>
          )}
        </div>
      );
    }
  }
}

function summarizeDataUrl(dataUrl: string): { mime: string; sizeKB: number; label: string } {
  const match = dataUrl.match(/^data:([^;,]+)(?:;base64)?,(.*)$/);
  const mime = match?.[1] ?? 'application/octet-stream';
  const dataPart = match?.[2] ?? '';
  const sizeBytes = Math.ceil(dataPart.length * 0.75);
  const sizeKB = Math.max(1, Math.round(sizeBytes / 1024));
  return { mime, sizeKB, label: `${mime} · ${sizeKB} KB` };
}