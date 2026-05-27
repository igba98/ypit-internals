'use client';

import { useState, useTransition } from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { TaskDetailPanel } from './TaskDetailPanel';
import { startTask, blockTask, unblockTask } from '@/lib/actions/taskActions';
import { canStart, canBlock, canUnblock } from '@/lib/tasks/permissions';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-50' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'SUBMITTED', title: 'Submitted', color: 'bg-purple-50' },
  { id: 'CHANGES_REQUESTED', title: 'Changes Requested', color: 'bg-amber-50' },
  { id: 'BLOCKED', title: 'Blocked', color: 'bg-red-50' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-green-50' },
];

function SortableTask({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

interface TaskKanbanProps {
  initialTasks: Task[];
  currentUserId: string;
}

export function TaskKanban({ initialTasks, currentUserId }: TaskKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [, startMutation] = useTransition();

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const t = tasks.find((x) => x.id === e.active.id);
    if (t) setActiveTask(t);
  };

  const runAction = async (fn: typeof startTask, taskId: string, extras: Record<string, string> = {}) => {
    const f = new FormData();
    f.append('taskId', taskId);
    Object.entries(extras).forEach(([k, v]) => f.append(k, v));
    return fn(null, f);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const overId = over.id as TaskStatus | string;
    const targetCol = COLUMNS.find((c) => c.id === overId);
    if (!targetCol) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === targetCol.id) return;

    let allowed = false;
    let mutator: (() => Promise<{ success: boolean; message: string }>) | null = null;

    if (targetCol.id === 'IN_PROGRESS') {
      if (task.status === 'TODO' || task.status === 'CHANGES_REQUESTED') {
        allowed = canStart(task, currentUserId);
        mutator = () => runAction(startTask, task.id);
      } else if (task.status === 'BLOCKED') {
        allowed = canUnblock(task, currentUserId);
        mutator = () => runAction(unblockTask, task.id);
      }
    } else if (targetCol.id === 'BLOCKED') {
      allowed = canBlock(task, currentUserId);
      if (allowed) {
        const reason = window.prompt('Block reason (min 3 chars):');
        if (!reason || reason.trim().length < 3) {
          toast.error('Block cancelled.');
          return;
        }
        mutator = () => runAction(blockTask, task.id, { reason });
      }
    }

    if (!allowed || !mutator) {
      toast.error('That move is not allowed from the kanban — open the task to act on it.');
      return;
    }

    startMutation(async () => {
      const r = await mutator!();
      if (r.success) toast.success(r.message);
      else toast.error(r.message);
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} id={col.id} className={cn('flex-1 min-w-[280px] rounded-xl p-4', col.color)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-urbanist font-bold text-gray-900">{col.title}</h3>
                <span className="bg-white text-gray-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  {colTasks.length}
                </span>
              </div>
              <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[200px]">
                  {colTasks.map((task) => (
                    <SortableTask key={task.id} task={task} onClick={(t) => setOpenTaskId(t.id)} />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} onClick={() => {}} isDragging /> : null}</DragOverlay>

      {openTask && (
        <TaskDetailPanel task={openTask} currentUserId={currentUserId} isOpen={true} onClose={() => setOpenTaskId(null)} />
      )}
    </DndContext>
  );
}
