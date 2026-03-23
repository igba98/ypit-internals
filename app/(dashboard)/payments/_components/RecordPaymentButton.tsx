'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { RecordPaymentForm } from './RecordPaymentForm';
import { DollarSign } from 'lucide-react';

export function RecordPaymentButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary hover:bg-primary-light text-white">
        <DollarSign className="w-4 h-4" />
        Record Payment
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record New Payment"
        description="Log a financial transaction against a student's standing balance."
      >
        <RecordPaymentForm onSuccess={() => setIsOpen(false)} />
      </SlideInPanel>
    </>
  );
}
