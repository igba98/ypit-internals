'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

interface ActionDropdownProps {
  /** Where "View details" goes. Omit to hide the item. */
  viewHref?: string;
  /** Opens the real edit UI for this row. Omit to hide the item. */
  onEdit?: () => void;
  /** Real delete / deactivate. Omit to hide the item. */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  /** Shown in the confirm dialog, e.g. the person's name. */
  deleteConfirm?: string;
}

/**
 * Row actions. Everything here must be wired to real handlers - this menu used
 * to edit and delete an in-memory demo array, which reported "Record not found"
 * on live records and silently discarded anything it did save.
 */
export function ActionDropdown({
  viewHref,
  onEdit,
  onDelete,
  deleteLabel = 'Delete',
  deleteConfirm,
}: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!viewHref && !onEdit && !onDelete) return null;

  const handleDelete = async () => {
    if (!confirm(deleteConfirm ?? 'Are you sure?')) return;
    await onDelete?.();
  };

  return (
    <div className="relative inline-block text-left z-20" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
          >
            {viewHref && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(viewHref); setIsOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> View details
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); void handleDelete(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> {deleteLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
