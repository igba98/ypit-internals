'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TaskActivityTimeline } from './TaskActivityTimeline';
import { TaskActionBar } from './TaskActionBar';
import { SubmitTaskForm } from './SubmitTaskForm';
import { ReviewTaskForm } from './ReviewTaskForm';
import { formatDate } from '@/lib/utils';
import { FileText, Calendar, User } from 'lucide-react';

type SubView = 'detail' | 'submit' | 'review';

interface Props {
  task: Task;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailPanel({ task, currentUserId, isOpen, onClose }: Props) {
  const [view, setView] = useState<SubView>('detail');

  const handleClose = () => {
    setView('detail');
    onClose();
  };

  return (
    <SlideInPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={view === 'submit' ? 'Submit Report' : view === 'review' ? 'Review Submission' : task.title}
      description={view === 'detail' ? `Assigned to ${task.assignedToNames.join(', ')}` : undefined}
    >
      {view === 'detail' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} variant="task" />
            <span className="text-xs text-gray-500">
              Priority: <span className="font-semibold">{task.priority}</span>
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.dueDate)}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              By {task.assignedByName}
            </span>
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>

          {task.referenceAttachments && task.referenceAttachments.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Reference materials</h4>
              <ul className="flex flex-wrap gap-2">
                {task.referenceAttachments.map((a, i) => (
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
            </div>
          )}

          <TaskActionBar
            task={task}
            currentUserId={currentUserId}
            onAction={(a) => setView(a === 'submit' ? 'submit' : 'review')}
          />

          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Activity</h4>
            <TaskActivityTimeline task={task} />
          </div>
        </div>
      )}

      {view === 'submit' && <SubmitTaskForm task={task} onSuccess={handleClose} />}
      {view === 'review' && <ReviewTaskForm task={task} onSuccess={handleClose} />}
    </SlideInPanel>
  );
}
