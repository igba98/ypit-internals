'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BdEvent, BdEventStatus, BdEventType } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  createBdEvent,
  updateBdEvent,
  deleteBdEvent,
} from '@/lib/actions/businessDevActions';

const TYPES: { value: BdEventType; label: string }[] = [
  { value: 'SCHOOL_VISIT', label: 'School Visit' },
  { value: 'EXPO', label: 'Expo / Fair' },
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'OPEN_DAY', label: 'Open Day' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'OTHER', label: 'Other' },
];

const STATUSES: { value: BdEventStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE: Record<BdEventStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export function EventsSection({
  events,
  canEdit,
}: {
  events: BdEvent[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BdEvent | null>(null);

  const onDelete = (e: BdEvent) => {
    if (!confirm(`Delete event "${e.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteBdEvent(e.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">Events</h2>
        <span className="text-xs text-gray-400">{events.length} total</span>
        {canEdit && (
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> New Event
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Venue</th>
              <th className="px-4 py-3 font-medium">Budget (TSh)</th>
              <th className="px-4 py-3 font-medium">Leads</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canEdit && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-gray-900">{e.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {TYPES.find((t) => t.value === e.type)?.label ?? e.type}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                  {formatDate(e.eventDate)}
                  {e.endDate && <> → {formatDate(e.endDate)}</>}
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-600">{e.venue ?? '-'}</td>
                <td className="px-4 py-3.5 text-xs text-gray-600">
                  {e.budget != null ? e.budget.toLocaleString() : '-'}
                </td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    {e.leadsGenerated}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[e.status]}`}>
                    {e.status}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(e)}
                        className="text-gray-400 hover:text-primary p-1.5 rounded-md hover:bg-gray-100"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(e)}
                        disabled={busy}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"
                        title="Delete"
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="text-center py-12 text-gray-500">
                  No events yet.{canEdit ? ' Create the first one with “New Event”.' : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? `Edit · ${editing.name}` : 'New Event'}
        description="School visits, expos, seminars, open days and webinars."
      >
        <EventForm
          existing={editing ?? undefined}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </SlideInPanel>
    </div>
  );
}

function EventForm({
  existing,
  onDone,
}: {
  existing?: BdEvent;
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<BdEventType>(existing?.type ?? 'SCHOOL_VISIT');
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [eventDate, setEventDate] = useState(existing?.eventDate?.slice(0, 10) ?? '');
  const [endDate, setEndDate] = useState(existing?.endDate?.slice(0, 10) ?? '');
  const [budget, setBudget] = useState(existing?.budget != null ? String(existing.budget) : '');
  const [status, setStatus] = useState<BdEventStatus>(existing?.status ?? 'PLANNED');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [outcomes, setOutcomes] = useState(existing?.outcomes ?? '');
  const [leads, setLeads] = useState(String(existing?.leadsGenerated ?? 0));

  const submit = () => {
    if (name.trim().length < 2) return toast.error('Name the event.');
    if (!eventDate) return toast.error('Pick the event date.');

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        type,
        venue: venue.trim() || undefined,
        eventDate,
        endDate: endDate || undefined,
        budget: budget !== '' ? Number(budget) : undefined,
        status,
        description: description.trim() || undefined,
        outcomes: outcomes.trim() || undefined,
        leadsGenerated: Number(leads) || 0,
      };
      const res = existing
        ? await updateBdEvent(existing.id, payload)
        : await createBdEvent(payload);
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
      <div className="space-y-2">
        <Label htmlFor="ev-name">Event name *</Label>
        <Input
          id="ev-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Feza Schools visit - Dar es Salaam"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ev-type">Type</Label>
          <Select id="ev-type" value={type} onChange={(e) => setType(e.target.value as BdEventType)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-status">Status</Label>
          <Select id="ev-status" value={status} onChange={(e) => setStatus(e.target.value as BdEventStatus)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ev-date">Date *</Label>
          <Input id="ev-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-end">End date</Label>
          <Input id="ev-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ev-venue">Venue</Label>
          <Input id="ev-venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Mlimani City Hall" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-budget">Budget (TSh)</Label>
          <Input id="ev-budget" type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 2000000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-desc">Description / plan</Label>
        <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Goal, audience, materials needed…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ev-leads">Leads generated</Label>
          <Input id="ev-leads" type="number" min="0" value={leads} onChange={(e) => setLeads(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-outcomes">Outcomes (after the event)</Label>
        <Textarea id="ev-outcomes" value={outcomes} onChange={(e) => setOutcomes(e.target.value)} placeholder="What happened, contacts made, follow-ups agreed…" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
          {existing ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </div>
  );
}
