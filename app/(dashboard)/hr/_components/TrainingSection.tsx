'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GraduationCap, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TrainingKind, TrainingSession, TrainingStatus, User } from '@/types';
import { formatDate } from '@/lib/utils';
import { deleteTraining, saveTraining } from '@/lib/actions/hrActions';

/** Local date + time → an instant; see AppointmentsSection for the why. */
function toInstant(date: string, time: string): string {
  return new Date(`${date}T${time || '09:00'}`).toISOString();
}

function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const KINDS: { value: TrainingKind; label: string }[] = [
  { value: 'TRAINING', label: 'Training' },
  { value: 'ORIENTATION', label: 'Orientation' },
];

const STATUSES: { value: TrainingStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE: Record<TrainingStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

type StaffOption = Pick<User, 'id' | 'fullName' | 'role'>;

export function TrainingSection({
  sessions,
  staff,
  canEdit,
}: {
  sessions: TrainingSession[];
  staff: StaffOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TrainingSession | null>(null);

  const onDelete = (s: TrainingSession) => {
    if (!confirm(`Remove "${s.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteTraining(s.id);
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
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-gray-900">Training &amp; Orientations</h2>
        <span className="text-xs text-gray-400">{sessions.length} session(s)</span>
        {canEdit && (
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => setCreating(true)} disabled={busy}>
            <Plus className="w-4 h-4" /> Schedule session
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Facilitator</th>
              <th className="px-4 py-3 font-medium">Attendees</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canEdit && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <p className="text-[11px] text-gray-500">
                    {KINDS.find((k) => k.value === s.kind)?.label}
                    {s.location ? ` · ${s.location}` : ''}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatDate(s.scheduledFor)}
                  <p className="text-[11px] text-gray-400">
                    {localTime(s.scheduledFor)}
                    {s.durationMins ? ` · ${s.durationMins} min` : ''}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-700">{s.facilitator ?? <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3">
                  {(s.attendees?.length ?? 0) > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 text-gray-700"
                      title={s.attendees!.map((a) => a.name).join(', ')}
                    >
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {s.attendees!.length}
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[s.status]}`}>
                    {STATUSES.find((x) => x.value === s.status)?.label}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(s)} className="text-gray-400 hover:text-primary p-1" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(s)} className="text-gray-400 hover:text-red-600 p-1" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="text-center py-12 text-gray-500">
                  No sessions yet.{canEdit ? ' Schedule the first training or orientation.' : ''}
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
        title={editing ? `Edit · ${editing.title}` : 'Schedule a session'}
        description="Staff training and new-joiner orientation."
      >
        <TrainingForm
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

function TrainingForm({
  existing,
  staff,
  onDone,
}: {
  existing?: TrainingSession;
  staff: StaffOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [kind, setKind] = useState<TrainingKind>(existing?.kind ?? 'TRAINING');
  const [status, setStatus] = useState<TrainingStatus>(existing?.status ?? 'PLANNED');
  const [date, setDate] = useState(existing ? localDate(existing.scheduledFor) : '');
  const [time, setTime] = useState(existing ? localTime(existing.scheduledFor) : '09:00');
  const [duration, setDuration] = useState(existing?.durationMins ? String(existing.durationMins) : '');
  const [facilitator, setFacilitator] = useState(existing?.facilitator ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [attendeeIds, setAttendeeIds] = useState<string[]>(
    (existing?.attendees ?? []).map((a) => a.staffId ?? a.name),
  );
  const [objectives, setObjectives] = useState(existing?.objectives ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const toggle = (id: string) =>
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = () => {
    if (title.trim().length < 2) return toast.error('Name the session.');
    if (!date) return toast.error('Pick the date.');

    startTransition(async () => {
      const attendees = attendeeIds.map((id) => {
        const member = staff.find((s) => s.id === id);
        return member ? { staffId: member.id, name: member.fullName } : { name: id };
      });
      const res = await saveTraining(existing?.id ?? null, {
        title: title.trim(),
        kind,
        status,
        scheduledFor: toInstant(date, time),
        durationMins: duration !== '' ? Number(duration) : undefined,
        facilitator: facilitator.trim() || undefined,
        location: location.trim() || undefined,
        attendees,
        objectives: objectives.trim() || undefined,
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
        <Label htmlFor="tr-title">Session title *</Label>
        <Input
          id="tr-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. New staff orientation - October intake"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tr-kind">Type</Label>
          <Select id="tr-kind" value={kind} onChange={(e) => setKind(e.target.value as TrainingKind)}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tr-status">Status</Label>
          <Select id="tr-status" value={status} onChange={(e) => setStatus(e.target.value as TrainingStatus)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tr-date">Date *</Label>
          <Input id="tr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tr-time">Start</Label>
          <Input id="tr-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tr-dur">Minutes</Label>
          <Input id="tr-dur" type="number" min="5" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="120" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tr-fac">Facilitator</Label>
          <Input id="tr-fac" value={facilitator} onChange={(e) => setFacilitator(e.target.value)} placeholder="Who is running it" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tr-loc">Location</Label>
          <Input id="tr-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Boardroom, 4th floor" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attendees</Label>
        <div className="max-h-44 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
          {staff.map((s) => (
            <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={attendeeIds.includes(s.id)} onChange={() => toggle(s.id)} className="rounded" />
              <span className="text-gray-900">{s.fullName}</span>
              <span className="text-[11px] text-gray-400 ml-auto">{s.role.replace(/_/g, ' ').toLowerCase()}</span>
            </label>
          ))}
          {staff.length === 0 && <p className="px-3 py-3 text-xs text-gray-500">No staff accounts to list.</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tr-obj">Objectives</Label>
        <Textarea id="tr-obj" rows={2} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="What the session should cover…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tr-notes">Notes</Label>
        <Textarea id="tr-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Attendance, outcomes, follow-up needed…" />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
          {existing ? 'Save changes' : 'Schedule session'}
        </Button>
      </div>
    </div>
  );
}
