/**
 * Dashboard API Route
 *
 * GET /api/dashboard - Get aggregated dashboard data for the authenticated user
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse } from '@/lib/api/response';
import { container } from '@/lib/di';

interface TreeWithStats {
  id: string;
  name: string;
  memberCount: number;
  relationshipCount: number;
  mediaCount: number;
  generations: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/dashboard
 * Aggregates dashboard data including trees, invitations, and recent activity.
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  // Get user's trees
  const trees = await container.treeService.getTreesByUserId(request.user.id);

  // Calculate stats for each tree
  const treesWithStats = await Promise.all(
    trees.map(async (tree) => {
      try {
        const stats = await container.treeService.getTreeStats(tree._id.toString(), request.user.id);
        return {
          id: tree._id.toString(),
          name: tree.name,
          memberCount: stats.memberCount,
          relationshipCount: stats.relationshipCount,
          mediaCount: stats.mediaCount,
          generations: stats.generations,
          createdAt: tree.createdAt,
          updatedAt: tree.updatedAt,
        } as TreeWithStats;
      } catch {
        // If stats fail, return basic tree info
        return {
          id: tree._id.toString(),
          name: tree.name,
          memberCount: 0,
          relationshipCount: 0,
          mediaCount: 0,
          generations: 0,
          createdAt: tree.createdAt,
          updatedAt: tree.updatedAt,
        } as TreeWithStats;
      }
    })
  );

  // Get recent activity (limit to 10 items)
  let recentActivity: unknown[] = [];
  try {
    recentActivity = await container.auditLogService.findByUserId(request.user.id, { limit: 10 });
  } catch {
    // If audit log fails, continue without it
    recentActivity = [];
  }

  // Get pending invitations if collaboration service is available
  let invitations: unknown[] = [];
  try {
    invitations = await container.collaborationService.getPendingInvitations('', request.user.id);
  } catch {
    // If collaboration service fails, continue without it
    invitations = [];
  }

  return successResponse({
    trees: treesWithStats,
    invitations,
    recentActivity,
    dnaMatches: 0, // Placeholder for future DNA feature
    summary: {
      totalTrees: treesWithStats.length,
      totalMembers: treesWithStats.reduce((sum: number, tree: TreeWithStats) => sum + tree.memberCount, 0),
      totalMedia: treesWithStats.reduce((sum: number, tree: TreeWithStats) => sum + tree.mediaCount, 0),
    },
  });
});
