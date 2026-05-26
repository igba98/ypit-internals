import { Notification } from '@/types';

interface Props {
  notifications: Notification[];
}

export function SentMessagesPanel({ notifications }: Props) {
  const messages = notifications.filter(n =>
    n.audience === 'STUDENT' || n.audience === 'PARENT_PRIMARY' || n.audience === 'ALL_PARENTS'
  );

  if (messages.length === 0) {
    return <p className="text-sm text-gray-500">No messages sent yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {messages.map(m => (
        <li key={m.id} className="border border-gray-200 rounded-md p-3 bg-white">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-700">
              📱 To {m.recipientName} {m.recipientPhone ? <span className="text-gray-500">({m.recipientPhone})</span> : null}
              <span className="ml-2 text-gray-500 font-normal">· {m.audience?.replace(/_/g, ' ').toLowerCase()}</span>
            </p>
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">🟢 simulated</span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.messageBody ?? m.message}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}