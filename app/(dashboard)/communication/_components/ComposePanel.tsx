'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CampaignChannel, ContactGroup } from '@/types';
import { createCampaign } from '@/lib/actions/campaignActions';

const CHANNELS: {
  key: CampaignChannel;
  label: string;
  icon: typeof Phone;
}[] = [
  { key: 'SMS', label: 'SMS', icon: Phone },
  { key: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { key: 'EMAIL', label: 'Email', icon: Mail },
];

export function ComposePanel({ groups }: { groups: ContactGroup[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [channel, setChannel] = useState<CampaignChannel>('SMS');
  const [groupId, setGroupId] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const selectedGroup = groups.find((g) => g.id === groupId);

  const reset = () => {
    setName('');
    setSubject('');
    setMessage('');
  };

  const onSend = () => {
    if (!groupId) return toast.error('Pick a contact group.');
    if (name.trim().length < 2) return toast.error('Name this campaign.');
    if (message.trim().length < 2) return toast.error('Write a message.');
    if (channel === 'EMAIL' && subject.trim().length === 0) {
      return toast.error('Email needs a subject.');
    }
    const recipients = selectedGroup?.contactCount ?? 0;
    if (
      !confirm(
        `Send this ${channel} campaign to ${recipients} contact${
          recipients === 1 ? '' : 's'
        } in "${selectedGroup?.name}"?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await createCampaign({
        name: name.trim(),
        groupId,
        channel,
        subject: channel === 'EMAIL' ? subject.trim() : undefined,
        message: message.trim(),
      });
      if (res.success) {
        toast.success(res.message);
        reset();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Send className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">Compose Campaign</h2>
      </div>

      <div className="p-4 space-y-4">
        {groups.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            Import a contact group first, then come back to send a message.
          </p>
        ) : (
          <>
            <div>
              <Label>Channel</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {CHANNELS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setChannel(c.key)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
                      channel === c.key
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <c.icon className="w-4 h-4" /> {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Contact group</Label>
              <CustomSelect
                name="groupId"
                options={groups.map((g) => ({
                  value: g.id,
                  label: `${g.name} (${g.contactCount})`,
                }))}
                placeholder="Select a group…"
                onChange={setGroupId}
              />
              {selectedGroup && (
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {selectedGroup.contactCount}{' '}
                  recipient{selectedGroup.contactCount === 1 ? '' : 's'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="campaignName">Campaign name (internal)</Label>
              <Input
                id="campaignName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. June open-day reminder"
                maxLength={160}
              />
            </div>

            {channel === 'EMAIL' && (
              <div>
                <Label htmlFor="subject">Email subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line"
                  maxLength={200}
                />
              </div>
            )}

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={4000}
                placeholder={'Hi {{firstName}}, …'}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                <span>
                  Use <code className="text-gray-500">{'{{name}}'}</code> or{' '}
                  <code className="text-gray-500">{'{{firstName}}'}</code> to
                  personalise.
                </span>
                <span>{message.length}/4000</span>
              </div>
            </div>

            <Button onClick={onSend} disabled={busy} className="gap-2 w-full">
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send campaign
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
