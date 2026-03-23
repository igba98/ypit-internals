'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { GenericEditPanel } from './GenericEditPanel';
import { genericDeleteRecord } from '@/lib/actions/genericActions';
import { toast } from 'sonner';

interface ActionDropdownProps {
  basePath: string;
  record: any;
  hideEdit?: boolean;
  hideDelete?: boolean;
}

export function ActionDropdown({ basePath, record, hideEdit, hideDelete }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!confirm("Are you explicitly sure you want to permanently delete this record?")) return;
    try {
      const collectionName = basePath.replace('/', '');
      await genericDeleteRecord(collectionName, record.id);
      toast.success('Record systematically deleted.');
    } catch {
      toast.error('Failed to securely delete data row.');
    }
  };

  return (
    <>
      <div className="relative inline-block text-left z-20" ref={ref}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
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
              className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
            >
              <button onClick={(e) => { e.stopPropagation(); router.push(`${basePath}/${record.id}`); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Eye className="w-4 h-4" /> View Details
              </button>
              {!hideEdit && (
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsEditOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Edit Record
                </button>
              )}
              {!hideDelete && (
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); handleDelete(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <GenericEditPanel 
        title={basePath.replace('/', '').toUpperCase()}
        collectionName={basePath.replace('/', '')}
        record={record}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  );
}
