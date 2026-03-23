'use client';

import { useTransition } from 'react';
import { SlideInPanel } from './SlideInPanel';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CustomSelect } from '../ui/custom-select';
import { genericEditRecord } from '@/lib/actions/genericActions';
import { toast } from 'sonner';

interface GenericEditPanelProps {
  title: string;
  record: Record<string, any>;
  collectionName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GenericEditPanel({ title, record, collectionName, isOpen, onClose }: GenericEditPanelProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await genericEditRecord(collectionName, record.id, formData);
        toast.success(`${title} record updated securely`);
        onClose();
      } catch (error) {
        toast.error('Failed to update system registry');
      }
    });
  };

  // Blacklist generic metadata tracking elements that should be immutable natively.
  const readOnlyKeys = ['id', 'createdAt', 'updatedAt', 'avatar', 'password', 'timestamp', 'userId', 'studentId', 'studentName'];

  return (
    <SlideInPanel isOpen={isOpen} onClose={onClose} title={`Edit ${title}`}>
      <form onSubmit={handleSubmit} className="space-y-5 pb-10">
        <div className="bg-orange-50/50 border border-orange-100 rounded-md p-3 mb-6">
          <p className="text-xs text-orange-800">
            Automatically interpreting database schema. Complex nested structures and metadata elements are intentionally hidden locking integrity.
          </p>
        </div>

        {Object.entries(record).map(([key, value]) => {
          if (readOnlyKeys.includes(key) || typeof value === 'object' || Array.isArray(value)) return null;
          
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          return (
            <div key={key} className="space-y-1.5 flex flex-col items-start w-full">
              <Label htmlFor={key} className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {formattedKey}
              </Label>
              {typeof value === 'boolean' ? (
                <div className="w-full relative">
                  <CustomSelect 
                    name={key} 
                    defaultValue={value ? 'true' : 'false'}
                    options={[{label: 'Yes - Active', value: 'true'}, {label: 'No - Disabled', value: 'false'}]} 
                  />
                </div>
              ) : (
                <Input 
                  id={key} 
                  name={key} 
                  defaultValue={value as string | number} 
                  type={typeof value === 'number' ? 'number' : 'text'} 
                  className="w-full text-sm font-medium focus-visible:ring-primary"
                />
              )}
            </div>
          );
        })}
        
        <div className="pt-6 border-t border-gray-100 flex items-center justify-between w-full mt-8">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="text-gray-500">
            Cancel Edit
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Committing Changes...' : 'Save Record'}
          </Button>
        </div>
      </form>
    </SlideInPanel>
  );
}
