import { PipelineStage, PIPELINE_STAGES } from '@/types';
import { getPipelineStageLabel } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStageBarProps {
  currentStage: PipelineStage;
  compact?: boolean;
}

const STAGES = Object.values(PIPELINE_STAGES);

export function PipelineStageBar({ currentStage, compact = false }: PipelineStageBarProps) {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
      <div className="flex items-start min-w-max">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFirst = index === 0;
          const isLast = index === STAGES.length - 1;
          const leftLineDone = isCompleted || isCurrent;
          const rightLineDone = isCompleted;

          return (
            <div
              key={stage}
              className={cn(
                'flex flex-col items-center shrink-0',
                compact ? 'min-w-[64px]' : 'min-w-[96px]',
              )}
            >
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    'flex-1 h-0.5 transition-colors',
                    isFirst ? 'invisible' : leftLineDone ? 'bg-green-600' : 'bg-gray-200',
                  )}
                />
                <div
                  className={cn(
                    'shrink-0 flex items-center justify-center bg-white',
                    compact ? 'w-6 h-6 mx-1' : 'w-8 h-8 mx-1.5',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className={cn('text-green-600', compact ? 'w-5 h-5' : 'w-6 h-6')} />
                  ) : isCurrent ? (
                    <div
                      className={cn(
                        'rounded-full bg-primary flex items-center justify-center shadow-primary-glow',
                        compact ? 'w-5 h-5' : 'w-6 h-6',
                      )}
                    >
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'rounded-full border-2 border-gray-200 bg-white',
                        compact ? 'w-5 h-5' : 'w-6 h-6',
                      )}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    'flex-1 h-0.5 transition-colors',
                    isLast ? 'invisible' : rightLineDone ? 'bg-green-600' : 'bg-gray-200',
                  )}
                />
              </div>

              {!compact && (
                <span
                  className={cn(
                    'mt-2 text-[10px] font-medium whitespace-nowrap text-center px-1',
                    isCurrent
                      ? 'text-primary font-bold'
                      : isCompleted
                        ? 'text-gray-700'
                        : 'text-gray-400',
                  )}
                >
                  {getPipelineStageLabel(stage)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
