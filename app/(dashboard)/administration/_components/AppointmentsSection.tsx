'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarClock, Loader2, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Appointment, AppointmentStatus, User } from '@/types';
import { deleteAppointment, saveAppointment } from '@/lib/actions/hrActions';

/** Local date + time → an instant. Typing 11:00 must mean 11:00 here, so the
 *  pair is parsed in the browser's zone and converted, not labelled as UTC. */
function toInstant(date: string, time: string): string {
  return new Date(`${date}T${time || '09:00'}`).toISOString();
}

/** The stored instant as the local date / time the input expects. */
function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No show' },
];

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  NO_SHOW: 'bg-red-100 text-red-700',
};

type StaffOption = Pick<User, 'id' | 'fullName' | 'role'>;

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

/** The calendar, grouped by day so the week reads at a glance. */
export function AppointmentsSection({
  appointments,
  staff,
  canEdit,
}: {
  appointments: Appointment[];
  staff: StaffOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const days = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const key = a.startsAt.slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), a]);
  }

  const onDelete = (a: Appointment) => {
    if (!confirm(`Remove "${a.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteAppointment(a.id);
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
        <CalendarClock className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">Appointment Calendar</h2>
        <span className="text-xs text-gray-400">{appointments.length} this month</span>
        {canEdit && (
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => setCreating(true)} disabled={busy}>
            <Plus className="w-4 h-4" /> Book appointment
          </Button>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <CalendarClock className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Nothing booked this month</p>
          <p className="text-xs text-gray-500 mt-1">
            {canEdit ? 'Book the first appointment above.' : 'The calendar is empty.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {[...days.entries()].map(([day, items]) => (
            <div key={day} className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                {dayLabel(`${day}T00:00:00`)}
              </p>
              <div className="space-y-2">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 hover:border-gray-200 p-3"
                  >
                    <div className="text-center shrink-0 w-16">
                      <p className="text-sm font-bold text-gray-900">{timeLabel(a.startsAt)}</p>
                      {a.endsAt && <p className="text-[10px] text-gray-400">to {timeLabel(a.endsAt)}</p>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-600">
                        {a.withName}
                        {a.withOrg ? ` · ${a.withOrg}` : ''}
                        {a.hostName ? ` · hosted by ${a.hostName}` : ''}
                      </p>
                      {(a.location || a.purpose) && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {[a.location, a.purpose].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {a.withPhone && (
                        <p className="text-[11px] text-gray-500 mt-0.5 inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {a.withPhone}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${STATUS_BADGE[a.status]}`}
                    >
                      {STATUSES.find((s) => s.value === a.status)?.label}
                    </span>
                    {canEdit && (
                      <div className="shrink-0 whitespace-nowrap">
                        <button onClick={() => setEditing(a)} className="text-gray-400 hover:text-primary p-1" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(a)} className="text-gray-400 hover:text-red-600 p-1" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <SlideInPanel
        isOpen={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? `Edit · ${editing.title}` : 'Book an appointment'}
        description="Visitors, parents, partners and internal meetings."
      >
        <AppointmentForm
          existing={editing ?? undefined}
          staff={staff}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </SlideInPanel>
    </div>
  );
}

function AppointmentForm({
  existing,
  staff,
  onDone,
}: {
  existing?: Appointment;
  staff: StaffOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [withName, setWithName] = useState(existing?.withName ?? '');
  const [withOrg, setWithOrg] = useState(existing?.withOrg ?? '');
  const [withPhone, setWithPhone] = useState(existing?.withPhone ?? '');
  const [hostId, setHostId] = useState(existing?.hostId ?? '');
  const [date, setDate] = useState(existing ? localDate(existing.startsAt) : '');
  const [start, setStart] = useState(existing ? localTime(existing.startsAt) : '09:00');
  const [end, setEnd] = useState(existing?.endsAt ? localTime(existing.endsAt) : '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [status, setStatus] = useState<AppointmentStatus>(existing?.status ?? 'SCHEDULED');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const submit = () => {
    if (title.trim().length < 2) return toast.error('Name the appointment.');
    if (withName.trim().length < 2) return toast.error('Who is coming in?');
    if (!date) return toast.error('Pick the date.');

    startTransition(async () => {
      const host = staff.find((s) => s.id === hostId);
      const res = await saveAppointment(existing?.id ?? null, {
        title: title.trim(),
        withName: withName.trim(),
        withOrg: withOrg.trim() || undefined,
        withPhone: withPhone.trim() || undefined,
        hostId: hostId || undefined,
        hostName: host?.fullName,
        startsAt: toInstant(date, start),
        endsAt: end ? toInstant(date, end) : undefined,
        location: location.trim() || undefined,
        purpose: purpose.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ap-title">Appointment *</Label>
        <Input id="ap-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Parent meeting - India tuition plan" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ap-with">Who is coming *</Label>
          <Input id="ap-with" value={withName} onChange={(e) => setWithName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-org">Organisation / relation</Label>
          <Input id="ap-org" value={withOrg} onChange={(e) => setWithOrg(e.target.value)} placeholder="e.g. Parent of Neema" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ap-phone">Phone</Label>
          <Input id="ap-phone" value={withPhone} onChange={(e) => setWithPhone(e.target.value)} placeholder="+255…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-host">Hosted by</Label>
          <Select id="ap-host" value={hostId} onChange={(e) => setHostId(e.target.value)}>
            <option value="">Not assigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ap-date">Date *</Label>
          <Input id="ap-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-start">From</Label>
          <Input id="ap-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-end">To</Label>
          <Input id="ap-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ap-loc">Location</Label>
          <Input id="ap-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. NIC 4th floor boardroom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-status">Status</Label>
          <Select id="ap-status" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ap-purpose">Purpose</Label>
        <Input id="ap-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What it is about" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ap-notes">Notes</Label>
        <Textarea id="ap-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Outcome, what was agreed…" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
          {existing ? 'Save changes' : 'Book appointment'}
        </Button>
      </div>
    </div>
  );
}
