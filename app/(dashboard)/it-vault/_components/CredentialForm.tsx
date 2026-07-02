'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, Loader2, Plus } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CompanyCredential, CredentialCategory } from '@/types';
import {
  createCredential,
  updateCredential,
} from '@/lib/actions/vaultActions';

const CATEGORIES: { value: CredentialCategory; label: string }[] = [
  { value: 'EMAIL', label: 'Email Account' },
  { value: 'HOSTING', label: 'Hosting / Server' },
  { value: 'DOMAIN', label: 'Domain / DNS' },
  { value: 'SAAS', label: 'SaaS / Software' },
  { value: 'WIFI', label: 'Wi-Fi / Network' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'OTHER', label: 'Other' },
];

export function AddCredentialButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> Add Credential
      </Button>
      <SlideInPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add Credential"
        description="Stored encrypted. Only IT and the CEO can see this vault."
      >
        <CredentialForm onDone={() => setOpen(false)} />
      </SlideInPanel>
    </>
  );
}

export function CredentialForm({
  existing,
  onDone,
}: {
  existing?: CompanyCredential;
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [service, setService] = useState(existing?.service ?? '');
  const [category, setCategory] = useState<CredentialCategory>(
    existing?.category ?? 'OTHER',
  );
  const [username, setUsername] = useState(existing?.username ?? '');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState(existing?.url ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const submit = () => {
    if (service.trim().length < 2) return toast.error('Name the service.');
    if (!username.trim()) return toast.error('Enter the username / account.');
    if (!existing && !password) return toast.error('Enter the password.');

    startTransition(async () => {
      const payload = {
        service: service.trim(),
        category,
        username: username.trim(),
        // On edit, an empty password field means "keep the stored secret".
        ...(password ? { password } : {}),
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      const res = existing
        ? await updateCredential(existing.id, payload)
        : await createCredential({ ...payload, password });
      if (res.success) {
        toast.success(res.message);
        onDone();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="service">Service *</Label>
          <Input
            id="service"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="e.g. Office Wi-Fi, cPanel, Instagram"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as CredentialCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="username">Username / Account *</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin@ypit.co.tz"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            {existing ? 'New password (leave blank to keep)' : 'Password *'}
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={existing ? '••••••••' : 'Secret to store'}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. 2FA on the IT phone; recovery codes in the safe."
        />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <KeyRound className="w-4 h-4" />
          )}
          {existing ? 'Save changes' : 'Store credential'}
        </Button>
      </div>
    </div>
  );
}
