import { cn } from '@/lib/utils';

interface AvatarClusterProps {
  users: Array<{ name: string; avatar?: string }>;
  max?: number;
  size?: 'sm' | 'md';
}

export function AvatarCluster({ users, max = 3, size = 'md' }: AvatarClusterProps) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;
  
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

  return (
    <div className="flex items-center -space-x-2">
      {displayUsers.map((user, i) => (
        <div 
          key={i} 
          className={cn(
            "rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center overflow-hidden",
            sizeClass
          )}
          title={user.name}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-500 font-medium">{user.name.charAt(0)}</span>
          )}
        </div>
      ))}
      
      {remaining > 0 && (
        <div 
          className={cn(
            "rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-gray-500 font-medium",
            sizeClass
          )}
          title={`${remaining} more`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
