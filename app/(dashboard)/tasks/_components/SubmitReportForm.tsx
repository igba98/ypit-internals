'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function SubmitReportForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    
    // Simulate server action delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast.success("Daily report submitted successfully!");
    setIsPending(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Report Date</Label>
        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tasksCompleted">Tasks Completed Today</Label>
        <Input id="tasksCompleted" name="tasksCompleted" type="number" min="0" required placeholder="e.g. 5" />
      </div>

      <div className="space-y-2 pb-2">
        <Label htmlFor="summary">End of Day Summary *</Label>
        <Textarea id="summary" name="summary" required placeholder="What did you accomplish today?" className="h-24" />
      </div>

       <div className="space-y-2 pb-4">
        <Label htmlFor="roadblocks">Roadblocks or Issues (Optional)</Label>
        <Textarea id="roadblocks" name="roadblocks" placeholder="Any blockers for tomorrow?" className="h-20" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
