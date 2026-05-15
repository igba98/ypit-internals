'use client';

import { TravelRecord, PassportStatus, VisaStatus, Role } from '@/types';
import { formatDate } from '@/lib/utils';
import { StatusSelect } from '@/components/shared/StatusSelect';
import {
  TRAVEL_STATUS_OPTIONS,
  VISA_STATUS_OPTIONS,
  PASSPORT_STATUS_OPTIONS,
  canEdit,
} from '@/lib/statusOptions';
import {
  updateTravelStatus,
  updateVisaStatus,
  updatePassportStatus,
} from '@/lib/actions/travelActions';
import {
  Plane,
  BookCheck,
  ShieldCheck,
  Ticket,
  MapPin,
  Phone,
  Home,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  PlaneTakeoff,
  PlaneLanding,
  User as UserIcon,
} from 'lucide-react';

interface TravelTabProps {
  travel: TravelRecord | null;
  userRole: Role;
}

const PASSPORT_STATE: Record<PassportStatus, 'done' | 'pending' | 'inprogress'> = {
  HAS_PASSPORT: 'inprogress',
  APPLYING: 'inprogress',
  READY: 'done',
};

const VISA_STATE: Record<VisaStatus, 'done' | 'pending' | 'inprogress' | 'failed'> = {
  NOT_STARTED: 'pending',
  DOCUMENTS_GATHERING: 'inprogress',
  APPLIED: 'inprogress',
  APPOINTMENT_BOOKED: 'inprogress',
  APPROVED: 'done',
  REJECTED: 'failed',
  APPEALING: 'inprogress',
};

interface MilestoneProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  state: 'done' | 'pending' | 'inprogress' | 'failed';
  trailing?: React.ReactNode;
}

function Milestone({ icon: Icon, title, subtitle, state, trailing }: MilestoneProps) {
  const styles = {
    done: { box: 'bg-green-500 text-white shadow-md', label: 'text-gray-900', sub: 'text-green-700' },
    inprogress: { box: 'bg-primary text-white shadow-primary-glow', label: 'text-gray-900', sub: 'text-primary' },
    pending: { box: 'bg-gray-100 text-gray-400', label: 'text-gray-500', sub: 'text-gray-400' },
    failed: { box: 'bg-red-500 text-white', label: 'text-gray-900', sub: 'text-red-700' },
  }[state];

  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.box}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className={`text-sm font-semibold ${styles.label}`}>{title}</p>
        {subtitle && <p className={`text-xs mt-0.5 ${styles.sub}`}>{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 pt-0.5">{trailing}</div>}
    </div>
  );
}

