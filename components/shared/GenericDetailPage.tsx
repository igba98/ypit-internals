import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

export function GenericDetailPage({ title, data, backPath, backLabel, actions }: { title: string, data: Record<string, any>, backPath: string, backLabel: string, actions?: ReactNode }) {
  const renderValue = (val: any) => {
    if (val === null || val === undefined || val === '') return <span className="text-gray-400 font-normal italic">Not provided</span>;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'string' && val.includes('T') && val.includes('Z')) {
      return new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); 
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-gray-400 italic">Empty</span>;
      return val.join(', ');
    }
    if (typeof val === 'object') return <pre className="text-xs bg-gray-50 border border-gray-100 p-3 rounded mt-2 overflow-x-auto font-mono text-gray-600 max-w-full">{JSON.stringify(val, null, 2)}</pre>;
    if (typeof val === 'number' && val > 1000) return val.toLocaleString();
    return String(val);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        <Link href={backPath}>Back to {backLabel}</Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
        <div className="mb-8 border-b border-gray-100 pb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-urbanist text-gray-900">{title}</h1>
            <p className="text-gray-500 mt-1">Detailed breakdown of this record's comprehensive data.</p>
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
          {Object.entries(data).map(([key, value]) => {
            if (key === 'id' || key === 'password' || key === 'avatar') return null;
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{formattedKey}</span>
                <div className="text-sm font-medium text-gray-900 mt-2 break-words">
                  {renderValue(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
