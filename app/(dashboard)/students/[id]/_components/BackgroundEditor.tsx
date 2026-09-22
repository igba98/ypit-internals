'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Pencil, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateStudentBackground } from '@/lib/actions/studentActions';

/** Previous school / college - editable inline by whoever can edit the student. */
export function BackgroundEditor({
  studentId,
  previousSchool,
  canEdit,
}: {
  studentId: string;
  previousSchool?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(previousSchool ?? '');

  const save = () =>
    startTransition(async () => {
      const res = await updateStudentBackground(studentId, { previousSchool: value.trim() || null });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success('Previous school saved.');
      setEditing(false);
      router.refresh();
    });

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 flex items-start gap-3">
      <School className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Previous school / college</p>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. Feza Boys Secondary School (A-level, 2025)" className="h-8 text-sm" autoFocus />
            <Button size="sm" onClick={save} disabled={busy} className="h-8">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8">Cancel</Button>
          </div>
        ) : (
          <p className={`text-sm mt-0.5 ${previousSchool ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
            {previousSchool || 'Not recorded yet'}
          </p>
        )}
      </div>
      {canEdit && !editing && (
        <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-primary p-1" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
