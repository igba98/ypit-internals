'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { PaymentRecord } from '@/types';
import { PaymentSheet } from '../../_components/PaymentSheet';

export function EditPaymentButton({ record }: { record: PaymentRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Wallet className="w-4 h-4" /> Fees &amp; payments
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Fees & payments · ${record.studentName}`}
        description="Set each fee and record what has been paid. Use Correct / clear to fix an amount typed wrongly."
      >
        <PaymentSheet
          students={[]}
          initialStudentId={record.studentId}
          initialRecord={record}
          onDone={() => setOpen(false)}
        />
      </SlideInPanel>
    </>
  );
}
