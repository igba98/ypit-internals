'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Megaphone,
  Phone,
  MessageSquare,
  Mail,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Campaign, CampaignChannel, CampaignStatus } from '@/types';
import { retryCampaign } from '@/lib/actions/campaignActions';

const CHANNEL_META: Record<
  CampaignChannel,
  { icon: typeof Phone; badge: string }
> = {
  SMS: { icon: Phone, badge: 'bg-blue-50 text-blue-700' },
  WHATSAPP: { icon: MessageSquare, badge: 'bg-green-50 text-green-700' },
  EMAIL: { icon: Mail, badge: 'bg-purple-50 text-purple-700' },
};

const STATUS_BADGE: Record<CampaignStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENDING: 'bg-amber-100 text-amber-800',
  SENT: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  FAILED: 'bg-red-100 text-red-800',
};

export function HistoryTable({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const onRetry = (c: Campaign) => {
    if (
      !confirm(
        `Resend "${c.name}" (${c.channel}) to everyone in ${c.group?.name ?? 'this group'}? Every contact gets the message again.`,
      )
    )
      return;
    setRetryingId(c.id);
    startTransition(async () => {
      const res = await retryCampaign(c.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
      setRetryingId(null);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">Campaign History</h2>
        <span className="ml-auto text-xs text-gray-400">
          {campaigns.length} sent
        </span>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No campaigns sent yet.
        </p>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
          {campaigns.map((c) => {
            const meta = CHANNEL_META[c.channel];
            const Icon = meta.icon;
            const canRetry =
              c.status === 'FAILED' || c.status === 'PARTIAL' || c.status === 'SENT';
            return (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}
                  >
                    <Icon className="w-3 h-3" /> {c.channel}
                  </span>
                  <p className="font-medium text-gray-900 truncate flex-1">
                    {c.name}
                  </p>
                  {canRetry && (
                    <button
                      onClick={() => onRetry(c)}
                      disabled={busy && retryingId === c.id}
                      title="Resend this campaign to the group"
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                        c.status === 'FAILED' || c.status === 'PARTIAL'
                          ? 'text-primary hover:bg-primary/10'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {busy && retryingId === c.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Retry
                    </button>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${STATUS_BADGE[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                  <span>
                    To{' '}
                    <b className="text-gray-700">
                      {c.group?.name ?? c.groupName ?? '-'}
                    </b>
                    {!c.group && c.groupName ? ' (group deleted)' : ''}
                  </span>
                  <span className="text-emerald-600">{c.sentCount} sent</span>
                  {c.failedCount > 0 && (
                    <span className="text-red-600">{c.failedCount} failed</span>
                  )}
                  {c.skippedCount > 0 && (
                    <span className="text-amber-600">
                      {c.skippedCount} skipped
                    </span>
                  )}
                  <span className="ml-auto">
                    {c.sentAt ? formatDate(c.sentAt) : formatDate(c.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
