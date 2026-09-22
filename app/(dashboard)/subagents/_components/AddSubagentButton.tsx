'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { AddStaffForm } from '../../staff/_components/AddStaffForm';

export function AddSubagentButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="w-4 h-4" /> Add Sub-agent
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add Sub-agent"
        description="Creates the agent's login and their agent code for website applications."
      >
        <AddStaffForm
          presetRole="SUB_AGENT"
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </SlideInPanel>
    </>
  );
}