function daysUntil(date: string): number {
  const target = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function TravelTab({ travel, userRole }: TravelTabProps) {
  if (!travel) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Plane className="w-7 h-7 text-gray-400" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">No travel record yet</h4>
        <p className="text-xs text-gray-500 mt-1">Travel setup typically begins after the student receives a university offer.</p>
      </div>
    );
  }

  const passportState = PASSPORT_STATE[travel.passportStatus];
  const visaState = VISA_STATE[travel.visaStatus];
  const flightDone = travel.travelStatus === 'TRAVELLED';
  const flightState: MilestoneProps['state'] = flightDone ? 'done' : travel.flightDate ? 'inprogress' : 'pending';
  const arrivalState: MilestoneProps['state'] = flightDone ? 'done' : 'pending';

  const daysToFlight = travel.flightDate ? daysUntil(travel.flightDate) : null;
  const flightUpcoming = daysToFlight !== null && daysToFlight > 0 && !flightDone;

  const canEditTravel = canEdit('travelStatus', userRole);
  const canEditVisa = canEdit('visaStatus', userRole);
  const canEditPassport = canEdit('passportStatus', userRole);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-muted via-white to-white p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shadow-primary-glow shrink-0">
                <Plane className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-urbanist">
                  {travel.departureCity} <span className="text-gray-400">→</span> {travel.destinationCity}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {travel.airline ? `${travel.airline} ${travel.flightNumber}` : 'Itinerary to be confirmed'}
                </p>
              </div>
            </div>
            <StatusSelect
              value={travel.travelStatus}
              options={TRAVEL_STATUS_OPTIONS}
              action={next => updateTravelStatus(travel.id, next)}
              editable={canEditTravel}
            />
          </div>

          {flightUpcoming && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-primary/20 shadow-card">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-900">
                {daysToFlight} day{daysToFlight === 1 ? '' : 's'} until departure
              </span>
              <span className="text-xs text-gray-500">· {formatDate(travel.flightDate!)}</span>
            </div>
          )}
          {flightDone && travel.flightDate && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Travelled on {formatDate(travel.flightDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-4">Travel Milestones</h3>
        <div className="rounded-xl border border-gray-100 p-5 space-y-5">
          <Milestone
            icon={BookCheck}
            title="Passport"
            subtitle={travel.passportNumber ? `${travel.passportNumber}${travel.passportExpiry ? ` · expires ${formatDate(travel.passportExpiry)}` : ''}` : 'No passport details on file'}
            state={passportState}
            trailing={
              <StatusSelect
                value={travel.passportStatus}
                options={PASSPORT_STATUS_OPTIONS}
                action={next => updatePassportStatus(travel.id, next)}
                editable={canEditPassport}
                size="sm"
              />
            }
          />
          <Milestone
            icon={ShieldCheck}
            title="Visa"
            subtitle={
              travel.visaType
                ? `${travel.visaType}${travel.visaApprovalDate ? ` · approved ${formatDate(travel.visaApprovalDate)}` : travel.visaAppointmentDate ? ` · appt ${formatDate(travel.visaAppointmentDate)}` : ''}`
                : 'Visa type to be confirmed'
            }
            state={visaState}
            trailing={
              <StatusSelect
                value={travel.visaStatus}
                options={VISA_STATUS_OPTIONS}
                action={next => updateVisaStatus(travel.id, next)}
                editable={canEditVisa}
                size="sm"
              />
            }
          />
          <Milestone
            icon={Ticket}
            title="Flight booked"
            subtitle={travel.flightDate ? `${travel.airline} ${travel.flightNumber} · ${formatDate(travel.flightDate)}` : 'Not booked yet'}
            state={flightState}
          />
          <Milestone
            icon={PlaneLanding}
            title="Arrival confirmed"
            subtitle={flightDone ? `Arrived in ${travel.destinationCity}` : 'Pending departure'}
            state={arrivalState}
          />
        </div>
      </section>

      {/* Flight + Pickup details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <PlaneTakeoff className="w-4 h-4 text-primary" />
            Flight Details
          </h3>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <dt className="text-gray-500">Airline</dt><dd className="font-medium text-gray-900">{travel.airline ?? '—'}</dd>
            <dt className="text-gray-500">Flight #</dt><dd className="font-medium text-gray-900">{travel.flightNumber ?? '—'}</dd>
            <dt className="text-gray-500">From</dt><dd className="font-medium text-gray-900">{travel.departureCity}</dd>
            <dt className="text-gray-500">To</dt><dd className="font-medium text-gray-900">{travel.destinationCity}</dd>
            <dt className="text-gray-500">Airport</dt><dd className="font-medium text-gray-900">{travel.destinationAirport ?? '—'}</dd>
            <dt className="text-gray-500">Date</dt><dd className="font-medium text-gray-900">{travel.flightDate ? formatDate(travel.flightDate) : '—'}</dd>
          </dl>
        </section>

        <section className="rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            Arrival & Pickup
          </h3>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <dt className="text-gray-500">Pickup</dt>
            <dd className="font-medium text-gray-900">
              {travel.airportPickupArranged ? (
                <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" /> Arranged</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700"><AlertCircle className="w-3.5 h-3.5" /> Not arranged</span>
              )}
            </dd>
            <dt className="text-gray-500 flex items-center gap-1"><UserIcon className="w-3 h-3" /> Contact</dt>
            <dd className="font-medium text-gray-900">{travel.pickupContactName ?? '—'}</dd>
            <dt className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</dt>
            <dd className="font-medium text-gray-900">{travel.pickupContactPhone ?? '—'}</dd>
            <dt className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</dt>
            <dd className="font-medium text-gray-900 col-span-1 truncate">{travel.accommodationAddress ?? '—'}</dd>
          </dl>
        </section>
      </div>

      {/* Visa block */}
      {(travel.visaApplicationDate || travel.visaAppointmentDate || travel.visaApprovalDate) && (
        <section className="rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Visa Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Applied</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {travel.visaApplicationDate ? formatDate(travel.visaApplicationDate) : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Appointment</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {travel.visaAppointmentDate ? formatDate(travel.visaAppointmentDate) : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Approved</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {travel.visaApprovalDate ? formatDate(travel.visaApprovalDate) : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Expires</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {travel.visaExpiryDate ? formatDate(travel.visaExpiryDate) : '—'}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
