'use client';

import { Task } from '@/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { motion } from 'motion/react';

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
            onClick={(t) => console.log('Clicked task', t.id)} 
          />
        </motion.div>
      ))}
      
      {initialTasks.length === 0 && (
        <div className="col-span-full py-12 text-center text-gray-500">
          No tasks found.
        </div>
      )}
    </motion.div>
  );
}
