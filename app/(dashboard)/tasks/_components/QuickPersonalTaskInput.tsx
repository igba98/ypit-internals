'use client';

import { useState, useTransition } from 'react';
import { addTask } from '@/lib/actions/taskActions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

export function QuickPersonalTaskInput() {
  const [title, setTitle] = useState('');
  const [pending, start] = useTransition();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 5) {
      toast.error('Title must be at least 5 characters.');
      return;
    }
    start(async () => {
      const dueDate = new Date();
      dueDate.setHours(17, 0, 0, 0);
      const f = new FormData();
      f.append('title', trimmed);
      f.append('description', 'Quick personal task added from My Day.');
      f.append('priority', 'MEDIUM');
      f.append('dueDate', dueDate.toISOString().slice(0, 10));
      const r = await addTask(null, f);
      if (r.success) {
        setTitle('');
        toast.success('Personal task added.');
      } else {
        toast.error(r.message);
      }
    });
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative">
        <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick personal task…"
          className="pl-7 w-64"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? 'Adding…' : 'Add'}
      </Button>
    </form>
  );
}
