'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { ReportTaskForm } from './ReportTaskForm';
import { Task } from '@/types';
import { FileEdit } from 'lucide-react';

export function ReportTaskPanel({ task }: { task: Task }) {
  const [isOpen, setIsOpen] = useState(false);

  // If task already reported/completed fully, maybe visually disable button but allow edit
  const percentage = task.endOfDayReport ? task.endOfDayReport.percentageComplete : 0;
  const isComplete = task.status === 'COMPLETED' || percentage >= 100;

  return (
    <>
      <Button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }} 
        size="sm" 
        variant="outline" 
        className="gap-2 text-xs bg-white text-gray-700 hover:bg-gray-50 border-gray-200 shadow-sm disabled:opacity-50"
      >
        <FileEdit className="w-3.5 h-3.5" />
        {task.endOfDayReport ? 'Update Report' : 'Write Report'}
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Specific Task Report"
        description="Submit granular accountability updates tracking exact progress against this specific task."
      >
        <ReportTaskForm task={task} onSuccess={() => setIsOpen(false)} />
      </SlideInPanel>
    </>
  );
}
