import { RelationshipService } from './RelationshipService';
import { IRelationshipService, FamilyMembers, AncestryPath } from './IRelationshipService';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { CreateRelationshipDto, UpdateRelationshipDto } from '@/types/dtos/relationship';
import { IRelationship, RelationshipType } from '@/types/relationship';
import { IPerson } from '@/types/person';
import { ValidationError, PermissionError, NotFoundError, BusinessRuleError } from '@/services/errors/ServiceErrors';

describe('RelationshipService', () => {
  let service: RelationshipService;
  let mockRelationshipRepo: jest.Mocked<IRelationshipRepository>;
  let mockPersonRepo: jest.Mocked<IPersonRepository>;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let mockAuditRepo: jest.Mocked<IAuditRepository>;

  const mockPerson: IPerson = {
    _id: 'person-1',
    treeId: 'tree-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPerson2: IPerson = {
    _id: 'person-2',
    treeId: 'tree-1',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: new Date('1995-01-01'),
    gender: 'female',
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRelationship: IRelationship = {
    _id: 'rel-1',
    treeId: 'tree-1',
    fromPersonId: 'person-1',
    toPersonId: 'person-2',
    type: 'parent',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRelationshipRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      findByPersonId: jest.fn(),
      findBetweenPersons: jest.fn(),
      findParents: jest.fn(),
      findChildren: jest.fn(),
      findSpouses: jest.fn(),
      findSiblings: jest.fn(),
    } as unknown as jest.Mocked<IRelationshipRepository>;

    mockPersonRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByTreeId: jest.fn(),
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
      countByTreeId: jest.fn(),
      exists: jest.fn(),
      existsInTree: jest.fn(),
    } as unknown as jest.Mocked<IPersonRepository>;

    mockPermissionService = {
      canAccess: jest.fn(),
      getPermissions: jest.fn(),
      getRolePermissions: jest.fn(),
      hasMinimumRole: jest.fn(),
      invalidateCache: jest.fn(),
    } as unknown as jest.Mocked<IPermissionService>;

    mockAuditRepo = {
      create: jest.fn(),
      findByTreeId: jest.fn(),
      findByUserId: jest.fn(),
      findByEntityId: jest.fn(),
      countByTreeId: jest.fn(),
      archiveOlderThan: jest.fn(),
    } as unknown as jest.Mocked<IAuditRepository>;

    service = new RelationshipService(
      mockRelationshipRepo,
      mockPersonRepo,
      mockPermissionService,
      mockAuditRepo
    );
  });

  describe('createRelationship', () => {
    const validData: CreateRelationshipDto = {
      fromPersonId: 'person-1',
      toPersonId: 'person-2',
      type: 'parent',
    };

    it('should create relationship when valid', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockRelationshipRepo.findBetweenPersons.mockResolvedValue(null);
      mockRelationshipRepo.findParents.mockResolvedValue([]); // Mock for parent check
      mockRelationshipRepo.findByPersonId.mockResolvedValue([]); // Mock for cycle check
      mockRelationshipRepo.create.mockResolvedValue(mockRelationship);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.createRelationship('tree-1', 'user-1', validData);

      expect(result).toEqual(mockRelationship);
      expect(mockRelationshipRepo.create).toHaveBeenCalled();
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.createRelationship('tree-1', 'user-2', validData)).rejects.toThrow(
        PermissionError
      );
    });

    it('should throw NotFoundError when person not found', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findById.mockResolvedValue(null);

      await expect(service.createRelationship('tree-1', 'user-1', validData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError for self-relationship', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);
      const selfData = { ...validData, fromPersonId: 'person-1', toPersonId: 'person-1' };
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockRelationshipRepo.findParents.mockResolvedValue([]);

      await expect(service.createRelationship('tree-1', 'user-1', selfData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw BusinessRuleError for persons in different trees', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findById
        .mockResolvedValueOnce(mockPerson)
        .mockResolvedValueOnce({ ...mockPerson2, treeId: 'tree-2' });
      mockRelationshipRepo.findParents.mockResolvedValue([]);

      await expect(service.createRelationship('tree-1', 'user-1', validData)).rejects.toThrow(
        BusinessRuleError
      );
    });
  });

  describe('updateRelationship', () => {
    const updateData: UpdateRelationshipDto = {
      startDate: new Date('1990-01-01'),
      notes: 'Updated notes',
    };

    it('should update relationship when user has permission', async () => {
      mockRelationshipRepo.findById.mockResolvedValue(mockRelationship);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockRelationshipRepo.update.mockResolvedValue({
        ...mockRelationship,
        ...updateData,
      });
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.updateRelationship('rel-1', 'user-1', updateData);

      expect(result.startDate).toEqual(updateData.startDate);
      expect(mockRelationshipRepo.update).toHaveBeenCalledWith('rel-1', updateData);
    });

    it('should throw NotFoundError when relationship not found', async () => {
      mockRelationshipRepo.findById.mockResolvedValue(null);

      await expect(service.updateRelationship('nonexistent', 'user-1', updateData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockRelationshipRepo.findById.mockResolvedValue(mockRelationship);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.updateRelationship('rel-1', 'user-2', updateData)).rejects.toThrow(
        PermissionError
      );
    });
  });

  describe('deleteRelationship', () => {
    it('should delete relationship when user has permission', async () => {
      mockRelationshipRepo.findById.mockResolvedValue(mockRelationship);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockRelationshipRepo.delete.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      await service.deleteRelationship('rel-1', 'user-1');

      expect(mockRelationshipRepo.delete).toHaveBeenCalledWith('rel-1');
      expect(mockAuditRepo.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError when relationship not found', async () => {
      mockRelationshipRepo.findById.mockResolvedValue(null);

      await expect(service.deleteRelationship('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockRelationshipRepo.findById.mockResolvedValue(mockRelationship);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.deleteRelationship('rel-1', 'user-2')).rejects.toThrow(PermissionError);
    });
  });

  describe('getFamilyMembers', () => {
    it('should return all family members', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockRelationshipRepo.findParents.mockResolvedValue([mockRelationship]);
      mockRelationshipRepo.findChildren.mockResolvedValue([]);
      mockRelationshipRepo.findSpouses.mockResolvedValue([]);
      mockRelationshipRepo.findSiblings.mockResolvedValue([]);
      mockPersonRepo.findByIds.mockResolvedValue([mockPerson2]);

      const result = await service.getFamilyMembers('person-1', 'user-1');

      expect(result.parents).toHaveLength(1);
      expect(result.children).toHaveLength(0);
      expect(result.spouses).toHaveLength(0);
      expect(result.siblings).toHaveLength(0);
    });

    it('should throw NotFoundError when person not found', async () => {
      mockPersonRepo.findById.mockResolvedValue(null);

      await expect(service.getFamilyMembers('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.getFamilyMembers('person-1', 'user-2')).rejects.toThrow(
        PermissionError
      );
    });
  });

  describe('getAncestors', () => {
    it('should return ancestor path', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockRelationshipRepo.findParents.mockResolvedValue([]);

      const result = await service.getAncestors('person-1', 'user-1', 3);

      expect(result.generations).toHaveLength(1);
      expect(result.depth).toBe(1);
    });

    it('should throw NotFoundError when person not found', async () => {
      mockPersonRepo.findById.mockResolvedValue(null);

      await expect(service.getAncestors('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.getAncestors('person-1', 'user-2')).rejects.toThrow(PermissionError);
    });
  });

  describe('getDescendants', () => {
    it('should return descendant path', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockRelationshipRepo.findChildren.mockResolvedValue([]);

      const result = await service.getDescendants('person-1', 'user-1', 3);

      expect(result.generations).toHaveLength(1);
      expect(result.depth).toBe(1);
    });

    it('should throw NotFoundError when person not found', async () => {
      mockPersonRepo.findById.mockResolvedValue(null);

      await expect(service.getDescendants('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.getDescendants('person-1', 'user-2')).rejects.toThrow(
        PermissionError
      );
    });
  });

  describe('validateRelationship', () => {
    const validData: CreateRelationshipDto = {
      fromPersonId: 'person-1',
      toPersonId: 'person-2',
      type: 'parent',
    };

    it('should return empty array for valid relationship', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockRelationshipRepo.findParents.mockResolvedValue([]);

      const result = await service.validateRelationship(validData);

      expect(result).toEqual([]);
    });

    it('should return error for self-relationship', async () => {
      const selfData = { ...validData, fromPersonId: 'person-1', toPersonId: 'person-1' };
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockRelationshipRepo.findParents.mockResolvedValue([]);

      const result = await service.validateRelationship(selfData);

      expect(result).toContain('Cannot create relationship with same person');
    });

    it('should return error when from person not found', async () => {
      mockPersonRepo.findById.mockResolvedValue(null);

      const result = await service.validateRelationship(validData);

      expect(result).toContain('From person not found');
    });
  });

  describe('checkForCycles', () => {
    it('should return false for non-parent relationships', async () => {
      const result = await service.checkForCycles('person-1', 'person-2', 'spouse');

      expect(result).toBe(false);
    });
  });

  describe('suggestRelationships', () => {
    it('should return relationship suggestions', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findByTreeId.mockResolvedValue([mockPerson, mockPerson2]);
      mockRelationshipRepo.findByPersonId.mockResolvedValue([]);

      const result = await service.suggestRelationships('person-1', 'user-1');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundError when person not found', async () => {
      mockPersonRepo.findById.mockResolvedValue(null);

      await expect(service.suggestRelationships('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.suggestRelationships('person-1', 'user-2')).rejects.toThrow(
        PermissionError
      );
    });
  });
});
