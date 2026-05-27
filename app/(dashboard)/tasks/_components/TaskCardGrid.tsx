'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { TaskDetailPanel } from './TaskDetailPanel';
import { motion } from 'motion/react';
import { ClipboardList } from 'lucide-react';

interface TaskCardGridProps {
  initialTasks: Task[];
  currentUserId: string;
}

export function TaskCardGrid({ initialTasks, currentUserId }: TaskCardGridProps) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const openTask = openTaskId ? initialTasks.find((t) => t.id === openTaskId) : null;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {initialTasks.map((task) => (
          <motion.div key={task.id} variants={item}>
            <TaskCard task={task} onClick={(t) => setOpenTaskId(t.id)} />
          </motion.div>
        ))}

        {initialTasks.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-primary-muted flex items-center justify-center text-primary mb-4">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Nothing here</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              No tasks match this view yet. Create one to get started.
            </p>
          </div>
        )}
      </motion.div>

      {openTask && (
        <TaskDetailPanel
          task={openTask}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={() => setOpenTaskId(null)}
        />
      )}
    </>
  );
}
