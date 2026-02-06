import { renderHook, act } from '@testing-library/react';
import { useManageRelationships } from '../useManageRelationships';

describe('useManageRelationships', () => {
  describe('initialRelationships with relatedPersonName', () => {
    it('should preserve relatedPersonName from initial relationships', () => {
      const initialRelationships = [
        {
          relatedPersonId: 'person-1',
          relationshipType: 'spouse' as const,
          relatedPersonName: 'Jane Doe',
        },
        {
          relatedPersonId: 'person-2',
          relationshipType: 'child' as const,
          relatedPersonName: 'Baby Smith',
        },
      ];

      const { result } = renderHook(() =>
        useManageRelationships({
          initialRelationships,
          maxRelationships: 10,
        })
      );

      expect(result.current.relationships).toHaveLength(2);
      expect(result.current.relationships[0].relatedPersonName).toBe('Jane Doe');
      expect(result.current.relationships[0].relatedPersonId).toBe('person-1');
      expect(result.current.relationships[0].relationshipType).toBe('spouse');
      expect(result.current.relationships[1].relatedPersonName).toBe('Baby Smith');
      expect(result.current.relationships[1].relatedPersonId).toBe('person-2');
      expect(result.current.relationships[1].relationshipType).toBe('child');
    });

    it('should handle empty relatedPersonName gracefully', () => {
      const initialRelationships = [
        {
          relatedPersonId: 'person-1',
          relationshipType: 'spouse' as const,
        },
      ];

      const { result } = renderHook(() =>
        useManageRelationships({
          initialRelationships,
          maxRelationships: 10,
        })
      );

      expect(result.current.relationships).toHaveLength(1);
      expect(result.current.relationships[0].relatedPersonName).toBe('');
    });

    it('should assign unique tempIds to each relationship', () => {
      const initialRelationships = [
        {
          relatedPersonId: 'person-1',
          relationshipType: 'spouse' as const,
          relatedPersonName: 'Jane Doe',
        },
        {
          relatedPersonId: 'person-2',
          relationshipType: 'child' as const,
          relatedPersonName: 'Baby Smith',
        },
      ];

      const { result } = renderHook(() =>
        useManageRelationships({
          initialRelationships,
          maxRelationships: 10,
        })
      );

      const tempIds = result.current.relationships.map((rel) => rel.tempId);
      expect(new Set(tempIds).size).toBe(2);
    });
  });

  describe('removeRelationship', () => {
    it('should remove relationship by tempId', () => {
      const initialRelationships = [
        {
          relatedPersonId: 'person-1',
          relationshipType: 'spouse' as const,
          relatedPersonName: 'Jane Doe',
        },
      ];

      const { result } = renderHook(() =>
        useManageRelationships({
          initialRelationships,
          maxRelationships: 10,
        })
      );

      const tempId = result.current.relationships[0].tempId;

      act(() => {
        result.current.removeRelationship(tempId);
      });

      expect(result.current.relationships).toHaveLength(0);
    });
  });

  describe('updateRelationshipType', () => {
    it('should update relationship type', () => {
      const initialRelationships = [
        {
          relatedPersonId: 'person-1',
          relationshipType: 'spouse' as const,
          relatedPersonName: 'Jane Doe',
        },
      ];

      const { result } = renderHook(() =>
        useManageRelationships({
          initialRelationships,
          maxRelationships: 10,
        })
      );

      const tempId = result.current.relationships[0].tempId;

      act(() => {
        result.current.updateRelationshipType(tempId, 'parent' as const);
      });

      expect(result.current.relationships[0].relationshipType).toBe('parent');
      expect(result.current.relationships[0].relatedPersonName).toBe('Jane Doe'); // Name should be preserved
    });
  });

  describe('getRelationshipsForSubmit', () => {
    it('should return relationships without relatedPersonName for submission', () => {
      const initialRelationships = [
        {
          relatedPersonId: 'person-1',
          relationshipType: 'spouse' as const,
          relatedPersonName: 'Jane Doe',
        },
      ];

      const { result } = renderHook(() =>
        useManageRelationships({
          initialRelationships,
          maxRelationships: 10,
        })
      );

      const submitData = result.current.getRelationshipsForSubmit();

      expect(submitData).toHaveLength(1);
      expect(submitData[0]).toEqual({
        relatedPersonId: 'person-1',
        relationshipType: 'spouse',
      });
      expect(submitData[0]).not.toHaveProperty('relatedPersonName');
    });
  });

  describe('canAddMore', () => {
    it('should return true when under max relationships', () => {
      const { result } = renderHook(() =>
        useManageRelationships({
          initialRelationships: [],
          maxRelationships: 10,
        })
      );

      expect(result.current.canAddMore).toBe(true);
    });

    it('should return false when at max relationships', () => {
      const initialRelationships = Array.from({ length: 10 }, (_, i) => ({
        relatedPersonId: `person-${i}`,
        relationshipType: 'spouse' as const,
        relatedPersonName: `Person ${i}`,
      }));

      const { result } = renderHook(() =>
        useManageRelationships({
          initialRelationships,
          maxRelationships: 10,
        })
      );

      expect(result.current.canAddMore).toBe(false);
    });
  });
});
