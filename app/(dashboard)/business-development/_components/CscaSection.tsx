'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ClipboardCheck,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CscaExamRecord, CscaExamStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  addCscaFollowUp,
  deleteCscaExam,
  saveCscaExam,
} from '@/lib/actions/cscaActions';

const STATUSES: { value: CscaExamStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'SAT', label: 'Sat - awaiting result' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE: Record<CscaExamStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  SAT: 'bg-amber-100 text-amber-800',
  PASSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-indigo-100 text-indigo-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export interface StudentOption {
  id: string;
  fullName: string;
  registrationNumber: string;
}

/** CSCA examination follow-up: who is sitting, where it stands, what was said. */
export function CscaSection({
  exams,
  students,
  canEdit,
}: {
  exams: CscaExamRecord[];
  students: StudentOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CscaExamRecord | null>(null);
  const [noting, setNoting] = useState<CscaExamRecord | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const onDelete = (e: CscaExamRecord) => {
    if (!confirm(`Remove the CSCA sitting for ${e.student.fullName}?`)) return;
    startTransition(async () => {
      const res = await deleteCscaExam(e.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">CSCA Examinations</h2>
        <span className="text-xs text-gray-400">{exams.length} sitting(s)</span>
        {canEdit && (
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => setCreating(true)} disabled={busy}>
            <Plus className="w-4 h-4" /> Register a student
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Exam date</th>
              <th className="px-4 py-3 font-medium">Venue / reg. no</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Result</th>
              <th className="px-4 py-3 font-medium">Next follow-up</th>
              <th className="px-4 py-3 font-medium text-right">
                {canEdit ? 'Actions' : 'Notes'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.map((e) => (
              <>
                <tr key={e.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{e.student.fullName}</p>
                    <p className="text-[11px] text-gray-500">
                      {e.student.registrationNumber}
                      {e.student.targetCountry ? ` · ${e.student.targetCountry}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {e.examDate ? formatDate(e.examDate) : <span className="text-gray-300">not set</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {e.venue ?? <span className="text-gray-300">-</span>}
                    {e.registrationNo && <p className="text-[11px] text-gray-400">{e.registrationNo}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[e.status]}`}>
                      {STATUSES.find((s) => s.value === e.status)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {e.result ?? <span className="text-gray-300">-</span>}
                    {e.resultDate && <p className="text-[11px] text-gray-400">{formatDate(e.resultDate)}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {e.nextFollowUp ? formatDate(e.nextFollowUp) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                      className="text-[11px] font-semibold text-primary hover:underline mr-2"
                    >
                      {`${e.followUps.length} ${e.followUps.length === 1 ? 'note' : 'notes'}`}
                    </button>
                    {canEdit && (
                      <>
                        <button onClick={() => setNoting(e)} className="text-gray-400 hover:text-primary p-1" title="Log a follow-up">
                          <MessageSquarePlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditing(e)} className="text-gray-400 hover:text-primary p-1" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(e)} className="text-gray-400 hover:text-red-600 p-1" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
                {expanded === e.id && (
                  <tr key={`${e.id}-notes`} className="bg-gray-50/70">
                    <td colSpan={7} className="px-4 py-3">
                      {e.notes && <p className="text-xs text-gray-700 mb-2">{e.notes}</p>}
                      {e.followUps.length === 0 ? (
                        <p className="text-xs text-gray-500">No follow-ups logged yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {e.followUps.map((f) => (
                            <li key={f.id} className="text-xs text-gray-700 border-l-2 border-primary/30 pl-3">
                              <p>{f.notes}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {f.createdByName} · {formatDate(f.createdAt)}
                                {f.statusAtNote ? ` · ${f.statusAtNote.toLowerCase()}` : ''}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No CSCA sittings recorded.{canEdit ? ' Register the first student above.' : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? `CSCA · ${editing.student.fullName}` : 'Register for CSCA'}
        description="Record the sitting, then keep its status and result up to date."
      >
        <CscaForm
          existing={editing ?? undefined}
          students={students}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </SlideInPanel>

      <SlideInPanel
        isOpen={noting !== null}
        onClose={() => setNoting(null)}
        title={noting ? `Follow-up · ${noting.student.fullName}` : 'Follow-up'}
        description="The note is kept with the sitting; you can move the status at the same time."
      >
        {noting && <FollowUpForm exam={noting} onDone={() => setNoting(null)} />}
      </SlideInPanel>
    </div>
  );
}

function CscaForm({
  existing,
  students,
  onDone,
}: {
  existing?: CscaExamRecord;
  students: StudentOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [studentId, setStudentId] = useState(existing?.studentId ?? '');
  const [examDate, setExamDate] = useState(existing?.examDate?.slice(0, 10) ?? '');
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [regNo, setRegNo] = useState(existing?.registrationNo ?? '');
  const [status, setStatus] = useState<CscaExamStatus>(existing?.status ?? 'SCHEDULED');
  const [result, setResult] = useState(existing?.result ?? '');
  const [resultDate, setResultDate] = useState(existing?.resultDate?.slice(0, 10) ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [nextFollowUp, setNextFollowUp] = useState(existing?.nextFollowUp?.slice(0, 10) ?? '');

  const submit = () => {
    if (!existing && !studentId) return toast.error('Choose the student.');

    startTransition(async () => {
      const base = {
        examDate: examDate || undefined,
        venue: venue.trim() || undefined,
        registrationNo: regNo.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        nextFollowUp: nextFollowUp || undefined,
      };
      const payload = existing
        ? { ...base, result: result.trim() || undefined, resultDate: resultDate || undefined }
        : { ...base, studentId };
      const res = await saveCscaExam(existing?.id ?? null, payload);
      if (res.success) {
        toast.success(res.message);
        onDone();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {!existing && (
        <div className="space-y-2">
          <Label htmlFor="cs-student">Student *</Label>
          <Select id="cs-student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Choose a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.registrationNumber})
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cs-date">Exam date</Label>
          <Input id="cs-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cs-status">Status</Label>
          <Select id="cs-status" value={status} onChange={(e) => setStatus(e.target.value as CscaExamStatus)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cs-venue">Venue</Label>
          <Input id="cs-venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Dar es Salaam centre" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cs-reg">Registration / candidate no.</Label>
          <Input id="cs-reg" value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="CSCA-2026-0091" />
        </div>
      </div>

      {existing && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="cs-result">Result</Label>
            <Input id="cs-result" value={result} onChange={(e) => setResult(e.target.value)} placeholder="Marks or grade" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-rdate">Result date</Label>
            <Input id="cs-rdate" type="date" value={resultDate} onChange={(e) => setResultDate(e.target.value)} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cs-next">Next follow-up</Label>
        <Input id="cs-next" type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cs-notes">Notes</Label>
        <Textarea id="cs-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preparation, documents needed, anything outstanding…" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          {existing ? 'Save changes' : 'Register student'}
        </Button>
      </div>
    </div>
  );
}

function FollowUpForm({ exam, onDone }: { exam: CscaExamRecord; onDone: () => void }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<CscaExamStatus | ''>('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const submit = () => {
    if (notes.trim().length < 2) return toast.error('Write the note first.');
    startTransition(async () => {
      const res = await addCscaFollowUp(exam.id, {
        notes: notes.trim(),
        status: status || undefined,
        nextFollowUp: nextFollowUp || undefined,
      });
      if (res.success) {
        toast.success(res.message);
        onDone();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fu-notes">What happened? *</Label>
        <Textarea
          id="fu-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Called the student - confirmed he collected the exam slip"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fu-status">Move status to</Label>
          <Select id="fu-status" value={status} onChange={(e) => setStatus(e.target.value as CscaExamStatus | '')}>
            <option value="">Leave as {exam.status.toLowerCase()}</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fu-next">Next follow-up</Label>
          <Input id="fu-next" type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
          Log follow-up
        </Button>
      </div>
    </div>
  );
}
