import { StageTransition } from '@/types';

interface Props {
  transitions: StageTransition[];
}

export function StageTimeline({ transitions }: Props) {
  if (transitions.length === 0) {
    return <p className="text-sm text-gray-500">No stage transitions yet.</p>;
  }
  return (
    <ol className="relative border-l border-gray-200 ml-2">
      {transitions.map(t => (
        <li key={t.id} className="ml-4 pb-4">
          <div className="absolute w-3 h-3 bg-primary rounded-full -left-1.5 mt-1.5" />
          <p className="text-sm">
            <span className="font-medium text-gray-900">
              {t.fromStage.replace(/_/g, ' ').toLowerCase()} → {t.toStage.replace(/_/g, ' ').toLowerCase()}
            </span>
            {t.fromStage === t.toStage && t.capturedData.subStep ? (
              <span className="ml-1 text-xs text-gray-500">(travel: {String(t.capturedData.subStep)} → {String(t.capturedData.newSubStepStatus ?? 'DONE').toLowerCase()})</span>
            ) : null}
          </p>
          <p className="text-xs text-gray-500">
            by {t.triggeredByName} ({t.triggeredByRole.replace(/_/g, ' ').toLowerCase()}) · {new Date(t.createdAt).toLocaleString()}
          </p>
          {t.notes && <p className="text-xs text-yellow-700 mt-1">Note: {t.notes}</p>}
          {Object.keys(t.capturedData).filter(k => k !== 'subStep' && k !== 'newSubStepStatus').length > 0 && (
            <details className="mt-1">
              <summary className="text-xs text-gray-500 cursor-pointer">Captured data</summary>
              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(t.capturedData, null, 2)}</pre>
            </details>
          )}
          <p className="text-xs text-gray-400 mt-1">{t.notificationsSent.length} notifications sent (simulated)</p>
        </li>
      ))}
    </ol>
  );
}