'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PackagePlus } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { issueEquipment } from '@/lib/actions/equipmentActions';

const todayISO = () => new Date().toISOString().slice(0, 10);

interface StaffOption {
  id: string;
  fullName: string;
}

export function IssueEquipmentButton({ staff }: { staff: StaffOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 bg-primary hover:bg-primary-light text-white">
        <PackagePlus className="w-4 h-4" />
        Issue Equipment
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Issue Equipment"
        description="Record an asset handed to a staff member. They must return it before being cleared to leave."
      >
        <IssueForm staff={staff} onSuccess={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

function IssueForm({ staff, onSuccess }: { staff: StaffOption[]; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(issueEquipment, null);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="staffId">Staff Member *</Label>
        <Select id="staffId" name="staffId" required defaultValue="">
          <option value="" disabled>Choose a staff member...</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName}</option>
          ))}
        </Select>
        {errors.staffId && <p className="text-xs text-red-600">{errors.staffId[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Item Name *</Label>
        <Input id="name" name="name" placeholder="e.g. MacBook Pro 14, Office key, SIM card" required />
        {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select id="category" name="category" required defaultValue="LAPTOP">
            <option value="LAPTOP">Laptop</option>
            <option value="DESKTOP">Desktop</option>
            <option value="PHONE">Phone</option>
            <option value="MONITOR">Monitor</option>
            <option value="PRINTER">Printer</option>
            <option value="FURNITURE">Furniture</option>
            <option value="ACCESSORY">Accessory</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input id="serialNumber" name="serialNumber" placeholder="S/N if applicable" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="conditionOut">Condition at Issue *</Label>
          <Select id="conditionOut" name="conditionOut" required defaultValue="GOOD">
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="DAMAGED">Damaged (pre-existing)</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="issuedAt">Issue Date *</Label>
          <Input id="issuedAt" name="issuedAt" type="date" required defaultValue={todayISO()} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} placeholder="Specs, accessories included, etc." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Optional remarks" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Issuing...' : 'Issue Equipment'}
        </Button>
      </div>
    </form>
  );
}
