import { TreeService } from './TreeService';
import { ITreeService, TreeStats, TreeExportData } from './ITreeService';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { IMediaRepository } from '@/repositories/interfaces/IMediaRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { CreateTreeDto, UpdateTreeDto } from '@/types/dtos/tree';
import { ITree } from '@/types/tree';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';
import { ValidationError, PermissionError, NotFoundError, BusinessRuleError } from '@/services/errors/ServiceErrors';

describe('TreeService', () => {
  let service: TreeService;
  let mockTreeRepo: jest.Mocked<ITreeRepository>;
  let mockPersonRepo: jest.Mocked<IPersonRepository>;
  let mockRelationshipRepo: jest.Mocked<IRelationshipRepository>;
  let mockMediaRepo: jest.Mocked<IMediaRepository>;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let mockAuditRepo: jest.Mocked<IAuditRepository>;

  const mockTree: ITree = {
    _id: 'tree-1',
    ownerId: 'user-1',
    name: 'Test Family Tree',
    rootPersonId: 'person-1',
    settings: {
      isPublic: false,
      allowComments: false,
      defaultPhotoQuality: 'medium',
      language: 'en',
    },
    collaborators: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    mockTreeRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByOwnerId: jest.fn(),
      findByCollaboratorId: jest.fn(),
      isOwner: jest.fn(),
    } as unknown as jest.Mocked<ITreeRepository>;

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

    mockRelationshipRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByTreeId: jest.fn(),
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      findByPersonId: jest.fn(),
      findBetweenPersons: jest.fn(),
      findParents: jest.fn(),
      findChildren: jest.fn(),
      findSpouses: jest.fn(),
      findSiblings: jest.fn(),
    } as unknown as jest.Mocked<IRelationshipRepository>;

    mockMediaRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByTreeId: jest.fn(),
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      findByPersonId: jest.fn(),
    } as unknown as jest.Mocked<IMediaRepository>;

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

    service = new TreeService(
      mockTreeRepo,
      mockPersonRepo,
      mockRelationshipRepo,
      mockMediaRepo,
      mockPermissionService,
      mockAuditRepo
    );
  });

  describe('createTree', () => {
    const validData: CreateTreeDto = {
      name: 'Test Family Tree',
      rootPersonId: 'person-1',
      settings: {
        isPublic: true,
        language: 'en',
      },
    };

    it('should create a tree with valid data', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockTreeRepo.create.mockResolvedValue(mockTree);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.createTree('user-1', validData);

      expect(result).toEqual(mockTree);
      expect(mockTreeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-1',
          name: 'Test Family Tree',
        })
      );
      expect(mockAuditRepo.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = { name: '' } as CreateTreeDto;

      await expect(service.createTree('user-1', invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when root person does not exist', async () => {
      const dataWithInvalidRoot = { ...validData, rootPersonId: 'nonexistent' };
      mockPersonRepo.findById.mockResolvedValue(null);

      await expect(service.createTree('user-1', dataWithInvalidRoot)).rejects.toThrow(NotFoundError);
    });

    it('should create tree without root person', async () => {
      const dataWithoutRoot = { name: 'Test Tree' } as CreateTreeDto;
      mockTreeRepo.create.mockResolvedValue(mockTree);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.createTree('user-1', dataWithoutRoot);

      expect(result).toEqual(mockTree);
    });
  });

  describe('updateTree', () => {
    const updateData: UpdateTreeDto = {
      name: 'Updated Tree Name',
    };

    it('should update tree when user has permission', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockTreeRepo.update.mockResolvedValue({ ...mockTree, name: 'Updated Tree Name' });
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.updateTree('tree-1', 'user-1', updateData);

      expect(result.name).toBe('Updated Tree Name');
      expect(mockTreeRepo.update).toHaveBeenCalledWith('tree-1', expect.any(Object));
    });

    it('should throw NotFoundError when tree not found', async () => {
      mockTreeRepo.findById.mockResolvedValue(null);

      await expect(service.updateTree('nonexistent', 'user-1', updateData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.updateTree('tree-1', 'user-2', updateData)).rejects.toThrow(
        PermissionError
      );
    });

    it('should update root person when provided', async () => {
      const dataWithRoot = { ...updateData, rootPersonId: 'person-2' };
      mockTreeRepo.findById.mockResolvedValue(mockTree);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findById.mockResolvedValue({ ...mockPerson, _id: 'person-2' });
      mockTreeRepo.update.mockResolvedValue(mockTree);
      mockAuditRepo.create.mockResolvedValue({} as any);

      await service.updateTree('tree-1', 'user-1', dataWithRoot);

      expect(mockTreeRepo.update).toHaveBeenCalled();
    });
  });

  describe('deleteTree', () => {
    it('should delete tree and cascade delete related data', async () => {
      mockTreeRepo.isOwner.mockResolvedValue(true);
      mockTreeRepo.findById.mockResolvedValue(mockTree);
      mockRelationshipRepo.deleteByTreeId.mockResolvedValue(undefined);
      mockPersonRepo.deleteByTreeId.mockResolvedValue(undefined);
      mockMediaRepo.deleteByTreeId.mockResolvedValue(undefined);
      mockTreeRepo.delete.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      await service.deleteTree('tree-1', 'user-1');

      expect(mockRelationshipRepo.deleteByTreeId).toHaveBeenCalledWith('tree-1');
      expect(mockPersonRepo.deleteByTreeId).toHaveBeenCalledWith('tree-1');
      expect(mockMediaRepo.deleteByTreeId).toHaveBeenCalledWith('tree-1');
      expect(mockTreeRepo.delete).toHaveBeenCalledWith('tree-1');
    });

    it('should throw PermissionError when user is not owner', async () => {
      mockTreeRepo.isOwner.mockResolvedValue(false);

      await expect(service.deleteTree('tree-1', 'user-2')).rejects.toThrow(PermissionError);
    });

    it('should throw NotFoundError when tree not found', async () => {
      mockTreeRepo.isOwner.mockResolvedValue(true);
      mockTreeRepo.findById.mockResolvedValue(null);

      await expect(service.deleteTree('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTreeById', () => {
    it('should return tree when user has permission', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);
      mockPermissionService.canAccess.mockResolvedValue(true);

      const result = await service.getTreeById('tree-1', 'user-1');

      expect(result).toEqual(mockTree);
    });

    it('should return null when tree not found', async () => {
      mockTreeRepo.findById.mockResolvedValue(null);

      const result = await service.getTreeById('nonexistent', 'user-1');

      expect(result).toBeNull();
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockTreeRepo.findById.mockResolvedValue(mockTree);
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.getTreeById('tree-1', 'user-2')).rejects.toThrow(PermissionError);
    });
  });

  describe('getTreesByUserId', () => {
    it('should return all trees for user', async () => {
      const trees = [mockTree, { ...mockTree, _id: 'tree-2', name: 'Second Tree' }];
      mockTreeRepo.findByOwnerId.mockResolvedValue(trees);

      const result = await service.getTreesByUserId('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].ownerId).toBe('user-1');
    });
  });

  describe('getSharedTrees', () => {
    it('should return trees shared with user', async () => {
      const sharedTrees = [{ ...mockTree, _id: 'tree-2', name: 'Shared Tree' }];
      mockTreeRepo.findByCollaboratorId.mockResolvedValue(sharedTrees);

      const result = await service.getSharedTrees('user-2');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Shared Tree');
    });
  });

  describe('getTreeStats', () => {
    it('should return tree statistics', async () => {
      const persons = [mockPerson, { ...mockPerson, _id: 'person-2' }];
      const relationships = [mockRelationship];
      const media = [];

      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findByTreeId.mockResolvedValue(persons);
      mockRelationshipRepo.findByTreeId.mockResolvedValue(relationships);
      mockMediaRepo.findByTreeId.mockResolvedValue(media);

      const result = await service.getTreeStats('tree-1', 'user-1');

      expect(result.memberCount).toBe(2);
      expect(result.relationshipCount).toBe(1);
      expect(result.mediaCount).toBe(0);
      expect(result.generations).toBeGreaterThan(0);
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.getTreeStats('tree-1', 'user-2')).rejects.toThrow(PermissionError);
    });
  });

  describe('exportTree', () => {
    it('should export tree data', async () => {
      const persons = [mockPerson];
      const relationships = [mockRelationship];

      mockPermissionService.canAccess.mockResolvedValue(true);
      mockTreeRepo.findById.mockResolvedValue(mockTree);
      mockPersonRepo.findByTreeId.mockResolvedValue(persons);
      mockRelationshipRepo.findByTreeId.mockResolvedValue(relationships);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.exportTree('tree-1', 'user-1', 'json');

      expect(result.tree).toEqual(mockTree);
      expect(result.persons).toEqual(persons);
      expect(result.relationships).toEqual(relationships);
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.exportTree('tree-1', 'user-2', 'json')).rejects.toThrow(
        PermissionError
      );
    });
  });

  describe('importTree', () => {
    const importData: TreeExportData = {
      tree: mockTree,
      persons: [mockPerson],
      relationships: [mockRelationship],
    };

    it('should import tree data', async () => {
      const newTree = { ...mockTree, _id: 'new-tree-1' };
      const newPerson = { ...mockPerson, _id: 'new-person-1', treeId: 'new-tree-1' };

      mockTreeRepo.create.mockResolvedValue(newTree);
      mockPersonRepo.create.mockResolvedValue(newPerson);
      mockRelationshipRepo.create.mockResolvedValue(mockRelationship);
      mockAuditRepo.create.mockResolvedValue({} as any);

      const result = await service.importTree('user-1', importData);

      expect(result).toEqual(newTree);
      expect(mockTreeRepo.create).toHaveBeenCalled();
      expect(mockPersonRepo.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid import data', async () => {
      const invalidData = {} as TreeExportData;

      await expect(service.importTree('user-1', invalidData)).rejects.toThrow(ValidationError);
    });
  });

  describe('getTreeVisualizationData', () => {
    it('should return visualization data', async () => {
      const persons = [mockPerson];
      const relationships = [mockRelationship];

      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.findByTreeId.mockResolvedValue(persons);
      mockRelationshipRepo.findByTreeId.mockResolvedValue(relationships);

      const result = await service.getTreeVisualizationData('tree-1', 'user-1', 'ancestral');

      expect(result).toEqual({
        viewType: 'ancestral',
        persons,
        relationships,
      });
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(
        service.getTreeVisualizationData('tree-1', 'user-2', 'ancestral')
      ).rejects.toThrow(PermissionError);
    });
  });
});
