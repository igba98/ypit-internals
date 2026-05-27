'use client';

import { Task, TaskActivityEntry } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  CircleDot,
  Edit3,
  FileText,
  MessageSquareWarning,
  Pause,
  Play,
  Send,
  XCircle,
} from 'lucide-react';

const ICONS: Record<TaskActivityEntry['type'], typeof CircleDot> = {
  CREATED: CircleDot,
  STARTED: Play,
  SUBMITTED: Send,
  APPROVED: CheckCircle2,
  CHANGES_REQUESTED: MessageSquareWarning,
  REJECTED: XCircle,
  BLOCKED: Pause,
  UNBLOCKED: Play,
  EDITED: Edit3,
};

const LABELS: Record<TaskActivityEntry['type'], string> = {
  CREATED: 'Created task',
  STARTED: 'Started work',
  SUBMITTED: 'Submitted report',
  APPROVED: 'Approved',
  CHANGES_REQUESTED: 'Requested changes',
  REJECTED: 'Rejected',
  BLOCKED: 'Blocked',
  UNBLOCKED: 'Unblocked',
  EDITED: 'Edited task',
};

export function TaskActivityTimeline({ task }: { task: Task }) {
  return (
    <ol className="space-y-4">
      {task.activity.map((entry) => {
        const Icon = ICONS[entry.type];
        return (
          <li key={entry.id} className="flex gap-3">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {LABELS[entry.type]} <span className="font-normal text-gray-500">· {entry.actorName}</span>
                </p>
                <p className="text-[11px] text-gray-500 shrink-0">{formatDate(entry.at)}</p>
              </div>

              {entry.note && <p className="text-sm text-gray-700 mt-1">{entry.note}</p>}

              {entry.type === 'SUBMITTED' && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {entry.progressMade && (
                    <div className="col-span-2">
                      <p className="text-gray-500 uppercase tracking-wide">Progress</p>
                      <p className="text-gray-800">{entry.progressMade}</p>
                    </div>
                  )}
                  {entry.percentageComplete != null && (
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide">Complete</p>
                      <p className="text-gray-800 font-semibold">{entry.percentageComplete}%</p>
                    </div>
                  )}
                  {entry.nextActions && (
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide">Next</p>
                      <p className="text-gray-800">{entry.nextActions}</p>
                    </div>
                  )}
                  {entry.blockers && (
                    <div className="col-span-2">
                      <p className="text-gray-500 uppercase tracking-wide">Blockers</p>
                      <p className="text-gray-800">{entry.blockers}</p>
                    </div>
                  )}
                </div>
              )}

              {entry.attachments && entry.attachments.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {entry.attachments.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a.url}
                        download={a.filename}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {a.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
