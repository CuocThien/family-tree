import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface Activity {
  id: string;
  type: 'photo' | 'person' | 'document' | 'edit';
  title: string;
  description: string;
  timestamp: Date;
  thumbnails?: string[];
}

const activityColors: Record<Activity['type'], string> = {
  photo: 'bg-green-500',
  person: 'bg-blue-500',
  document: 'bg-purple-500',
  edit: 'bg-orange-500',
};

export interface ActivityTimelineProps {
  activities: Activity[];
  maxItems?: number;
  onLoadMore?: () => void;
}

export function ActivityTimeline({ activities, maxItems = 5, onLoadMore }: ActivityTimelineProps) {
  const displayActivities = activities.slice(0, maxItems);
  const hasMore = activities.length > maxItems;

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg text-[#0d191b] dark:text-white mb-5">
            Recent Activity
          </h3>
          <p className="text-sm text-[#4c8d9a]">No recent activity to show.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-bold text-lg text-[#0d191b] dark:text-white mb-5">
          Recent Activity
        </h3>
        <div className="flex flex-col gap-6 relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-[#e7f1f3] dark:bg-white/10" />

          {displayActivities.map((activity, index) => (
            <ActivityItem key={activity.id} activity={activity} index={index} />
          ))}
        </div>
        {hasMore && onLoadMore && (
          <Button variant="outline" className="w-full mt-5" onClick={onLoadMore}>
            Show More Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

ActivityTimeline.displayName = 'ActivityTimeline';

interface ActivityItemProps {
  activity: Activity;
  index: number;
}

function ActivityItem({ activity, index }: ActivityItemProps) {
  const color = activityColors[activity.type];
  const timeAgo = formatRelativeTime(activity.timestamp);

  return (
    <div className="flex items-start gap-4 relative">
      {/* Timeline dot */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0',
          'bg-white dark:bg-[#101f22] border-2',
          index === 0 ? 'border-[#13c8ec]' : 'border-[#e7f1f3] dark:border-white/10'
        )}
      >
        <div className={cn('w-3 h-3 rounded-full', color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0d191b] dark:text-white">
          {activity.title}
        </p>
        {activity.description && (
          <p className="text-xs text-[#4c8d9a] mt-1 line-clamp-2">
            {activity.description}
          </p>
        )}
        <p className="text-xs text-[#4c8d9a] mt-1.5">{timeAgo}</p>

        {/* Thumbnails */}
        {activity.thumbnails && activity.thumbnails.length > 0 && (
          <div className="flex gap-2 mt-2">
            {activity.thumbnails.slice(0, 3).map((thumb, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg bg-cover bg-center border border-[#e7f1f3] dark:border-white/10"
                style={{ backgroundImage: `url(${thumb})` }}
              />
            ))}
          </div>
        )}
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
