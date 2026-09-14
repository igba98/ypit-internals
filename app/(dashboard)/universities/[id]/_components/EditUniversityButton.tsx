'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { University } from '@/types';
import { UniversityForm } from '../../../finance/catalog/_components/UniversityForm';

export function EditUniversityButton({ university }: { university: University }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Pencil className="w-4 h-4" /> Edit
      </Button>
      {open && <UniversityForm mode="edit" university={university} onClose={() => setOpen(false)} />}
    </>
  );
}
