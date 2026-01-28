/**
 * Collaboration Service Stub Implementation
 *
 * This is a stub implementation to allow the application to compile.
 * Full implementation will be added in a future task.
 */

import type { ICollaborationService, CollaborationInvite } from './ICollaborationService';
import type { ICollaborator } from '@/types/tree';

/**
 * Stub implementation of CollaborationService.
 * All methods throw errors indicating the feature is not yet implemented.
 */
export class CollaborationService implements ICollaborationService {
  async inviteCollaborator(
    treeId: string,
    userId: string,
    email: string,
    role: string
  ): Promise<CollaborationInvite> {
    throw new Error('Collaboration feature not yet implemented');
  }

  async acceptInvitation(inviteToken: string, userId: string): Promise<void> {
    throw new Error('Collaboration feature not yet implemented');
  }

  async declineInvitation(inviteToken: string, userId: string): Promise<void> {
    throw new Error('Collaboration feature not yet implemented');
  }

  async getPendingInvitations(treeId: string, userId: string): Promise<CollaborationInvite[]> {
    // Return empty array for now to avoid breaking the dashboard
    return [];
  }

  async getCollaborators(treeId: string, userId: string): Promise<ICollaborator[]> {
    throw new Error('Collaboration feature not yet implemented');
  }

  async updateCollaboratorRole(
    treeId: string,
    userId: string,
    collaboratorId: string,
    role: string
  ): Promise<void> {
    throw new Error('Collaboration feature not yet implemented');
  }

  async removeCollaborator(treeId: string, userId: string, collaboratorId: string): Promise<void> {
    throw new Error('Collaboration feature not yet implemented');
  }

  async leaveTree(treeId: string, userId: string): Promise<void> {
    throw new Error('Collaboration feature not yet implemented');
  }
}
