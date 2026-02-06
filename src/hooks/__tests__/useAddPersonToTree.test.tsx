import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAddPersonToTree } from '../useAddPersonToTree';
import { normalizeRelationshipType } from '@/utils/relationshipNormalization';
import { RelationshipType } from '@/schemas/person';

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

describe('useAddPersonToTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add person to tree successfully', async () => {
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

    const { result } = renderHook(() => useAddPersonToTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.addPerson.mutateAsync({
        treeId: 'tree-1',
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
      });

      expect(response).toEqual({
        success: true,
        data: mockPerson,
      });
    });
  });

  it('should create relationship when connectToPersonId provided', async () => {
    const mockPerson = {
      _id: 'person-1',
      treeId: 'tree-1',
      firstName: 'Jane',
      lastName: 'Smith',
      gender: 'female',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPerson }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { _id: 'rel-1' } }),
      });

    const { result } = renderHook(() => useAddPersonToTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.addPerson.mutateAsync({
        treeId: 'tree-1',
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        connectToPersonId: 'person-2',
        relationshipType: 'child',
      });
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        treeId: 'tree-1',
        fromPersonId: 'person-2',
        toPersonId: 'person-1',
        type: 'parent',  // Normalized from 'child' to 'parent' from parent's perspective
      }),
    });
  });

  describe('normalizeRelationshipType', () => {
    it('should normalize "child" to parent relationship from parent perspective', () => {
      const result = normalizeRelationshipType('child', 'parent-id', 'child-id');
      expect(result).toEqual({
        fromPersonId: 'parent-id',
        toPersonId: 'child-id',
        type: 'parent',
      });
    });

    it('should normalize "parent" to parent relationship from parent perspective', () => {
      const result = normalizeRelationshipType('parent', 'child-id', 'parent-id');
      expect(result).toEqual({
        fromPersonId: 'parent-id',
        toPersonId: 'child-id',
        type: 'parent',
      });
    });

    it('should normalize "step-child" to parent relationship', () => {
      const result = normalizeRelationshipType('step-child', 'parent-id', 'child-id');
      expect(result).toEqual({
        fromPersonId: 'parent-id',
        toPersonId: 'child-id',
        type: 'parent',
      });
    });

    it('should normalize "step-parent" to parent relationship', () => {
      const result = normalizeRelationshipType('step-parent', 'child-id', 'parent-id');
      expect(result).toEqual({
        fromPersonId: 'parent-id',
        toPersonId: 'child-id',
        type: 'parent',
      });
    });

    it('should normalize "adoptive-child" to parent relationship', () => {
      const result = normalizeRelationshipType('adoptive-child', 'parent-id', 'child-id');
      expect(result).toEqual({
        fromPersonId: 'parent-id',
        toPersonId: 'child-id',
        type: 'parent',
      });
    });

    it('should normalize "adoptive-parent" to parent relationship', () => {
      const result = normalizeRelationshipType('adoptive-parent', 'child-id', 'parent-id');
      expect(result).toEqual({
        fromPersonId: 'parent-id',
        toPersonId: 'child-id',
        type: 'parent',
      });
    });

    it('should keep spouse relationship unchanged', () => {
      const result = normalizeRelationshipType('spouse', 'person1-id', 'person2-id');
      expect(result).toEqual({
        fromPersonId: 'person1-id',
        toPersonId: 'person2-id',
        type: 'spouse',
      });
    });

    it('should keep sibling relationship unchanged', () => {
      const result = normalizeRelationshipType('sibling', 'person1-id', 'person2-id');
      expect(result).toEqual({
        fromPersonId: 'person1-id',
        toPersonId: 'person2-id',
        type: 'sibling',
      });
    });

    it('should map partner to spouse', () => {
      const result = normalizeRelationshipType('partner', 'person1-id', 'person2-id');
      expect(result).toEqual({
        fromPersonId: 'person1-id',
        toPersonId: 'person2-id',
        type: 'spouse',
      });
    });
  });

  it('should handle errors when adding person fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Failed to create person' } }),
    });

    const { result } = renderHook(() => useAddPersonToTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.addPerson.mutateAsync({
        treeId: 'tree-1',
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
      });

      expect(response).toEqual({
        success: false,
        error: 'Failed to create person',
      });
    });
  });
});
