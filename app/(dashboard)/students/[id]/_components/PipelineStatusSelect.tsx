'use client';

import { StatusSelect } from '@/components/shared/StatusSelect';
import { updateStudentStage } from '@/lib/actions/studentActions';
import { PIPELINE_STAGE_OPTIONS } from '@/lib/statusOptions';

export function PipelineStatusSelect({
  studentId,
  value,
  editable,
}: {
  studentId: string;
  value: string;
  editable: boolean;
}) {
  return (
    <StatusSelect
      value={value}
      options={PIPELINE_STAGE_OPTIONS}
      action={next => updateStudentStage(studentId, next)}
      editable={editable}
    />
  );
}
