'use client';

import { useState } from 'react';
import { SlideInPanel } from './SlideInPanel';
import { Eye } from 'lucide-react';

interface GenericDataViewerProps {
  title: string;
  data: Record<string, any>;
  description?: string;
  triggerIcon?: React.ReactNode;
}

export function GenericDataViewer({ title, data, description, triggerIcon = <Eye className="w-4 h-4" /> }: GenericDataViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter out noisy data like arrays or complex objects, format dates natively
  const renderValue = (val: any) => {
    if (val === null || val === undefined || val === '') return <span className="text-gray-400 italic">Not provided</span>;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'string' && val.includes('T') && val.includes('Z')) {
      return new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); 
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-gray-400 italic">Empty</span>;
      return val.join(', ');
    }
    if (typeof val === 'object') return <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>;
    
    // Check if it looks like a currency or big number
    if (typeof val === 'number' && val > 1000) return val.toLocaleString();
    
    return String(val);
  };

  return (
    <>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="p-2 text-gray-400 hover:text-primary rounded-md hover:bg-primary-muted transition-colors flex items-center justify-center shrink-0"
        title="View Details"
      >
        {triggerIcon}
      </button>

      <SlideInPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        description={description || "Detailed comprehensive single view record breakdown."}
      >
        <div className="space-y-4 pb-12">
          {Object.entries(data).map(([key, value]) => {
            if (key === 'id' || key === 'avatar' || key === 'password') return null;
            
            // Convert camelCase to Title Case
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());

            return (
              <div key={key} className="flex flex-col border-b border-gray-100 pb-3">
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{formattedKey}</span>
                <div className="text-sm text-gray-900 font-medium mt-1.5 break-words">
                  {renderValue(value)}
                </div>
              </div>
            );
          })}
        </div>
      </SlideInPanel>
    </>
  );
}
