import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdatePerson } from '../usePerson';

// Mock fetch globally
global.fetch = jest.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUpdatePerson', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update person successfully and invalidate tree-data query', async () => {
    const mockPerson = {
      _id: 'person-1',
      treeId: 'tree-1',
      firstName: 'John',
      lastName: 'Smith',
      gender: 'male',
    };

    const updatedPerson = {
      ...mockPerson,
      firstName: 'Jane',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: updatedPerson }),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });

    // Set up initial data
    queryClient.setQueryData(['persons', 'person-1'], mockPerson);
    queryClient.setQueryData(['tree-data', 'tree-1'], {
      tree: { _id: 'tree-1', name: 'Test Tree' },
      persons: [mockPerson],
      relationships: [],
    });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdatePerson(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'person-1',
        data: { firstName: 'Jane' },
      });
    });

    // Verify the API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/persons/person-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Jane' }),
    });

    // Verify invalidateQueries was called with the correct query keys
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['persons', 'person-1'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['persons', 'tree', 'tree-1'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['tree-data', 'tree-1'] });
  });

  it('should handle errors when update fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Failed to update person' } }),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });

    const { result } = renderHook(() => useUpdatePerson(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: 'person-1',
          data: { firstName: 'Jane' },
        })
      ).rejects.toThrow('Failed to update person');
    });
  });

  it('should perform optimistic updates', async () => {
    const mockPerson = {
      _id: 'person-1',
      treeId: 'tree-1',
      firstName: 'John',
      lastName: 'Smith',
      gender: 'male',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockPerson }),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });

    // Set up initial data
    queryClient.setQueryData(['persons', 'person-1'], mockPerson);

    const { result } = renderHook(() => useUpdatePerson(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    act(() => {
      result.current.mutate({
        id: 'person-1',
        data: { firstName: 'Jane' },
      });
    });

    // Check optimistic update was applied
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['persons', 'person-1']) as any;
      expect(cachedData?.firstName).toBe('Jane');
    });
  });

  it('should rollback optimistic updates on error', async () => {
    const mockPerson = {
      _id: 'person-1',
      treeId: 'tree-1',
      firstName: 'John',
      lastName: 'Smith',
      gender: 'male',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Failed to update person' } }),
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });

    // Set up initial data
    queryClient.setQueryData(['persons', 'person-1'], mockPerson);

    const { result } = renderHook(() => useUpdatePerson(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    try {
      await act(async () => {
        await result.current.mutateAsync({
          id: 'person-1',
          data: { firstName: 'Jane' },
        });
      });
    } catch (error) {
      // Expected to throw
    }

    // Check rollback happened
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['persons', 'person-1']) as any;
      expect(cachedData?.firstName).toBe('John'); // Rolled back to original value
    });
  });
});
