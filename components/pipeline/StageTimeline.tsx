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
          {(() => {
            const entries = Object.entries(t.capturedData)
              .filter(([k]) => k !== 'subStep' && k !== 'newSubStepStatus');
            const isFile = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:');
            const files = entries.filter(([, v]) => isFile(v)) as [string, string][];
            const nonFiles = entries.filter(([, v]) => !isFile(v));
            if (entries.length === 0) return null;
            return (
              <div className="mt-1 space-y-1">
                {files.map(([k, dataUrl]) => {
                  const mime = (dataUrl.match(/^data:([^;,]+)/)?.[1]) ?? 'application/octet-stream';
                  const sizeKB = Math.max(1, Math.round(dataUrl.length * 0.75 / 1024));
                  const ext = mimeToExt(mime);
                  return (
                    <div key={k} className="inline-flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1">
                      <span>📎 {k}: {mime} · ~{sizeKB} KB</span>
                      <a href={dataUrl} download={`${k}.${ext}`} className="text-primary hover:underline">Download</a>
                    </div>
                  );
                })}
                {nonFiles.length > 0 && (
                  <details>
                    <summary className="text-xs text-gray-500 cursor-pointer">Captured data</summary>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(Object.fromEntries(nonFiles), null, 2)}</pre>
                  </details>
                )}
              </div>
            );
          })()}
          <p className="text-xs text-gray-400 mt-1">{t.notificationsSent.length} notifications sent (simulated)</p>
        </li>
      ))}
    </ol>
  );
}

function mimeToExt(mime: string): string {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'application/msword') return 'doc';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mime === 'application/vnd.ms-excel') return 'xls';
  if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
  if (mime.startsWith('image/')) return mime.split('/')[1] || 'png';
  if (mime === 'text/plain') return 'txt';
  return 'bin';
}