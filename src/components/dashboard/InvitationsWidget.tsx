import { Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { InvitationCard } from '@/components/collaboration/InvitationCard';

export interface Invitation {
  id: string;
  treeName: string;
  inviterName: string;
  inviterAvatar?: string;
  inviteEmail: string;
  permission: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
}

export interface InvitationsWidgetProps {
  invitations: Invitation[];
  onAccept?: (invitationId: string) => void | Promise<void>;
  onDecline?: (invitationId: string) => void | Promise<void>;
}

export function InvitationsWidget({ invitations, onAccept, onDecline }: InvitationsWidgetProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="text-[#13c8ec]" size={20} aria-hidden="true" />
          <h3 className="font-bold text-lg text-[#0d191b] dark:text-white">
            Invitations
          </h3>
          <span className="ml-auto bg-[#13c8ec] text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {invitations.length}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {invitations.slice(0, 5).map((invite) => (
            <InvitationCard
              key={invite.id}
              treeName={invite.treeName}
              treeOwnerName={invite.inviterName}
              treeOwnerAvatar={invite.inviterAvatar}
              inviteEmail={invite.inviteEmail}
              permission={invite.permission}
              status={invite.status}
              invitedAt={invite.createdAt}
              expiresAt={invite.expiresAt}
              onAccept={onAccept ? () => onAccept(invite.id) : undefined}
              onDecline={onDecline ? () => onDecline(invite.id) : undefined}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

InvitationsWidget.displayName = 'InvitationsWidget';
