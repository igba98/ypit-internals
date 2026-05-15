'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AddLeadForm } from './AddLeadForm';
import { UserPlus } from 'lucide-react';

export function AddLeadButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary hover:bg-primary-light text-white">
        <UserPlus className="w-4 h-4" />
        Add Employee Lead
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Employee Lead"
        description="Onboard a new marketing staff member or sub-agent into the system."
      >
        <AddLeadForm onSuccess={() => setIsOpen(false)} />
      </SlideInPanel>
    </>
  );
}
