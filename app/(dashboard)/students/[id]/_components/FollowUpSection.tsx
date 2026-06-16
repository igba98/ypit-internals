'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ActionResult, FollowUpOutcome, StudentFollowUp } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquarePlus, Phone, Mail, Users2, MessageCircle, StickyNote, CalendarClock } from 'lucide-react';
import { addStudentFollowUp } from '@/lib/actions/studentFollowUpActions';

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

export function FollowUpSection({
  studentId,
  followUps,
  canEdit,
}: {
  studentId: string;
  followUps: StudentFollowUp[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <MessageSquarePlus className="w-4 h-4" /> Follow-ups
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Relationship-officer engagement log — calls, messages, and meetings with this student.
        </p>
      </div>

      {canEdit && (
        <form ref={formRef} action={formAction} className="p-5 border-b border-gray-100 space-y-3 bg-gray-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
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
            <div className="space-y-1.5">
              <Label htmlFor="nextFollowUp">Next follow-up</Label>
              <Input id="nextFollowUp" name="nextFollowUp" type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes *</Label>
            <Textarea id="notes" name="notes" rows={2} required placeholder="What was discussed? Any commitments or concerns?" />
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
            return (
              <li key={f.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-900">{f.type.toLowerCase()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${OUTCOME_BADGE[f.outcome]}`}>
                        {f.outcome.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{f.notes}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                      <span>{formatDate(f.createdAt)} · {f.createdByName}</span>
                      {f.nextFollowUp && (
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
