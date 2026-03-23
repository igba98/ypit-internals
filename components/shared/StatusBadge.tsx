import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'pipeline' | 'payment' | 'application' | 'travel' | 'visa' | 'wellbeing' | 'task' | 'role' | 'staff' | 'audit' | 'report';
  className?: string;
}

const pipelineColors: Record<string, { text: string; bg: string; fontWeight?: string }> = {
  LEAD: { text: "#374151", bg: "#f3f4f6" },
  COUNSELING: { text: "#1d4ed8", bg: "#dbeafe" },
  PAYMENT_PENDING: { text: "#b45309", bg: "#fef3c7" },
  PAYMENT_CONFIRMED: { text: "#15803d", bg: "#dcfce7" },
  APPLICATION_SUBMITTED: { text: "#1d4ed8", bg: "#dbeafe" },
  UNIVERSITY_ACCEPTED: { text: "#15803d", bg: "#dcfce7", fontWeight: "600" },
  TRAVEL_PLANNING: { text: "#7c3aed", bg: "#ede9fe" },
  TRAVELLED: { text: "#ffffff", bg: "#9c003d" },
  MONITORING: { text: "#ffffff", bg: "#0a0a0a" }
};

export function StatusBadge({ status, variant = 'pipeline', className }: StatusBadgeProps) {
  let colors = { text: "#374151", bg: "#f3f4f6", fontWeight: "500" };

  if (variant === 'pipeline' && pipelineColors[status]) {
    colors = { ...colors, ...pipelineColors[status] };
  }

  const formattedStatus = status.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

  return (
    <span
      className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs", className)}
      style={{ backgroundColor: colors.bg, color: colors.text, fontWeight: colors.fontWeight }}
    >
      {formattedStatus}
    </span>
  );
}
