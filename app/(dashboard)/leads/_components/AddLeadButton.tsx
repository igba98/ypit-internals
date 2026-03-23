'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AddLeadForm } from './AddLeadForm';
import { Plus } from 'lucide-react';

export function AddLeadButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Lead
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New Lead"
        description="Enter the potential student's contact details and initial interests to begin tracking."
      >
        <AddLeadForm onSuccess={() => setIsOpen(false)} />
      </SlideInPanel>
    </>
  );
}
