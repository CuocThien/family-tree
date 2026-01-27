import { Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { ITree } from '@/types/tree';

export interface TreeCardProps {
  tree: ITree;
  memberCount: number;
  lastUpdated: Date;
  isMain?: boolean;
  coverImage?: string;
  onClick?: () => void;
  className?: string;
}

export function TreeCard({
  tree,
  memberCount,
  lastUpdated,
  isMain = false,
  coverImage,
  onClick,
  className,
}: TreeCardProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 group cursor-pointer', className)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View tree: ${tree.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-[1.02]">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />

        {/* Cover image or fallback */}
        {coverImage ? (
          <div
            className="w-full h-full bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${coverImage})` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#13c8ec]/20 to-[#13c8ec]/5 flex items-center justify-center">
            <Users className="w-16 h-16 text-[#13c8ec]/40" />
          </div>
        )}

        {/* Main Badge */}
        {isMain && (
          <div className="absolute bottom-3 left-3 z-20">
            <Badge variant="primary">Main</Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-[#0d191b] dark:text-white text-base font-bold group-hover:text-[#13c8ec] transition-colors line-clamp-1">
          {tree.name}
        </p>
        <div className="flex items-center gap-3 text-[#4c8d9a] text-xs">
          <span className="flex items-center gap-1">
            <Users size={14} aria-hidden="true" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} aria-hidden="true" />
            {formatRelativeTime(lastUpdated)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y`;
}
