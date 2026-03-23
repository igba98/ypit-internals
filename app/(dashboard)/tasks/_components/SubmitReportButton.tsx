'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { SubmitReportForm } from './SubmitReportForm';
import { FileText } from 'lucide-react';

export function SubmitReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2 bg-white hover:bg-gray-50 text-gray-700">
        <FileText className="w-4 h-4" />
        Submit Report
      </Button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="End of Day Report"
        description="Submit your daily activities and log completed items."
      >
        <SubmitReportForm onSuccess={() => setIsOpen(false)} />
      </SlideInPanel>
    </>
  );
}
