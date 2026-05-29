'use client';

import {
  useTransition,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionResult } from '@/types';

export interface StatusOption {
  value: string;
  label: string;
  /** Tailwind classes for the pill background/text (e.g. `bg-green-50 text-green-700 border border-green-200`). */
  className?: string;
}

interface StatusSelectProps {
  value: string;
  options: StatusOption[];
  action: (next: string) => Promise<ActionResult>;
  editable?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  /** Custom label shown when current value is missing from options. */
  fallbackLabel?: string;
  /** Render the trigger with white-on-translucent styling (for use on dark/gradient backgrounds). */
  onDark?: boolean;
}

const FALLBACK_PILL = 'bg-gray-100 text-gray-700 border border-gray-200';

const DROPDOWN_MIN_WIDTH = 200;
const VIEWPORT_PADDING = 8;

export function StatusSelect({
  value,
  options,
  action,
  editable = false,
  size = 'md',
  className,
  fallbackLabel,
  onDark = false,
}: StatusSelectProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: DROPDOWN_MIN_WIDTH,
  });

  // Defer portal rendering until after hydration so SSR markup matches the client.
  useEffect(() => setMounted(true), []);

  const current = options.find(o => o.value === value);
  const triggerLabel = current?.label ?? fallbackLabel ?? value;
  const triggerClass = current?.className ?? FALLBACK_PILL;

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.max(DROPDOWN_MIN_WIDTH, rect.width);
    // Anchor right-edge of dropdown to right-edge of the trigger, but never overflow the viewport.
    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(window.innerWidth - width - VIEWPORT_PADDING, rect.right - width),
    );
    setCoords({ top: rect.bottom + 4, left, width });
  }, []);

  // Reposition on open, on scroll, and on resize so the panel tracks the trigger.
  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
    const onChange = () => updateCoords();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [open, updateCoords]);

  // Click-outside: ignores clicks inside the trigger or the panel (panel lives in a portal).
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // ESC closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSelect = (next: string) => {
    setOpen(false);
    if (next === value) return;
    startTransition(async () => {
      const result = await action(next);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const pillBase = cn(
    'inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors',
    size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
  );

  const trigger = (
    <span
      className={cn(
        pillBase,
        onDark ? 'bg-white/15 text-white border border-white/20 backdrop-blur-sm' : triggerClass,
        editable && !isPending && 'cursor-pointer hover:opacity-90',
        isPending && 'opacity-60',
      )}
    >
      {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
      {triggerLabel}
      {editable && !isPending && <ChevronDown className="w-3 h-3 opacity-70" />}
    </span>
  );

  if (!editable) {
    return <span className={className}>{trigger}</span>;
  }

  return (
    <span className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !isPending && setOpen(o => !o)}
        disabled={isPending}
        className="inline-flex"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              zIndex: 50,
            }}
            className="bg-white rounded-lg shadow-elevated border border-gray-100 py-1"
          >
            {options.map(o => {
              const isActive = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(o.value)}
                  className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-gray-50"
                >
                  <span className={cn(pillBase, o.className ?? FALLBACK_PILL, 'shrink-0')}>
                    {o.label}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </span>
  );
}
