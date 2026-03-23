'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AddStaffForm } from './AddStaffForm';
import { UserPlus } from 'lucide-react';

export function AddStaffButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary hover:bg-primary-light text-white">
        <UserPlus className="w-4 h-4" />
        Add Staff
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Onboard New Staff"
        description="Register a new internal team member granting them system authorizations."
      >
        <AddStaffForm onSuccess={() => setIsOpen(false)} />
      </SlideInPanel>
    </>
  );
}
