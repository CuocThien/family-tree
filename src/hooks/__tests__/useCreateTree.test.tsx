import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTree } from '../useCreateTree';
import { container } from '@/lib/di';
import type { ITree } from '@/types/tree';

// Mock the DI container
jest.mock('@/lib/di', () => ({
  container: {
    treeService: {
      createTree: jest.fn(),
    },
  },
}));

// Mock next-auth session
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'test-user-id', name: 'Test User' } },
    status: 'authenticated',
  })),
}));

const mockTreeService = container.treeService as jest.Mocked<typeof container.treeService>;
const mockUseSession = require('next-auth/react').useSession as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useCreateTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { id: 'test-user-id', name: 'Test User' } },
      status: 'authenticated',
    });
  });

  it('should create tree successfully', async () => {
    const mockTree: ITree = {
      _id: 'tree-1',
      ownerId: 'test-user-id',
      name: 'Smith Family Tree',
      description: 'The Smith lineage',
      settings: {
        isPublic: false,
        allowComments: true,
        defaultPhotoQuality: 'medium',
        language: 'en',
      },
      collaborators: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockTreeService.createTree.mockResolvedValue(mockTree);

    const { result } = renderHook(() => useCreateTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.createTree.mutateAsync({
        name: 'Smith Family Tree',
        description: 'The Smith lineage',
        visibility: 'private',
        allowCollaborators: false,
      });

      expect(response).toEqual({
        success: true,
        data: mockTree,
      });
    });

    expect(mockTreeService.createTree).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({
        name: 'Smith Family Tree',
        settings: expect.objectContaining({
          isPublic: false,
        }),
      })
    );
  });

  it('should return error when not logged in', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { result } = renderHook(() => useCreateTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.createTree.mutateAsync({
        name: 'Test Tree',
        description: 'Test',
        visibility: 'private',
        allowCollaborators: false,
      });

      expect(response).toEqual({
        success: false,
        error: 'You must be logged in to create a tree',
      });
    });

    expect(mockTreeService.createTree).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    const mockError = new Error('Validation failed');
    mockTreeService.createTree.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCreateTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.createTree.mutateAsync({
        name: 'AB',
        description: '',
        visibility: 'private',
        allowCollaborators: false,
      });

      expect(response).toEqual({
        success: false,
        error: 'Validation failed',
      });
    });
  });
});
