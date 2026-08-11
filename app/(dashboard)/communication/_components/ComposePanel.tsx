'use client';

import { useRef, useState, useTransition } from 'react';
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
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CampaignChannel, CampaignContact, ContactGroup } from '@/types';
import {
  createCampaign,
  getContactGroup,
} from '@/lib/actions/campaignActions';

const CHANNELS: {
  key: CampaignChannel;
  label: string;
  icon: typeof Phone;
}[] = [
  { key: 'SMS', label: 'SMS', icon: Phone },
  { key: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { key: 'EMAIL', label: 'Email', icon: Mail },
];

/** The tags staff can drop into a message. Must match the backend's
 *  personalisePlain() substitutions exactly. */
const TAGS: { tag: string; label: string }[] = [
  { tag: '{{name}}', label: 'Full name' },
  { tag: '{{firstName}}', label: 'First name' },
  { tag: '{{studentName}}', label: 'Student name' },
  { tag: '{{relation}}', label: 'Relation' },
];

/** Sample used for the preview until a real contact is loaded. */
const SAMPLE: Pick<
  CampaignContact,
  'fullName' | 'studentName' | 'relation'
> = {
  fullName: 'Asha Mwita',
  studentName: 'Brian Mwita',
  relation: 'Mother',
};

/** Mirror of the backend substitution so the preview is truthful. */
function applyTags(
  message: string,
  c: { fullName: string; studentName?: string | null; relation?: string | null },
): string {
  const fullName = c.fullName.trim();
  const first = fullName.split(/\s+/)[0] || fullName;
  return message
    .replace(/\{\{\s*firstName\s*\}\}/gi, first)
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*studentName\s*\}\}/gi, c.studentName ?? '')
    .replace(/\{\{\s*relation\s*\}\}/gi, c.relation ?? '');
}

export function ComposePanel({ groups }: { groups: ContactGroup[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [channel, setChannel] = useState<CampaignChannel>('SMS');
  const [groupId, setGroupId] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // First contact of the selected group — makes the preview show a real person.
  const [previewContact, setPreviewContact] = useState<CampaignContact | null>(
    null,
  );

  const selectedGroup = groups.find((g) => g.id === groupId);

  const onGroupChange = (id: string) => {
    setGroupId(id);
    setPreviewContact(null);
    if (!id) return;
    startTransition(async () => {
      const res = await getContactGroup(id);
      if (res.success && res.group?.contacts?.length) {
        setPreviewContact(res.group.contacts[0]);
      }
    });
  };

  /** Insert a tag at the cursor (or append) and refocus the textarea. */
  const insertTag = (tag: string) => {
    const el = messageRef.current;
    if (!el) {
      setMessage((m) => m + tag);
      return;
    }
    const start = el.selectionStart ?? message.length;
    const end = el.selectionEnd ?? message.length;
    const next = message.slice(0, start) + tag + message.slice(end);
    setMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + tag.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const previewSource = previewContact ?? SAMPLE;
  const preview = applyTags(message, previewSource);

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
                onChange={onGroupChange}
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
                ref={messageRef}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                <span>Click a tag below to insert the recipient&apos;s details.</span>
                <span>{message.length}/4000</span>
              </div>

              {/* ── Name tags: click to insert at the cursor ── */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {TAGS.map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => insertTag(t.tag)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-primary/30 bg-primary/5 text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors"
                    title={`Insert ${t.tag}`}
                  >
                    <span className="font-mono">{t.tag}</span>
                    <span className="text-gray-500">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* ── Live preview with a real recipient from the group ── */}
              {message.trim() && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Preview as {previewSource.fullName}
                    <span className="font-normal normal-case tracking-normal text-gray-400">
                      {previewContact
                        ? '(first contact in this group)'
                        : '(example — pick a group for a real contact)'}
                    </span>
                  </p>
                  <p className="mt-1.5 text-sm text-gray-800 whitespace-pre-wrap">
                    {preview}
                  </p>
                </div>
              )}
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
