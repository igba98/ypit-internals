import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

// Tailwind-friendly palette. Deterministic pick from the name hash means a
// person's chip stays the same colour everywhere across the app.
const PALETTE = [
  'bg-rose-500',
  'bg-pink-500',
  'bg-purple-500',
  'bg-violet-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-cyan-600',
  'bg-teal-600',
  'bg-emerald-600',
  'bg-green-600',
  'bg-lime-600',
  'bg-amber-600',
  'bg-orange-500',
  'bg-red-500',
] as const;

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

function getInitials(name: string): string {
  const cleaned = (name || '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar — initials on a colour derived from the name. No network image fetch.
 * Use everywhere instead of <Image src={user.avatar} ... />.
 */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const color = nameToColor(name || '?');
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 select-none',
        SIZE_CLASSES[size],
        color,
        className,
      )}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
