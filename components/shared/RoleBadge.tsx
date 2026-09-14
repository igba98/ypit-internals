import { Role } from '@/types';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleColors: Record<Role, { text: string; bg: string }> = {
  MANAGING_DIRECTOR: { text: "#ffffff", bg: "#0a0a0a" },
  MARKETING_MANAGER: { text: "#ffffff", bg: "#9c003d" },
  IT_ADMIN: { text: "#1d4ed8", bg: "#dbeafe" },
  FINANCE: { text: "#15803d", bg: "#dcfce7" },
  ADMISSIONS: { text: "#7c3aed", bg: "#ede9fe" },
  TRAVEL: { text: "#0e7490", bg: "#cffafe" },
  OPERATIONS: { text: "#c2410c", bg: "#ffedd5" },
  MARKETING_STAFF: { text: "#b45309", bg: "#fef3c7" },
  SUB_AGENT: { text: "#374151", bg: "#f3f4f6" },
  BUSINESS_DEVELOPMENT: { text: "#ffffff", bg: "#1e3a8a" },
  IT_ASSISTANT: { text: "#1d4ed8", bg: "#eff6ff" },
  MARKETING_ASSISTANT: { text: "#9c003d", bg: "#fdf2f8" },
  FINANCE_ASSISTANT: { text: "#15803d", bg: "#f0fdf4" },
  ADMISSIONS_ASSISTANT: { text: "#7c3aed", bg: "#f5f3ff" },
  TRAVEL_ASSISTANT: { text: "#0e7490", bg: "#ecfeff" },
  OPERATIONS_ASSISTANT: { text: "#c2410c", bg: "#fff7ed" },
  MARKETING_STAFF_ASSISTANT: { text: "#b45309", bg: "#fffbeb" },
  BUSINESS_DEVELOPMENT_ASSISTANT: { text: "#1e3a8a", bg: "#eff6ff" },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const colors = roleColors[role];
  const formattedRole = role.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", className)}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.text }} />
      {formattedRole}
    </span>
  );
}
