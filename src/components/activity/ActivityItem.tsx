import { Clock, User, Users, FileText, Image as ImageIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export type ActivityType =
  | 'person_added'
  | 'person_updated'
  | 'person_deleted'
  | 'relationship_added'
  | 'relationship_updated'
  | 'tree_created'
  | 'tree_updated'
  | 'photo_added'
  | 'document_added';

export interface ActivityItemProps {
  type: ActivityType;
  actor: {
    name: string;
    avatar?: string;
  };
  target?: {
    name: string;
    avatar?: string;
  };
  description?: string;
  timestamp: Date;
  className?: string;
}

const activityConfig: Record<
  ActivityType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  person_added: {
    icon: <User size={16} />,
    color: 'text-green-500',
    label: 'added',
  },
  person_updated: {
    icon: <User size={16} />,
    color: 'text-blue-500',
    label: 'updated',
  },
  person_deleted: {
    icon: <User size={16} />,
    color: 'text-red-500',
    label: 'deleted',
  },
  relationship_added: {
    icon: <Users size={16} />,
    color: 'text-purple-500',
    label: 'connected',
  },
  relationship_updated: {
    icon: <Users size={16} />,
    color: 'text-purple-500',
    label: 'updated relationship',
  },
  tree_created: {
    icon: <Users size={16} />,
    color: 'text-green-500',
    label: 'created tree',
  },
  tree_updated: {
    icon: <Users size={16} />,
    color: 'text-blue-500',
    label: 'updated tree',
  },
  photo_added: {
    icon: <ImageIcon size={16} />,
    color: 'text-green-500',
    label: 'added photo',
  },
  document_added: {
    icon: <FileText size={16} />,
    color: 'text-green-500',
    label: 'added document',
  },
};

export function ActivityItem({
  type,
  actor,
  target,
  description,
  timestamp,
  className,
}: ActivityItemProps) {
  const config = activityConfig[type];
  const timeAgo = formatRelativeTime(timestamp);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl',
        'bg-white dark:bg-[#101f22] border border-[#e7f1f3] dark:border-white/10',
        'hover:shadow-sm transition-shadow',
        className
      )}
    >
      {/* Actor Avatar */}
      <Avatar
        src={actor.avatar}
        fullName={actor.name}
        size="sm"
        alt={actor.name}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#0d191b] dark:text-white">
          <span className="font-semibold">{actor.name}</span>
          {' '}
          <span className={cn('inline-flex', config.color)}>
            {config.icon}
          </span>
          {' '}
          {config.label}
          {target && (
            <>
              {' '}
              <span className="font-semibold">{target.name}</span>
            </>
          )}
        </p>
        {description && (
          <p className="text-xs text-[#4c8d9a] mt-1 line-clamp-1">
            {description}
          </p>
        )}
        <p className="text-xs text-[#4c8d9a] mt-1.5 flex items-center gap-1">
          <Clock size={12} aria-hidden="true" />
          {timeAgo}
        </p>
      </div>
    </div>
  );
}

ActivityItem.displayName = 'ActivityItem';

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
