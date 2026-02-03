import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTree } from '../useCreateTree';
import type { ITree } from '@/types/tree';

// Mock fetch globally
global.fetch = jest.fn();

// Mock next-auth session
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'test-user-id', name: 'Test User' } },
    status: 'authenticated',
  })),
}));

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
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
    mockFetch.mockClear();
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockTree }),
    } as Response);

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

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/trees',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Smith Family Tree'),
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

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Validation failed' }),
    } as Response);

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
