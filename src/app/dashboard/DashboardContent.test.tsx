/**
 * Tests for DashboardContent component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardContent } from './DashboardContent';
import { TreeGrid } from '@/components/dashboard';
import { ActivityTimeline } from '@/components/dashboard';
import { InvitationsWidget } from '@/components/dashboard';

// Mock the components
jest.mock('@/components/dashboard', () => ({
  TreeGrid: ({ trees, limit }: { trees: unknown[]; limit?: number }) => (
    <div data-testid="tree-grid">
      <span data-testid="tree-count">{trees.length}</span>
      {limit && <span data-testid="tree-limit">{limit}</span>}
    </div>
  ),
  ActivityTimeline: ({ activities }: { activities: unknown[] }) => (
    <div data-testid="activity-timeline">
      <span data-testid="activity-count">{activities.length}</span>
    </div>
  ),
  InvitationsWidget: ({ invitations }: { invitations: unknown[] }) => (
    <div data-testid="invitations-widget">
      <span data-testid="invitation-count">{invitations.length}</span>
    </div>
  ),
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
  DashboardNavbar: ({ userName }: { userName?: string }) => (
    <nav data-testid="dashboard-navbar">{userName || 'User'}</nav>
  ),
  MobileBottomNav: () => <div data-testid="mobile-bottom-nav" />,
  DNAInsightsBanner: ({ matchCount }: { matchCount: number }) => (
    <div data-testid="dna-banner">{matchCount} matches</div>
  ),
}));

jest.mock('@/components/dashboard/CreateTreeModal', () => ({
  CreateTreeModal: ({ isOpen, onCreate }: { isOpen: boolean; onCreate: () => void }) =>
    isOpen ? <div data-testid="create-tree-modal">Modal Open</div> : null,
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/Toast', () => ({
  Toast: ({ message }: { message: string }) => <div data-testid="toast">{message}</div>,
}));

jest.mock('@/hooks/useCreateTree', () => ({
  useCreateTree: () => ({
    createTree: {
      mutateAsync: async () => ({ success: true, data: { _id: 'tree-123' } }),
    },
  }),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toasts: [], removeToast: jest.fn() }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('DashboardContent', () => {
  const mockUserId = 'user-123';
  const mockUserName = 'John Doe';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show skeleton when loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
      });
    });
  });

  describe('data display', () => {
    const mockDashboardData = {
      trees: [
        {
          id: 'tree-1',
          name: 'Family Tree 1',
          memberCount: 5,
          relationshipCount: 3,
          mediaCount: 2,
          generations: 2,
          coverImage: '/cover1.jpg',
          isMain: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z',
        },
        {
          id: 'tree-2',
          name: 'Family Tree 2',
          memberCount: 10,
          relationshipCount: 8,
          mediaCount: 5,
          generations: 3,
          coverImage: undefined,
          isMain: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-10T00:00:00.000Z',
        },
      ],
      invitations: [
        {
          id: 'inv-1',
          treeId: 'tree-3',
          treeName: 'Collaborative Tree',
          invitedBy: 'Jane Smith',
          createdAt: '2024-01-05T00:00:00.000Z',
          expiresAt: '2024-01-20T00:00:00.000Z',
        },
      ],
      recentActivity: [
        {
          _id: 'act-1',
          treeId: 'tree-1',
          userId: 'user-123',
          action: 'create',
          entityType: 'Person',
          entityId: 'person-1',
          changes: [],
          timestamp: '2024-01-10T00:00:00.000Z',
        },
        {
          _id: 'act-2',
          treeId: 'tree-1',
          userId: 'user-123',
          action: 'create',
          entityType: 'Media',
          entityId: 'media-1',
          changes: [],
          timestamp: '2024-01-09T00:00:00.000Z',
        },
      ],
      dnaMatches: 0,
      summary: {
        totalTrees: 2,
        totalMembers: 15,
        totalMedia: 7,
      },
    };

    it('should display trees correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockDashboardData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tree-grid')).toBeInTheDocument();
      });

      // Check that tree count is correct
      const treeCount = screen.getByTestId('tree-count');
      expect(treeCount).toHaveTextContent('2');
    });

    it('should display welcome message with correct stats', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockDashboardData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/15 members across 2 family trees/i)).toBeInTheDocument();
    });

    it('should display activities correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockDashboardData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      });

      // Check that activity count is correct
      const activityCount = screen.getByTestId('activity-count');
      expect(activityCount).toHaveTextContent('2');
    });

    it('should display invitations correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockDashboardData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('invitations-widget')).toBeInTheDocument();
      });

      // Check that invitation count is correct
      const invitationCount = screen.getByTestId('invitation-count');
      expect(invitationCount).toHaveTextContent('1');
    });

    it('should handle empty data', async () => {
      const emptyData = {
        trees: [],
        invitations: [],
        recentActivity: [],
        dnaMatches: 0,
        summary: {
          totalTrees: 0,
          totalMembers: 0,
          totalMedia: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: emptyData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/0 members across 0 family trees/i)).toBeInTheDocument();
    });
  });

  describe('data mapping', () => {
    it('should map tree data to ITree interface correctly', async () => {
      const mockData = {
        trees: [
          {
            id: 'tree-1',
            name: 'Test Tree',
            memberCount: 5,
            relationshipCount: 3,
            mediaCount: 2,
            generations: 2,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-15T00:00:00.000Z',
          },
        ],
        invitations: [],
        recentActivity: [],
        dnaMatches: 0,
        summary: {
          totalTrees: 1,
          totalMembers: 5,
          totalMedia: 2,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tree-grid')).toBeInTheDocument();
      });
    });

    it('should map activity data to Activity interface correctly', async () => {
      const mockData = {
        trees: [],
        invitations: [],
        recentActivity: [
          {
            _id: 'act-1',
            treeId: 'tree-1',
            userId: 'user-123',
            action: 'create',
            entityType: 'Person',
            entityId: 'person-1',
            changes: [],
            timestamp: '2024-01-10T00:00:00.000Z',
          },
        ],
        dnaMatches: 0,
        summary: {
          totalTrees: 0,
          totalMembers: 0,
          totalMedia: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      });
    });

    it('should map invitation data to Invitation interface correctly', async () => {
      const mockData = {
        trees: [],
        invitations: [
          {
            id: 'inv-1',
            treeId: 'tree-1',
            treeName: 'Test Tree',
            invitedBy: 'Jane Doe',
            createdAt: '2024-01-05T00:00:00.000Z',
          },
        ],
        recentActivity: [],
        dnaMatches: 0,
        summary: {
          totalTrees: 0,
          totalMembers: 0,
          totalMedia: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('invitations-widget')).toBeInTheDocument();
      });
    });
  });

  describe('activity type mapping', () => {
    it('should map person.created to person type', async () => {
      const mockData = {
        trees: [],
        invitations: [],
        recentActivity: [
          {
            _id: 'act-1',
            treeId: 'tree-1',
            userId: 'user-123',
            action: 'create',
            entityType: 'Person',
            entityId: 'person-1',
            changes: [],
            timestamp: '2024-01-10T00:00:00.000Z',
          },
        ],
        dnaMatches: 0,
        summary: { totalTrees: 0, totalMembers: 0, totalMedia: 0 },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      });
    });

    it('should map photo.uploaded to photo type', async () => {
      const mockData = {
        trees: [],
        invitations: [],
        recentActivity: [
          {
            _id: 'act-1',
            treeId: 'tree-1',
            userId: 'user-123',
            action: 'create',
            entityType: 'Media',
            entityId: 'media-1',
            changes: [],
            timestamp: '2024-01-10T00:00:00.000Z',
          },
        ],
        dnaMatches: 0,
        summary: { totalTrees: 0, totalMembers: 0, totalMedia: 0 },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      });
    });

    it('should map unknown actions to edit type', async () => {
      const mockData = {
        trees: [],
        invitations: [],
        recentActivity: [
          {
            _id: 'act-1',
            treeId: 'tree-1',
            userId: 'user-123',
            action: 'unknown',
            entityType: 'Unknown',
            entityId: 'entity-1',
            changes: [],
            timestamp: '2024-01-10T00:00:00.000Z',
          },
        ],
        dnaMatches: 0,
        summary: { totalTrees: 0, totalMembers: 0, totalMedia: 0 },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      render(<DashboardContent userId={mockUserId} userName={mockUserName} />, {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      });
    });
  });
});
