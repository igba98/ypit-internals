'use client';

import { useTransition } from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { startTask, blockTask, unblockTask } from '@/lib/actions/taskActions';
import { toast } from 'sonner';
import { canStart, canSubmit, canReview, canBlock, canUnblock } from '@/lib/tasks/permissions';
import { Play, Pause, PlayCircle, Send, Gavel } from 'lucide-react';

interface Props {
  task: Task;
  currentUserId: string;
  onAction: (action: 'submit' | 'review') => void;
}

async function callAction(fn: typeof startTask, taskId: string, extras: Record<string, string> = {}) {
  const fdata = new FormData();
  fdata.append('taskId', taskId);
  Object.entries(extras).forEach(([k, v]) => fdata.append(k, v));
  return fn(null, fdata);
}

export function TaskActionBar({ task, currentUserId, onAction }: Props) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {canStart(task, currentUserId) && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await callAction(startTask, task.id);
              if (r.success) toast.success(r.message);
              else toast.error(r.message);
            })
          }
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          Start
        </Button>
      )}

      {canSubmit(task, currentUserId) && (
        <Button size="sm" onClick={() => onAction('submit')}>
          <Send className="w-3.5 h-3.5 mr-1" />
          {task.status === 'CHANGES_REQUESTED' ? 'Resubmit' : 'Submit'}
        </Button>
      )}

      {canReview(task, currentUserId) && (
        <Button size="sm" onClick={() => onAction('review')}>
          <Gavel className="w-3.5 h-3.5 mr-1" />
          Review
        </Button>
      )}

      {canBlock(task, currentUserId) && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const reason = window.prompt('Block reason (min 3 chars):');
              if (!reason || reason.trim().length < 3) return;
              const r = await callAction(blockTask, task.id, { reason });
              if (r.success) toast.success(r.message);
              else toast.error(r.message);
            })
          }
        >
          <Pause className="w-3.5 h-3.5 mr-1" />
          Block
        </Button>
      )}

      {canUnblock(task, currentUserId) && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await callAction(unblockTask, task.id);
              if (r.success) toast.success(r.message);
              else toast.error(r.message);
            })
          }
        >
          <PlayCircle className="w-3.5 h-3.5 mr-1" />
          Unblock
        </Button>
      )}
    </div>
  );
}
