'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { PaymentSheet, StudentOption } from './PaymentSheet';
import { DollarSign } from 'lucide-react';

export function RecordPaymentButton({ students }: { students: StudentOption[] }) {
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
        title="Fees &amp; payments"
        description="Set each fee and record what has been paid - all fee types in one save."
      >
        <PaymentSheet students={students} onDone={() => setIsOpen(false)} />
      </SlideInPanel>
    </>
  );
}
