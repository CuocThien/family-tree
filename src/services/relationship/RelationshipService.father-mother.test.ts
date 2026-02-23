/**
 * Tests for father and mother relationship types
 * This file tests the fix for the enum validation issue
 */

import { RelationshipService } from './RelationshipService';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { CreateRelationshipDto } from '@/types/dtos/relationship';
import { IRelationship } from '@/types/relationship';
import { IPerson } from '@/types/person';

describe('RelationshipService - Father/Mother Types', () => {
  let service: RelationshipService;
  let mockRelationshipRepo: jest.Mocked<IRelationshipRepository>;
  let mockPersonRepo: jest.Mocked<IPersonRepository>;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let mockAuditRepo: jest.Mocked<IAuditRepository>;

  const mockFather: IPerson = {
    _id: 'father-1',
    treeId: 'tree-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1960-01-01'),
    gender: 'male',
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMother: IPerson = {
    _id: 'mother-1',
    treeId: 'tree-1',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: new Date('1965-01-01'),
    gender: 'female',
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChild: IPerson = {
    _id: 'child-1',
    treeId: 'tree-1',
    firstName: 'Jimmy',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFatherRelationship: IRelationship = {
    _id: 'rel-father',
    treeId: 'tree-1',
    fromPersonId: 'father-1',
    toPersonId: 'child-1',
    type: 'father',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMotherRelationship: IRelationship = {
    _id: 'rel-mother',
    treeId: 'tree-1',
    fromPersonId: 'mother-1',
    toPersonId: 'child-1',
    type: 'mother',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRelationshipRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      findByPersonId: jest.fn(),
      findBetweenPersons: jest.fn(),
      findParents: jest.fn(),
      findChildren: jest.fn(),
      findSpouses: jest.fn(),
      findSiblings: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockPersonRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockPermissionService = {
      canAccess: jest.fn(),
      getUserRole: jest.fn(),
    } as any;

    mockAuditRepo = {
      create: jest.fn(),
      findByTreeId: jest.fn(),
      findByEntity: jest.fn(),
    } as any;

    service = new RelationshipService(
      mockRelationshipRepo,
      mockPersonRepo,
      mockPermissionService,
      mockAuditRepo
    );
  });

  describe('createRelationship with father type', () => {
    it('should create relationship with type=father for male parent', async () => {
      const data: CreateRelationshipDto = {
        fromPersonId: 'father-1',
        toPersonId: 'child-1',
        type: 'father',
        treeId: 'tree-1',
      };

      mockPermissionService.canAccess.mockResolvedValue(true);
      // Use a function to return the appropriate person based on ID
      mockPersonRepo.findById.mockImplementation(async (id: string) => {
        if (id === 'father-1') return mockFather;
        if (id === 'child-1') return mockChild;
        return null;
      });
      mockRelationshipRepo.findBetweenPersons.mockResolvedValue(null);
      mockRelationshipRepo.findParents.mockResolvedValue([]);
      mockRelationshipRepo.findByPersonId.mockResolvedValue([]);
      mockRelationshipRepo.create.mockResolvedValue(mockFatherRelationship);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.createRelationship('tree-1', 'user-1', data);

      expect(result).toEqual(mockFatherRelationship);
      expect(mockRelationshipRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'father',
          fromPersonId: 'father-1',
          toPersonId: 'child-1',
        })
      );
    });

    it('should automatically set father type when parent type is used with male gender', async () => {
      const data: CreateRelationshipDto = {
        fromPersonId: 'father-1',
        toPersonId: 'child-1',
        type: 'parent',
        treeId: 'tree-1',
      };

      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findById.mockImplementation(async (id: string) => {
        if (id === 'father-1') return mockFather;
        if (id === 'child-1') return mockChild;
        return null;
      });
      mockRelationshipRepo.findBetweenPersons.mockResolvedValue(null);
      mockRelationshipRepo.findParents.mockResolvedValue([]);
      mockRelationshipRepo.findByPersonId.mockResolvedValue([]);
      mockRelationshipRepo.create.mockResolvedValue(mockFatherRelationship);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.createRelationship('tree-1', 'user-1', data);

      expect(result).toEqual(mockFatherRelationship);
      expect(mockRelationshipRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'father',
        })
      );
    });
  });

  describe('createRelationship with mother type', () => {
    it('should create relationship with type=mother for female parent', async () => {
      const data: CreateRelationshipDto = {
        fromPersonId: 'mother-1',
        toPersonId: 'child-1',
        type: 'mother',
        treeId: 'tree-1',
      };

      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findById.mockImplementation(async (id: string) => {
        if (id === 'mother-1') return mockMother;
        if (id === 'child-1') return mockChild;
        return null;
      });
      mockRelationshipRepo.findBetweenPersons.mockResolvedValue(null);
      mockRelationshipRepo.findParents.mockResolvedValue([]);
      mockRelationshipRepo.findByPersonId.mockResolvedValue([]);
      mockRelationshipRepo.create.mockResolvedValue(mockMotherRelationship);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.createRelationship('tree-1', 'user-1', data);

      expect(result).toEqual(mockMotherRelationship);
      expect(mockRelationshipRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mother',
          fromPersonId: 'mother-1',
          toPersonId: 'child-1',
        })
      );
    });

    it('should automatically set mother type when parent type is used with female gender', async () => {
      const data: CreateRelationshipDto = {
        fromPersonId: 'mother-1',
        toPersonId: 'child-1',
        type: 'parent',
        treeId: 'tree-1',
      };

      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findById.mockImplementation(async (id: string) => {
        if (id === 'mother-1') return mockMother;
        if (id === 'child-1') return mockChild;
        return null;
      });
      mockRelationshipRepo.findBetweenPersons.mockResolvedValue(null);
      mockRelationshipRepo.findParents.mockResolvedValue([]);
      mockRelationshipRepo.findByPersonId.mockResolvedValue([]);
      mockRelationshipRepo.create.mockResolvedValue(mockMotherRelationship);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.createRelationship('tree-1', 'user-1', data);

      expect(result).toEqual(mockMotherRelationship);
      expect(mockRelationshipRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mother',
        })
      );
    });
  });

  describe('backward compatibility', () => {
    it('should still support generic parent type for unknown gender', async () => {
      const unknownGenderParent: IPerson = {
        ...mockFather,
        _id: 'parent-unknown',
        gender: 'other',
      };

      const data: CreateRelationshipDto = {
        fromPersonId: 'parent-unknown',
        toPersonId: 'child-1',
        type: 'parent',
        treeId: 'tree-1',
      };

      const mockGenericRelationship: IRelationship = {
        _id: 'rel-parent',
        treeId: 'tree-1',
        fromPersonId: 'parent-unknown',
        toPersonId: 'child-1',
        type: 'parent',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findById.mockImplementation(async (id: string) => {
        if (id === 'parent-unknown') return unknownGenderParent;
        if (id === 'child-1') return mockChild;
        return null;
      });
      mockRelationshipRepo.findBetweenPersons.mockResolvedValue(null);
      mockRelationshipRepo.findParents.mockResolvedValue([]);
      mockRelationshipRepo.findByPersonId.mockResolvedValue([]);
      mockRelationshipRepo.create.mockResolvedValue(mockGenericRelationship);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.createRelationship('tree-1', 'user-1', data);

      expect(result.type).toBe('parent');
      expect(mockRelationshipRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'parent',
        })
      );
    });
  });
});
