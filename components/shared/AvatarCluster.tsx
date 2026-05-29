import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';

interface AvatarClusterProps {
  // `avatar` is kept in the type for backwards compatibility but is ignored —
  // we always render initials now.
  users: Array<{ name: string; avatar?: string }>;
  max?: number;
  size?: 'sm' | 'md';
}

export function AvatarCluster({ users, max = 3, size = 'md' }: AvatarClusterProps) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {displayUsers.map((user, i) => (
        <div
          key={i}
          className="ring-2 ring-white rounded-full"
          title={user.name}
        >
          <Avatar name={user.name} size={size === 'sm' ? 'xs' : 'md'} />
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-gray-600 font-medium',
            size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs',
          )}
          title={`${remaining} more`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
