import { Mail, Check, X, Clock } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { PermissionLevel } from '@/types/tree';

export interface InvitationCardProps {
  treeName: string;
  treeOwnerName: string;
  treeOwnerAvatar?: string;
  inviteEmail: string;
  permission: PermissionLevel;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedAt: Date;
  expiresAt?: Date;
  onAccept?: () => void | Promise<void>;
  onDecline?: () => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const permissionConfig: Record<
  PermissionLevel,
  { label: string; variant: 'primary' | 'secondary' | 'outline' }
> = {
  viewer: { label: 'Can View', variant: 'outline' },
  editor: { label: 'Can Edit', variant: 'secondary' },
  admin: { label: 'Admin', variant: 'primary' },
};

const statusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }
> = {
  pending: { label: 'Pending', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  declined: { label: 'Declined', variant: 'danger' },
  expired: { label: 'Expired', variant: 'warning' },
};

export function InvitationCard({
  treeName,
  treeOwnerName,
  treeOwnerAvatar,
  inviteEmail,
  permission,
  status,
  invitedAt,
  expiresAt,
  onAccept,
  onDecline,
  isLoading = false,
  className,
}: InvitationCardProps) {
  const permissionInfo = permissionConfig[permission];
  const statusInfo = statusConfig[status];
  const isPending = status === 'pending';

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Tree Owner Avatar */}
          <Avatar
            src={treeOwnerAvatar}
            fullName={treeOwnerName}
            size="lg"
            alt={treeOwnerName}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-[#4c8d9a]">
                  Invitation from{' '}
                  <span className="font-semibold text-[#0d191b] dark:text-white">
                    {treeOwnerName}
                  </span>
                </p>
                <h3 className="text-lg font-bold text-[#0d191b] dark:text-white mt-1">
                  {treeName}
                </h3>
              </div>
              <Badge variant={statusInfo.variant} size="sm">
                {statusInfo.label}
              </Badge>
            </div>

            {/* Permission Badge */}
            <div className="mt-2">
              <Badge variant={permissionInfo.variant} size="sm">
                {permissionInfo.label}
              </Badge>
            </div>

            {/* Invite Details */}
            <div className="mt-3 text-xs text-[#4c8d9a] flex items-center gap-1">
              <Mail size={12} aria-hidden="true" />
              Sent to {inviteEmail}
            </div>

            {/* Expiry Info */}
            {expiresAt && isPending && (
              <div className="mt-1 text-xs text-[#4c8d9a] flex items-center gap-1">
                <Clock size={12} aria-hidden="true" />
                Expires {formatDate(expiresAt)}
              </div>
            )}

            {/* Actions */}
            {isPending && (onAccept || onDecline) && (
              <div className="flex items-center gap-2 mt-4">
                {onDecline && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDecline}
                    loading={isLoading}
                    leftIcon={<X size={16} />}
                  >
                    Decline
                  </Button>
                )}
                {onAccept && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onAccept}
                    loading={isLoading}
                    leftIcon={<Check size={16} />}
                  >
                    Accept
                  </Button>
                )}
              </div>
            )}

            {/* Accepted/Declined Message */}
            {!isPending && (
              <div className="mt-3 text-sm text-[#4c8d9a]">
                {status === 'accepted' && (
                  <span className="flex items-center gap-1 text-green-500">
                    <Check size={16} />
                    You are now a collaborator on this tree
                  </span>
                )}
                {status === 'declined' && (
                  <span className="flex items-center gap-1 text-red-500">
                    <X size={16} />
                    You declined this invitation
                  </span>
                )}
                {status === 'expired' && (
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    This invitation has expired
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

InvitationCard.displayName = 'InvitationCard';

function formatDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) {
    return 'soon';
  }

  if (diffInDays === 1) {
    return 'tomorrow';
  }

  if (diffInDays <= 7) {
    return `in ${diffInDays} days`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
