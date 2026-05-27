'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Guardian, GuardianRelation } from '@/types';
import { addGuardian, deleteGuardian, setPrimaryGuardian } from '@/lib/actions/guardianActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Star, Plus } from 'lucide-react';

interface Props {
  studentId: string;
  guardians: Guardian[];
}

const RELATIONS: GuardianRelation[] = ['MOTHER', 'FATHER', 'GUARDIAN', 'SPONSOR', 'OTHER'];

export function GuardiansSection({ studentId, guardians }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    formData.set('studentId', studentId);
    startTransition(async () => {
      const result = await addGuardian(null, formData);
      if (result.success) { toast.success(result.message); setOpen(false); }
      else toast.error(result.message);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteGuardian(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handleMakePrimary(id: string) {
    startTransition(async () => {
      const result = await setPrimaryGuardian(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Guardians ({guardians.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus size={14} className="mr-1" /> Add Guardian</Button>
      </div>

      {guardians.length === 0 && <p className="text-sm text-gray-500">No guardians on file. Add one so parent notifications can be sent.</p>}

      <ul className="space-y-2">
        {guardians.map(g => (
          <li key={g.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3 bg-white">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {g.fullName} <span className="text-xs text-gray-500">({g.relation.toLowerCase()})</span>
                {g.isPrimary && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Primary</span>}
              </p>
              <p className="text-xs text-gray-500">{g.phone}{g.whatsapp ? ` · WhatsApp ${g.whatsapp}` : ''}{g.email ? ` · ${g.email}` : ''}</p>
            </div>
            <div className="flex items-center gap-1">
              {!g.isPrimary && <Button size="sm" variant="ghost" onClick={() => handleMakePrimary(g.id)} disabled={isPending} title="Make primary"><Star size={14} /></Button>}
              <Button size="sm" variant="ghost" onClick={() => handleDelete(g.id)} disabled={isPending} title="Delete"><Trash2 size={14} className="text-red-600" /></Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Guardian</DialogTitle></DialogHeader>
          <form action={handleAdd} className="space-y-3">
            <div><Label>Full name *</Label><Input name="fullName" required /></div>
            <div>
              <Label>Relation *</Label>
              <select name="relation" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" defaultValue="MOTHER">
                {RELATIONS.map(r => <option key={r} value={r}>{r.toLowerCase()}</option>)}
              </select>
            </div>
            <div><Label>Phone *</Label><Input name="phone" required placeholder="+255..." /></div>
            <div><Label>WhatsApp (if different)</Label><Input name="whatsapp" placeholder="+255..." /></div>
            <div><Label>Email</Label><Input name="email" type="email" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="isPrimary" name="isPrimary" /><Label htmlFor="isPrimary">Mark as primary contact</Label></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Adding…' : 'Add Guardian'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}