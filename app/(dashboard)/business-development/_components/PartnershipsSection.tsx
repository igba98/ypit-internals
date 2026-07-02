'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Handshake,
  Loader2,
  Mail,
  MessageSquarePlus,
  Pencil,
  Phone,
  ScrollText,
} from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PartnershipRow, PartnershipStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  upsertPartnership,
  logPartnershipFollowUp,
} from '@/lib/actions/businessDevActions';

const STATUSES: { value: PartnershipStatus; label: string }[] = [
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'IN_DISCUSSION', label: 'In Discussion' },
  { value: 'MOU_SIGNED', label: 'MOU Signed' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DORMANT', label: 'Dormant' },
  { value: 'ENDED', label: 'Ended' },
];

const STATUS_BADGE: Record<PartnershipStatus, string> = {
  PROSPECT: 'bg-gray-100 text-gray-600',
  IN_DISCUSSION: 'bg-blue-100 text-blue-800',
  MOU_SIGNED: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-green-100 text-green-800',
  DORMANT: 'bg-amber-100 text-amber-800',
  ENDED: 'bg-red-100 text-red-700',
};

export function PartnershipsSection({
  rows,
  canEdit,
}: {
  rows: PartnershipRow[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<PartnershipRow | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Handshake className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">University Partnerships</h2>
        <span className="text-xs text-gray-400">
          {rows.length} universit{rows.length === 1 ? 'y' : 'ies'} in catalog
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10 px-4">
          No universities in the catalog yet — add them under Finance → Catalog,
          then manage the partnership here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">University</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Partnership</th>
                <th className="px-4 py-3 font-medium">MOUs</th>
                <th className="px-4 py-3 font-medium">Last Contact</th>
                {canEdit && (
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr
                  key={r.universityId}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {[r.city, r.country].filter(Boolean).join(', ')}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                      {r.contactName && <span>{r.contactName}</span>}
                      {r.contactEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {r.contactEmail}
                        </span>
                      )}
                      {r.contactPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {r.contactPhone}
                        </span>
                      )}
                      {!r.contactName && !r.contactEmail && !r.contactPhone && '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_BADGE[r.partnership?.status ?? 'PROSPECT']
                      }`}
                    >
                      {(r.partnership?.status ?? 'PROSPECT').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <ScrollText className="w-3.5 h-3.5 text-gray-400" />
                      {r.mouCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {r.partnership?.lastContactAt
                      ? formatDate(r.partnership.lastContactAt)
                      : '—'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setEditing(r)}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Manage
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlideInPanel
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Partnership · ${editing.name}` : 'Partnership'}
        description="Track the relationship status and log every contact."
      >
        {editing && (
          <PartnershipForm row={editing} onDone={() => setEditing(null)} />
        )}
      </SlideInPanel>
    </div>
  );
}

function PartnershipForm({
  row,
  onDone,
}: {
  row: PartnershipRow;
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [status, setStatus] = useState<PartnershipStatus>(
    row.partnership?.status ?? 'PROSPECT',
  );
  const [commissionTerms, setCommissionTerms] = useState(
    row.partnership?.commissionTerms ?? '',
  );
  const [notes, setNotes] = useState(row.partnership?.notes ?? '');
  const [lastContactAt, setLastContactAt] = useState(
    row.partnership?.lastContactAt?.slice(0, 10) ?? '',
  );
  const [followUp, setFollowUp] = useState('');

  const save = () => {
    startTransition(async () => {
      const res = await upsertPartnership(row.universityId, {
        status,
        commissionTerms: commissionTerms.trim() || null,
        notes: notes.trim() || null,
        lastContactAt: lastContactAt || null,
      });
      if (res.success) {
        toast.success(res.message);
        onDone();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const logContact = () => {
    if (followUp.trim().length < 2) {
      return toast.error('Write what was discussed.');
    }
    startTransition(async () => {
      const res = await logPartnershipFollowUp(row.universityId, followUp.trim());
      if (res.success) {
        toast.success(res.message);
        setFollowUp('');
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const history = row.partnership?.followUps ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="pa-status">Status</Label>
          <Select
            id="pa-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PartnershipStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pa-last">Last contact</Label>
          <Input
            id="pa-last"
            type="date"
            value={lastContactAt}
            onChange={(e) => setLastContactAt(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pa-comm">Commission terms</Label>
        <Input
          id="pa-comm"
          value={commissionTerms}
          onChange={(e) => setCommissionTerms(e.target.value)}
          placeholder="e.g. 15% of first-year tuition"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pa-notes">Notes</Label>
        <Textarea
          id="pa-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Key people, terms under discussion, history…"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy} className="gap-2">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Handshake className="w-4 h-4" />
          )}
          Save partnership
        </Button>
      </div>

      <div className="pt-4 border-t border-gray-100 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Follow-up log
        </p>
        <div className="flex gap-2">
          <Input
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            placeholder="e.g. Call with admissions office — agreed to draft MOU"
          />
          <Button
            variant="outline"
            onClick={logContact}
            disabled={busy}
            className="gap-1.5 shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4" /> Log
          </Button>
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-gray-400">No follow-ups logged yet.</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {history.map((f) => (
              <li
                key={f.id}
                className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
              >
                <p className="text-gray-800">{f.notes}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {f.createdByName} · {formatDate(f.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
