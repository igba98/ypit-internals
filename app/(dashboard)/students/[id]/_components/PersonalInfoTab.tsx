import { Student } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  User as UserIcon,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Globe,
  IdCard,
  GraduationCap,
  MapPin,
  BookOpen,
  CalendarRange,
  Sparkles,
  StickyNote,
} from 'lucide-react';

interface PersonalInfoTabProps {
  student: Student;
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  accent?: 'default' | 'primary' | 'success';
}

function InfoRow({ icon: Icon, label, value, accent = 'default' }: InfoRowProps) {
  const iconBg = {
    default: 'bg-gray-50 text-gray-500',
    primary: 'bg-primary-muted text-primary',
    success: 'bg-green-50 text-green-600',
  }[accent];

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-card transition-all">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{value || <span className="text-gray-400">—</span>}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center shadow-primary-glow">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

export function PersonalInfoTab({ student }: PersonalInfoTabProps) {
  return (
    <div className="space-y-8">
      <section>
        <SectionHeader icon={IdCard} title="Identity" description="Personal and registration details" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <InfoRow icon={UserIcon} label="Full Name" value={student.fullName} accent="primary" />
          <InfoRow icon={IdCard} label="Registration No." value={student.registrationNumber} />
          <InfoRow icon={Globe} label="Nationality" value={student.nationality} />
          <InfoRow icon={Calendar} label="Date of Birth" value={`${formatDate(student.dateOfBirth)} · ${student.age} yrs`} />
          <InfoRow icon={UserIcon} label="Gender" value={student.gender.charAt(0) + student.gender.slice(1).toLowerCase()} />
          <InfoRow icon={IdCard} label="Passport No." value={student.passportNumber} />
        </div>
      </section>

      <section>
        <SectionHeader icon={Phone} title="Contact" description="Reach the student or guardian" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <InfoRow icon={Mail} label="Email" value={student.email} />
          <InfoRow icon={Phone} label="Phone" value={student.phone} />
          <InfoRow icon={MessageCircle} label="WhatsApp" value={student.whatsapp} accent="success" />
        </div>
      </section>

      <section>
        <SectionHeader icon={GraduationCap} title="Academic Target" description="Where this student wants to go" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <InfoRow icon={GraduationCap} label="University" value={student.targetUniversity} accent="primary" />
          <InfoRow icon={MapPin} label="Country" value={student.targetCountry} />
          <InfoRow icon={BookOpen} label="Program" value={student.targetProgram} />
          <InfoRow icon={CalendarRange} label="Intake" value={student.targetIntake} />
          <InfoRow icon={Sparkles} label="Lead Source" value={student.leadSource.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())} />
          <InfoRow icon={UserIcon} label="Assigned Lead" value={student.assignedAgentName} />
        </div>
      </section>

      {student.notes && (
        <section>
          <SectionHeader icon={StickyNote} title="Notes" description="Internal observations" />
          <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{student.notes}</p>
          </div>
        </section>
      )}
    </div>
  );
}
