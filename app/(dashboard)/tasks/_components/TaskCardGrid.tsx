'use client';

import { Task } from '@/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { motion } from 'motion/react';
import { ClipboardList } from 'lucide-react';

interface TaskCardGridProps {
  initialTasks: Task[];
}

export function TaskCardGrid({ initialTasks }: TaskCardGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      {initialTasks.map(task => (
        <motion.div key={task.id} variants={item}>
          <TaskCard 
            task={task} 
            onClick={() => undefined}
          />
        </motion.div>
      ))}
      
      {initialTasks.length === 0 && (
        <div className="col-span-full py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primary-muted flex items-center justify-center text-primary mb-4">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No tasks yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            You don’t have any tasks for this view. Use the “Create Task” button above to add one.
          </p>
        </div>
      )}
    </motion.div>
  );
}
