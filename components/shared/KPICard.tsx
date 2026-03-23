import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  description?: string;
  className?: string;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection,
  description,
  className
}: KPICardProps) {
  return (
    <div className={cn("bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow duration-200", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-urbanist">{label}</span>
        <div className="w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center text-primary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="text-4xl font-extrabold font-urbanist text-gray-900">
        {value}
      </div>
      
      {(trend || description) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span className={cn(
              "text-sm font-medium flex items-center gap-1",
              trendDirection === 'up' ? "text-green-600" : 
              trendDirection === 'down' ? "text-red-600" : "text-gray-500"
            )}>
              {trendDirection === 'up' && "↑"}
              {trendDirection === 'down' && "↓"}
              {trend}
            </span>
          )}
          {description && (
            <span className="text-xs text-gray-400">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
