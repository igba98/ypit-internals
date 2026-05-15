'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusSelect } from '@/components/shared/StatusSelect';
import { PAYROLL_STATUS_OPTIONS } from '@/lib/statusOptions';
import {
  approveAllPayroll,
  generatePayroll,
  markAllPaidForPeriod,
  updatePayrollStatus,
} from '@/lib/actions/payrollActions';
import { CheckCircle2, Banknote, PlayCircle, Loader2 } from 'lucide-react';

interface PayrollHeaderActionsProps {
  currentPeriod: string;
  currentPeriodStart: string;
  hasDraft: boolean;
  hasApproved: boolean;
  needsGeneration: boolean;
}

export function PayrollHeaderActions({
  currentPeriod,
  currentPeriodStart,
  hasDraft,
  hasApproved,
  needsGeneration,
}: PayrollHeaderActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const dispatch = (fn: () => Promise<{ success: boolean; message: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {needsGeneration && (
        <Button
          onClick={() => dispatch(() => generatePayroll(currentPeriodStart))}
          disabled={isPending}
          className="gap-2 bg-primary hover:bg-primary-light text-white"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
          Generate {currentPeriod}
        </Button>
      )}
      {hasDraft && (
        <Button
          variant="outline"
          onClick={() => dispatch(() => approveAllPayroll(currentPeriod))}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Approve All Drafts
        </Button>
      )}
      {hasApproved && (
        <Button
          onClick={() => dispatch(() => markAllPaidForPeriod(currentPeriod))}
          disabled={isPending}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
          Pay All Approved
        </Button>
      )}
    </div>
  );
}

export function PayrollRowStatus({ payrollId, value }: { payrollId: string; value: string }) {
  return (
    <StatusSelect
      value={value}
      options={PAYROLL_STATUS_OPTIONS}
      action={next => updatePayrollStatus(payrollId, next)}
      editable
      size="sm"
    />
  );
}
