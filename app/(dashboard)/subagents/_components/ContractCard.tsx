'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ActionResult,
  ContractStatus,
  SubAgentContract,
} from '@/types';
import { formatDate } from '@/lib/utils';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileSignature, Pencil } from 'lucide-react';
import { upsertSubAgentContract } from '@/lib/actions/subagentActions';

const CONTRACT_BADGE: Record<ContractStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-amber-100 text-amber-800',
  TERMINATED: 'bg-red-100 text-red-800',
};

interface Props {
  subAgentId: string;
  subAgentName: string;
  contract: SubAgentContract | null;
  canEdit: boolean;
}

export function ContractCard({ subAgentId, subAgentName, contract, canEdit }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
          <FileSignature className="w-4 h-4" /> Contract & KPIs
        </h3>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            {contract ? 'Edit' : 'Set Up'}
          </Button>
        )}
      </div>

      {contract ? (
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Status</dt>
            <dd>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CONTRACT_BADGE[contract.status]}`}>
                {contract.status}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Period</dt>
            <dd className="text-gray-900 font-medium">
              {contract.startDate ? formatDate(contract.startDate) : '—'} → {contract.endDate ? formatDate(contract.endDate) : '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Signed</dt>
            <dd className="text-gray-900 font-medium">{contract.signedAt ? formatDate(contract.signedAt) : 'Not signed'}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Student target (KPI)</dt>
            <dd className="text-gray-900 font-bold">{contract.studentTarget || '—'}</dd>
          </div>
          {contract.commissionTerms && (
            <div>
              <dt className="text-gray-500 mb-1">Commission terms</dt>
              <dd className="text-gray-900 text-xs bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{contract.commissionTerms}</dd>
            </div>
          )}
          {contract.notes && (
            <div>
              <dt className="text-gray-500 mb-1">Notes</dt>
              <dd className="text-gray-700 text-xs whitespace-pre-wrap">{contract.notes}</dd>
            </div>
          )}
          {contract.lastFollowUpAt && (
            <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
              Last follow-up: {formatDate(contract.lastFollowUpAt)}
            </p>
          )}
        </dl>
      ) : (
        <p className="text-sm text-gray-500">
          No contract on file yet.{canEdit ? ' Click "Set Up" to record the agreement and KPI target.' : ''}
        </p>
      )}

      <SlideInPanel
        isOpen={editing}
        onClose={() => setEditing(false)}
        title={`Contract · ${subAgentName}`}
        description="Agreement terms, period, and the student KPI target."
      >
        <ContractForm
          subAgentId={subAgentId}
          contract={contract}
          onSuccess={() => setEditing(false)}
        />
      </SlideInPanel>
    </div>
  );
}

function ContractForm({
  subAgentId,
  contract,
  onSuccess,
}: {
  subAgentId: string;
  contract: SubAgentContract | null;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> =>
      upsertSubAgentContract(subAgentId, _prev, formData),
    null,
  );
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
      onSuccess();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router, onSuccess]);

  const d = (v?: string | null) => (v ? v.slice(0, 10) : undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select id="status" name="status" required defaultValue={contract?.status ?? 'DRAFT'}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentTarget">Student target (KPI) *</Label>
          <Input
            id="studentTarget"
            name="studentTarget"
            type="number"
            min={0}
            defaultValue={contract?.studentTarget ?? 0}
            required
          />
          {errors.studentTarget && <p className="text-xs text-red-600">{errors.studentTarget[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={d(contract?.startDate)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={d(contract?.endDate)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signedAt">Date signed</Label>
        <Input id="signedAt" name="signedAt" type="date" defaultValue={d(contract?.signedAt)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="commissionTerms">Commission terms</Label>
        <Textarea
          id="commissionTerms"
          name="commissionTerms"
          rows={3}
          defaultValue={contract?.commissionTerms ?? ''}
          placeholder="e.g. TZS 200,000 per travelled student; bonus above 10 students."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={contract?.notes ?? ''} placeholder="Agreement details, pending items..." />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Contract'}
        </Button>
      </div>
    </form>
  );
}
