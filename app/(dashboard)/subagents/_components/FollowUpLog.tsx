'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ActionResult, SubAgentFollowUp } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessagesSquare, Loader2 } from 'lucide-react';
import { logSubAgentFollowUp } from '@/lib/actions/subagentActions';

interface Props {
  subAgentId: string;
  followUps: SubAgentFollowUp[];
  canEdit: boolean;
}

export function FollowUpLog({ subAgentId, followUps, canEdit }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> =>
      logSubAgentFollowUp(subAgentId, _prev, formData),
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
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-1.5">
        <MessagesSquare className="w-4 h-4" /> Contract Follow-ups
      </h3>

      {canEdit && (
        <form ref={formRef} action={formAction} className="mb-5 space-y-2">
          <Textarea
            name="notes"
            rows={2}
            required
            placeholder="e.g. Called about Q3 targets — promised 5 new students by August. Contract renewal due next month."
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isPending ? 'Logging...' : 'Log Follow-up'}
            </Button>
          </div>
        </form>
      )}

      {followUps.length === 0 ? (
        <p className="text-sm text-gray-500">No follow-ups recorded yet.</p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {followUps.map((f) => (
            <li key={f.id} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{f.notes}</p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {formatDate(f.createdAt)} · {f.createdByName}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
