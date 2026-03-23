import { PipelineStage, PIPELINE_STAGES } from '@/types';
import { getPipelineStageLabel } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStageBarProps {
  currentStage: PipelineStage;
  compact?: boolean;
}

const STAGES = Object.values(PIPELINE_STAGES);

export function PipelineStageBar({ currentStage, compact = false }: PipelineStageBarProps) {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-2">
      <div className="flex items-center min-w-max px-2">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={stage} className="flex items-center">
              <div className="flex flex-col items-center relative">
                <div 
                  className={cn(
                    "flex items-center justify-center z-10 bg-white",
                    compact ? "w-6 h-6" : "w-8 h-8"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className={cn("text-green-600", compact ? "w-5 h-5" : "w-6 h-6")} />
                  ) : isCurrent ? (
                    <div className={cn("rounded-full bg-primary flex items-center justify-center", compact ? "w-5 h-5" : "w-6 h-6")}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  ) : (
                    <Circle className={cn("text-gray-300", compact ? "w-5 h-5" : "w-6 h-6")} />
                  )}
                </div>
                
                {!compact && (
                  <span className={cn(
                    "absolute top-10 text-[10px] font-medium whitespace-nowrap text-center w-24 -ml-8",
                    isCurrent ? "text-primary font-bold" : isCompleted ? "text-gray-700" : "text-gray-400"
                  )}>
                    {getPipelineStageLabel(stage)}
                  </span>
                )}
              </div>
              
              {index < STAGES.length - 1 && (
                <div className={cn(
                  "h-0.5 transition-colors",
                  compact ? "w-8" : "w-16",
                  isCompleted ? "bg-green-600" : "bg-gray-200"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
