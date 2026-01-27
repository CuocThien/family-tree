import { ICollaborator } from '@/types/tree';

export interface CollaborationInvite {
  treeId: string;
  invitedEmail: string;
  role: string;
  invitedBy: string;
  expiresAt: Date;
}

/**
 * Service interface for Collaboration operations.
 * Handles invitations, collaborator management, and tree sharing.
 *
 * Business Rules:
 * - Only owner can invite/manage collaborators
 * - Invitations expire after 7 days
 * - Cannot demote owner
 * - Owner cannot leave (must transfer or delete)
 */
export interface ICollaborationService {
  // Invitations
  inviteCollaborator(treeId: string, userId: string, email: string, role: string): Promise<CollaborationInvite>;
  acceptInvitation(inviteToken: string, userId: string): Promise<void>;
  declineInvitation(inviteToken: string, userId: string): Promise<void>;
  getPendingInvitations(treeId: string, userId: string): Promise<CollaborationInvite[]>;

  // Collaborator Management
  getCollaborators(treeId: string, userId: string): Promise<ICollaborator[]>;
  updateCollaboratorRole(treeId: string, userId: string, collaboratorId: string, role: string): Promise<void>;
  removeCollaborator(treeId: string, userId: string, collaboratorId: string): Promise<void>;
  leaveTree(treeId: string, userId: string): Promise<void>;
}
