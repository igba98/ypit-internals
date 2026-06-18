'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AddStudentLeadForm } from './AddStudentLeadForm';
import { UserPlus } from 'lucide-react';

export function AddStudentLeadButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-primary hover:bg-primary-light text-white"
      >
        <UserPlus className="w-4 h-4" />
        Add Student Lead
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Student Lead"
        description="Capture a prospective student. They enter the leads pipeline and can be converted to a student later."
      >
        <AddStudentLeadForm
          onSuccess={() => {
            setIsOpen(false);
            router.refresh();
          }}
        />
      </SlideInPanel>
    </>
  );
}
