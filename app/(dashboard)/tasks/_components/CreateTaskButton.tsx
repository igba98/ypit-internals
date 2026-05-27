'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { CreateTaskForm } from './CreateTaskForm';
import { Plus } from 'lucide-react';

export function CreateTaskButton({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary hover:bg-primary-light text-white">
        <Plus className="w-4 h-4" />
        Create Task
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Task"
        description="Personal reminder or work for a teammate — same form, both supported."
      >
        <CreateTaskForm onSuccess={() => setIsOpen(false)} currentUserId={currentUserId} />
      </SlideInPanel>
    </>
  );
}
