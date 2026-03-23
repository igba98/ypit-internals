'use client';

import { Task } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { AvatarCluster } from './AvatarCluster';
import { Calendar, Clock, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { ReportTaskPanel } from '@/app/(dashboard)/tasks/_components/ReportTaskPanel';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const priorityColors = {
    LOW: 'bg-rose-100 text-rose-700 border-rose-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    HIGH: 'bg-blue-100 text-blue-700 border-blue-200',
    URGENT: 'bg-red-600 text-white border-red-700'
  };

  const statusColors = {
    TODO: 'bg-gray-300',
    IN_PROGRESS: 'bg-blue-500 animate-pulse',
    COMPLETED: 'bg-green-500',
    BLOCKED: 'bg-red-500',
    REPORTED: 'bg-purple-500'
  };

  const isPastDue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const needsReport = (task.status === 'IN_PROGRESS' || task.status === 'TODO') && new Date().getHours() >= 17;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(task)}
      className={cn(
        "bg-white rounded-xl shadow-card p-4 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:shadow-card-hover",
        isDragging && "opacity-50 shadow-elevated",
        task.priority === 'URGENT' ? "hover:border-red-600" :
        task.priority === 'HIGH' ? "hover:border-blue-600" :
        task.priority === 'MEDIUM' ? "hover:border-amber-500" : "hover:border-rose-500"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", priorityColors[task.priority])}>
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full", statusColors[task.status])} title={task.status.replace('_', ' ')} />
          <button className="text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="font-urbanist font-semibold text-gray-900 text-lg leading-tight line-clamp-2 mb-1">
        {task.title}
      </h3>
      
      <p className="font-urbanist text-sm text-gray-500 line-clamp-3 mb-3">
        {task.description}
      </p>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 flex-wrap gap-2">
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", isPastDue ? "text-red-600" : "text-gray-500")}>
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(task.dueDate)}
        </div>
        
        <div className="flex items-center gap-2">
          <ReportTaskPanel task={task} />
          <AvatarCluster 
            users={task.assignedToNames.map((name, i) => ({ name, avatar: `https://i.pravatar.cc/150?u=${task.assignedToIds[i]}` }))} 
            size="sm" 
          />
        </div>
      </div>

      {needsReport && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md w-fit">
          <Clock className="w-3.5 h-3.5" />
          Report Due
        </div>
      )}
    </motion.div>
  );
}
