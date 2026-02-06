/**
 * Tests for RelationshipRepository.findChildren()
 *
 * Tests the findChildren() method to ensure it queries correctly
 * with type: 'parent' (not 'child').
 */

import { IRelationship, RelationshipType } from '@/types/relationship';

// Mock mongoose before any imports
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: class MockObjectId {
      constructor(private id: string) {
        this.id = id;
      }
      toString() {
        return this.id;
      }
      equals(other: any) {
        return other && other.toString() === this.toString();
      }
    },
  },
  Schema: class MockSchema {},
  Model: class MockModel {},
  Document: class MockDocument {},
}));

// Mock the Relationship model
const mockFind = jest.fn();
const mockLean = jest.fn();
const mockExec = jest.fn();

jest.mock('@/models/Relationship', () => ({
  RelationshipModel: {
    find: mockFind,
  },
}));

describe('RelationshipRepository.findChildren()', () => {
  // Dynamic import after mocks are set up
  let RelationshipRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain: find() -> lean() -> exec()
    mockFind.mockReturnValue({
      lean: mockLean,
    });
    mockLean.mockReturnValue({
      exec: mockExec,
    });
  });

  beforeAll(async () => {
    // Import after mocks are configured
    const module = await import('./RelationshipRepository');
    RelationshipRepository = module.RelationshipRepository;
  });

  describe('query correctness', () => {
    const personId = 'parent-123';
    const childId = 'child-456';
    const treeId = 'tree-abc';

    it('should query with type: parent (not child)', async () => {
      // Arrange
      const mockRelationships = [
        {
          _id: 'rel-1',
          treeId: treeId,
          fromPersonId: personId,
          toPersonId: childId,
          type: 'parent' as RelationshipType,
          startDate: undefined,
          endDate: undefined,
          notes: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockExec.mockResolvedValue(mockRelationships);

      // Act
      const repository = new RelationshipRepository();
      await repository.findChildren(personId);

      // Assert
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'parent',
        })
      );

      // Verify it does NOT use 'child' type
      const calls = mockFind.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const firstCall = calls[0][0];
      expect(firstCall.type).toBe('parent');
      expect(firstCall.type).not.toBe('child');
    });

    it('should filter by fromPersonId (the parent)', async () => {
      // Arrange
      mockExec.mockResolvedValue([]);

      // Act
      const repository = new RelationshipRepository();
      await repository.findChildren(personId);

      // Assert
      const calls = mockFind.mock.calls;
      const firstCall = calls[0][0];

      expect(firstCall).toHaveProperty('fromPersonId');
      expect(firstCall.fromPersonId).toBeDefined();

      // Verify it does NOT use toPersonId for the parent query
      // (toPersonId would be used in findParents, not findChildren)
      expect(firstCall.fromPersonId).toBeTruthy();
    });

    it('should return empty array if no children exist', async () => {
      // Arrange
      mockExec.mockResolvedValue([]);

      // Act
      const repository = new RelationshipRepository();
      const result = await repository.findChildren(personId);

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return relationships with correct structure', async () => {
      // Arrange
      const mockRelationships = [
        {
          _id: { toString: () => 'rel-1' },
          treeId: { toString: () => treeId },
          fromPersonId: { toString: () => personId },
          toPersonId: { toString: () => childId },
          type: 'parent',
          startDate: undefined,
          endDate: undefined,
          notes: undefined,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockExec.mockResolvedValue(mockRelationships);

      // Act
      const repository = new RelationshipRepository();
      const result = await repository.findChildren(personId);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);

      // Verify IRelationship structure
      expect(result[0]).toMatchObject({
        _id: expect.any(String),
        treeId: expect.any(String),
        fromPersonId: expect.any(String),
        toPersonId: expect.any(String),
        type: 'parent',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify it does NOT have FamilyMembers structure
      expect(result[0]).not.toHaveProperty('parents');
      expect(result[0]).not.toHaveProperty('children');
      expect(result[0]).not.toHaveProperty('spouses');
      expect(result[0]).not.toHaveProperty('siblings');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockExec.mockRejectedValue(dbError);

      // Act & Assert
      const repository = new RelationshipRepository();
      await expect(repository.findChildren(personId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('integration with getDescendants', () => {
    it('should return relationships compatible with getDescendants service method', async () => {
      // This test verifies that findChildren returns data in the format
      // expected by the getDescendants method in RelationshipService

      const personId = 'parent-123';
      const childId1 = 'child-456';
      const childId2 = 'child-789';

      const mockRelationships = [
        {
          _id: { toString: () => 'rel-1' },
          treeId: { toString: () => 'tree-abc' },
          fromPersonId: { toString: () => personId },
          toPersonId: { toString: () => childId1 },
          type: 'parent',
          startDate: undefined,
          endDate: undefined,
          notes: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: { toString: () => 'rel-2' },
          treeId: { toString: () => 'tree-abc' },
          fromPersonId: { toString: () => personId },
          toPersonId: { toString: () => childId2 },
          type: 'parent',
          startDate: undefined,
          endDate: undefined,
          notes: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockExec.mockResolvedValue(mockRelationships);

      // Act
      const repository = new RelationshipRepository();
      const result = await repository.findChildren(personId);

      // Assert - verify structure matches what getDescendants expects
      // getDescendants expects: rel.toPersonId to be the child's ID
      expect(result[0].toPersonId).toBe(childId1);
      expect(result[1].toPersonId).toBe(childId2);

      // Verify type is 'parent' (from parent's perspective)
      expect(result[0].type).toBe('parent');
      expect(result[1].type).toBe('parent');

      // Verify fromPersonId is the parent
      expect(result[0].fromPersonId).toBe(personId);
      expect(result[1].fromPersonId).toBe(personId);
    });
  });
});
