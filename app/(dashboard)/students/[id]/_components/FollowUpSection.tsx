'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ActionResult,
  FollowUpOutcome,
  FollowUpParty,
  StudentFollowUp,
  User,
} from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, MessageSquarePlus, Phone, Mail, Users2, MessageCircle, StickyNote,
  CalendarClock, GraduationCap, Building2, Landmark, CheckCircle2, CircleDashed,
} from 'lucide-react';
import { addStudentFollowUp, completeFollowUpAction } from '@/lib/actions/studentFollowUpActions';

const TYPE_ICON = {
  CALL: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  MEETING: Users2,
  NOTE: StickyNote,
} as const;

const OUTCOME_BADGE: Record<FollowUpOutcome, string> = {
  POSITIVE: 'bg-green-50 text-green-700',
  NEUTRAL: 'bg-gray-100 text-gray-700',
  NEEDS_ATTENTION: 'bg-amber-50 text-amber-700',
  NO_RESPONSE: 'bg-red-50 text-red-700',
};

/** The STUDENT → PARENTS → YPIT → UNIVERSITY chain. */
export const PARTY: Record<FollowUpParty, { label: string; icon: typeof Phone; cls: string }> = {
  STUDENT: { label: 'Student', icon: GraduationCap, cls: 'bg-blue-50 text-blue-700' },
  PARENT: { label: 'Parents', icon: Users2, cls: 'bg-purple-50 text-purple-700' },
  INTERNAL: { label: 'YPIT (internal)', icon: Building2, cls: 'bg-gray-100 text-gray-700' },
  UNIVERSITY: { label: 'University', icon: Landmark, cls: 'bg-emerald-50 text-emerald-700' },
};

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function FollowUpSection({
  studentId,
  followUps,
  canEdit,
  staff = [],
}: {
  studentId: string;
  followUps: StudentFollowUp[];
  canEdit: boolean;
  staff?: Pick<User, 'id' | 'fullName' | 'role'>[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [hasAction, setHasAction] = useState(false);
  const [busy, startTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> =>
      addStudentFollowUp(studentId, _prev, formData),
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router]);

  const onComplete = (f: StudentFollowUp) => {
    startTransition(async () => {
      const res = await completeFollowUpAction(f.id, studentId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  };

  const open = followUps.filter((f) => f.actionStatus === 'OPEN').length;

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <MessageSquarePlus className="w-4 h-4" /> Follow-ups
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Student → Parents → YPIT → University. Log who was contacted, what was agreed, and who owns the next step.
          </p>
        </div>
        {open > 0 && (
          <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800">
            {open} pending action{open === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {canEdit && (
        <form ref={formRef} action={formAction} className="p-5 border-b border-gray-100 space-y-3 bg-gray-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="party">Who was contacted</Label>
              <Select id="party" name="party" defaultValue="STUDENT">
                {(Object.keys(PARTY) as FollowUpParty[]).map((p) => (
                  <option key={p} value={p}>{PARTY[p].label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactName">Contact name</Label>
              <Input id="contactName" name="contactName" placeholder="e.g. Mama Amina" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Channel</Label>
              <Select id="type" name="type" defaultValue="CALL">
                <option value="CALL">Call</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="NOTE">Note</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outcome">Outcome</Label>
              <Select id="outcome" name="outcome" defaultValue="NEUTRAL">
                <option value="POSITIVE">Positive</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="NEEDS_ATTENTION">Needs attention</option>
                <option value="NO_RESPONSE">No response</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">What was discussed *</Label>
            <Textarea id="notes" name="notes" rows={2} required placeholder="Commitments, concerns, documents promised…" />
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 p-3 space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={hasAction} onChange={(e) => setHasAction(e.target.checked)} className="rounded border-gray-300" />
              Add a pending action (appears on the Follow-ups board with a reminder date)
            </label>
            {hasAction && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="pendingAction">Pending action *</Label>
                  <Input id="pendingAction" name="pendingAction" required placeholder="e.g. Collect passport copy from parents" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="assignedToId">Responsible</Label>
                  <Select id="assignedToId" name="assignedToId" defaultValue="">
                    <option value="">Me</option>
                    {staff.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nextFollowUp">Due / reminder</Label>
                  <Input id="nextFollowUp" name="nextFollowUp" type="date" />
                </div>
              </div>
            )}
            {!hasAction && (
              <div className="space-y-1.5 max-w-xs">
                <Label htmlFor="nextFollowUp">Next follow-up (optional)</Label>
                <Input id="nextFollowUp" name="nextFollowUp" type="date" />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isPending ? 'Logging...' : 'Log Follow-up'}
            </Button>
          </div>
        </form>
      )}

      {followUps.length === 0 ? (
        <p className="text-sm text-gray-500 px-5 py-8 text-center">No follow-ups recorded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {followUps.map((f) => {
            const Icon = TYPE_ICON[f.type] ?? StickyNote;
            const party = PARTY[f.party ?? 'STUDENT'];
            return (
              <li key={f.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${party.cls}`}>
                        {party.label}{f.contactName ? ` · ${f.contactName}` : ''}
                      </span>
                      <span className="text-xs font-semibold text-gray-900">{f.type.toLowerCase()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${OUTCOME_BADGE[f.outcome]}`}>
                        {f.outcome.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{f.notes}</p>
                    {f.pendingAction && (
                      <div className={`mt-2 rounded-md px-3 py-2 text-xs flex items-start justify-between gap-3 ${f.actionStatus === 'DONE' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
                        <div className="flex items-start gap-1.5 min-w-0">
                          {f.actionStatus === 'DONE' ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <CircleDashed className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                          <div className="min-w-0">
                            <p className="font-medium">{f.pendingAction}</p>
                            <p className="text-[11px] opacity-80">
                              {f.assignedToName ?? 'Unassigned'}
                              {f.nextFollowUp && <> · due {formatDate(f.nextFollowUp)}{f.actionStatus !== 'DONE' && isPast(f.nextFollowUp) && ' (overdue)'}</>}
                              {f.completedAt && <> · done {formatDate(f.completedAt)}</>}
                            </p>
                          </div>
                        </div>
                        {canEdit && f.actionStatus === 'OPEN' && (
                          <button onClick={() => onComplete(f)} disabled={busy} className="shrink-0 text-[11px] font-semibold underline hover:no-underline">
                            Mark done
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                      <span>{formatDate(f.createdAt)} · {f.createdByName}</span>
                      {f.nextFollowUp && !f.pendingAction && (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <CalendarClock className="w-3 h-3" /> Next: {formatDate(f.nextFollowUp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
