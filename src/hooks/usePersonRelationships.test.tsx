import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePersonRelationships, personRelationshipsKeys } from './usePersonRelationships';

// Mock fetch
global.fetch = jest.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('usePersonRelationships', () => {
  const mockPersonId = 'person123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch relationships successfully', async () => {
    const mockRelationships = [
      {
        _id: 'rel-person123-parent456',
        relatedPersonId: 'parent456',
        relationshipType: 'parent' as const,
        relatedPersonName: 'John Smith',
      },
      {
        _id: 'rel-person123-spouse789',
        relatedPersonId: 'spouse789',
        relationshipType: 'spouse' as const,
        relatedPersonName: 'Jane Smith',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRelationships }),
    });

    const { result } = renderHook(() => usePersonRelationships({ personId: mockPersonId }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRelationships);
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/persons/${mockPersonId}/relationships`
    );
  });

  it('should handle fetch errors gracefully', async () => {
    const mockError = { error: { message: 'Failed to fetch relationships' } };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    const { result } = renderHook(() => usePersonRelationships({ personId: mockPersonId }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      new Error('Failed to fetch relationships')
    );
  });

  it('should return empty array when no relationships exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    const { result } = renderHook(() => usePersonRelationships({ personId: mockPersonId }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should not fetch when personId is empty', () => {
    renderHook(() => usePersonRelationships({ personId: '' }), {
      wrapper: createWrapper(),
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should not fetch when enabled is false', () => {
    renderHook(() => usePersonRelationships({ personId: mockPersonId, enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should use correct query key', () => {
    const expectedKey = personRelationshipsKeys.detail(mockPersonId);
    expect(expectedKey).toEqual(['person-relationships', mockPersonId]);
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePersonRelationships({ personId: mockPersonId }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Network error'));
  });

  it('should return cached data on subsequent calls', async () => {
    const mockRelationships = [
      {
        _id: 'rel-person123-parent456',
        relatedPersonId: 'parent456',
        relationshipType: 'parent' as const,
        relatedPersonName: 'John Smith',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRelationships }),
    });

    const { result, rerender } = renderHook(
      () => usePersonRelationships({ personId: mockPersonId }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // First call should fetch
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Rerender should use cached data
    rerender();

    // Still only one fetch call (cache hit)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
