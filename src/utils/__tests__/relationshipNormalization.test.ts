import { normalizeRelationshipType, isParentChildType } from '../relationshipNormalization';
import { RelationshipType } from '@/schemas/person';

describe('relationshipNormalization', () => {
  describe('isParentChildType', () => {
    it('should return true for parent-child relationship types', () => {
      expect(isParentChildType('parent')).toBe(true);
      expect(isParentChildType('child')).toBe(true);
      expect(isParentChildType('step-parent')).toBe(true);
      expect(isParentChildType('step-child')).toBe(true);
      expect(isParentChildType('adoptive-parent')).toBe(true);
      expect(isParentChildType('adoptive-child')).toBe(true);
    });

    it('should return false for non-parent-child relationship types', () => {
      expect(isParentChildType('spouse')).toBe(false);
      expect(isParentChildType('sibling')).toBe(false);
      expect(isParentChildType('partner')).toBe(false);
    });
  });

  describe('normalizeRelationshipType', () => {
    const existingPersonId = 'existing-person-123';
    const newPersonId = 'new-person-456';

    describe('parent-child relationships', () => {
      it('should normalize "child" to parent relationship from parent perspective', () => {
        const result = normalizeRelationshipType('child', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: existingPersonId,  // parent
          toPersonId: newPersonId,         // child
          type: 'parent',
        });
      });

      it('should normalize "parent" to parent relationship from parent perspective', () => {
        const result = normalizeRelationshipType('parent', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: newPersonId,         // parent (new person)
          toPersonId: existingPersonId,      // child (existing person)
          type: 'parent',
        });
      });

      it('should normalize "step-child" to parent relationship', () => {
        const result = normalizeRelationshipType('step-child', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: existingPersonId,  // parent
          toPersonId: newPersonId,         // child
          type: 'parent',
        });
      });

      it('should normalize "step-parent" to parent relationship', () => {
        const result = normalizeRelationshipType('step-parent', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: newPersonId,         // parent (new person)
          toPersonId: existingPersonId,      // child (existing person)
          type: 'parent',
        });
      });

      it('should normalize "adoptive-child" to parent relationship', () => {
        const result = normalizeRelationshipType('adoptive-child', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: existingPersonId,  // parent
          toPersonId: newPersonId,         // child
          type: 'parent',
        });
      });

      it('should normalize "adoptive-parent" to parent relationship', () => {
        const result = normalizeRelationshipType('adoptive-parent', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: newPersonId,         // parent (new person)
          toPersonId: existingPersonId,      // child (existing person)
          type: 'parent',
        });
      });
    });

    describe('non-parent-child relationships', () => {
      it('should keep spouse relationship unchanged', () => {
        const result = normalizeRelationshipType('spouse', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: existingPersonId,
          toPersonId: newPersonId,
          type: 'spouse',
        });
      });

      it('should keep sibling relationship unchanged', () => {
        const result = normalizeRelationshipType('sibling', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: existingPersonId,
          toPersonId: newPersonId,
          type: 'sibling',
        });
      });

      it('should map partner to spouse', () => {
        const result = normalizeRelationshipType('partner', existingPersonId, newPersonId);
        expect(result).toEqual({
          fromPersonId: existingPersonId,
          toPersonId: newPersonId,
          type: 'spouse',  // partner is mapped to spouse
        });
      });
    });

    describe('edge cases', () => {
      it('should handle different person IDs correctly', () => {
        const result = normalizeRelationshipType('child', 'person-a', 'person-b');
        expect(result.fromPersonId).toBe('person-a');
        expect(result.toPersonId).toBe('person-b');
      });

      it('should always return type from database schema enum', () => {
        const allTypes: RelationshipType[] = [
          'parent', 'child', 'spouse', 'sibling',
          'step-parent', 'step-child', 'adoptive-parent', 'adoptive-child', 'partner'
        ];

        allTypes.forEach((type) => {
          const result = normalizeRelationshipType(type, existingPersonId, newPersonId);
          expect(['parent', 'spouse', 'sibling']).toContain(result.type);
        });
      });
    });
  });
});
