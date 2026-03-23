'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AddStudentForm } from './AddStudentForm';
import { UserPlus } from 'lucide-react';

export function AddStudentButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary hover:bg-primary-light text-white">
        <UserPlus className="w-4 h-4" />
        Add Student
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New Student"
        description="Onboard a new student into the active tracking pipeline safely."
      >
        <AddStudentForm onSuccess={() => setIsOpen(false)} />
      </SlideInPanel>
    </>
  );
}
