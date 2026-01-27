import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TreeRepository } from '@/repositories/mongodb/TreeRepository';
import { FamilyTreeModel, IFamilyTreeDocument } from '@/models/FamilyTree';
import { ITree, CreateTreeData, UpdateTreeData, ICollaborator } from '@/types/tree';
import { TreeQueryOptions } from '@/repositories/interfaces/ITreeRepository';
import mongoose from 'mongoose';

// Mock the FamilyTreeModel
jest.mock('@/models/FamilyTree', () => {
  const actual = jest.requireActual('@/models/FamilyTree');
  return {
    ...actual,
    FamilyTreeModel: {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      lean: jest.fn(),
    },
  };
});

const mockFamilyTreeModel = FamilyTreeModel as unknown as {
  findById: jest.MockedFunction<any>;
  find: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  findByIdAndUpdate: jest.MockedFunction<any>;
  findOneAndUpdate: jest.MockedFunction<any>;
  findByIdAndDelete: jest.MockedFunction<any>;
  countDocuments: jest.MockedFunction<any>;
};

describe('TreeRepository', () => {
  let repository: TreeRepository;

  // Helper to create a mock tree document
  const createMockTreeDoc = (overrides: Partial<IFamilyTreeDocument> = {}): IFamilyTreeDocument => {
    const _id = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId();
    return {
      _id,
      ownerId,
      name: 'My Family Tree',
      rootPersonId: undefined,
      collaborators: [],
      settings: {
        isPublic: false,
        allowComments: true,
        defaultPhotoQuality: 'medium',
        language: 'en',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as IFamilyTreeDocument;
  };

  // Helper to create a mock collaborator document
  const createMockCollaboratorDoc = (userId: mongoose.Types.ObjectId): ICollaborator => ({
    userId: userId.toString(),
    permission: 'viewer',
    addedAt: new Date(),
  });

  beforeEach(() => {
    repository = new TreeRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return tree when found', async () => {
      const mockTree = createMockTreeDoc({ name: 'Smith Family' });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById(mockTree._id.toString());

      expect(result).not.toBeNull();
      expect(result?._id).toBe(mockTree._id.toString());
      expect(result?.name).toBe('Smith Family');
    });

    it('should return null when tree not found', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });

    it('should return null for invalid ObjectId', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(
          Object.assign(new Error('Cast to ObjectId failed'), { name: 'CastError' })
        ),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });

    it('should convert collaborators userId to string', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockTree = createMockTreeDoc({
        collaborators: [
          {
            userId,
            permission: 'editor',
            addedAt: new Date(),
          },
        ],
      });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById(mockTree._id.toString());

      expect(result).not.toBeNull();
      expect(result?.collaborators[0].userId).toBe(userId.toString());
    });
  });

  describe('findByOwnerId', () => {
    it('should return trees owned by user', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const mockTrees = [
        createMockTreeDoc({ ownerId, name: 'Tree 1' }),
        createMockTreeDoc({ ownerId, name: 'Tree 2' }),
      ];

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTrees),
      });

      mockFamilyTreeModel.find.mockReturnValue({ lean: leanMock } as any);

      const results = await repository.findByOwnerId(ownerId.toString());

      expect(mockFamilyTreeModel.find).toHaveBeenCalledWith({ ownerId });
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Tree 1');
    });

    it('should return empty array when user has no trees', async () => {
      const ownerId = new mongoose.Types.ObjectId();

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockFamilyTreeModel.find.mockReturnValue({ lean: leanMock } as any);

      const results = await repository.findByOwnerId(ownerId.toString());

      expect(results).toEqual([]);
    });
  });

  describe('findByCollaboratorId', () => {
    it('should return trees where user is collaborator', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockTrees = [
        createMockTreeDoc({
          collaborators: [{ userId, permission: 'editor', addedAt: new Date() }],
        }),
      ];

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTrees),
      });

      mockFamilyTreeModel.find.mockReturnValue({ lean: leanMock } as any);

      const results = await repository.findByCollaboratorId(userId.toString());

      expect(mockFamilyTreeModel.find).toHaveBeenCalledWith({
        'collaborators.userId': userId,
      });
      expect(results).toHaveLength(1);
    });

    it('should return empty array when user is not a collaborator', async () => {
      const userId = new mongoose.Types.ObjectId();

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockFamilyTreeModel.find.mockReturnValue({ lean: leanMock } as any);

      const results = await repository.findByCollaboratorId(userId.toString());

      expect(results).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create and return a new tree', async () => {
      const createData: CreateTreeData = {
        ownerId: new mongoose.Types.ObjectId().toString(),
        name: 'My Family Tree',
      };

      const mockTree = createMockTreeDoc();

      mockFamilyTreeModel.create.mockResolvedValue(mockTree as any);

      const result = await repository.create(createData);

      expect(mockFamilyTreeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: expect.any(mongoose.Types.ObjectId),
          name: 'My Family Tree',
        })
      );
      expect(result.name).toBe('My Family Tree');
    });

    it('should apply default settings', async () => {
      const createData: CreateTreeData = {
        ownerId: new mongoose.Types.ObjectId().toString(),
        name: 'My Tree',
      };

      const mockTree = createMockTreeDoc();

      mockFamilyTreeModel.create.mockResolvedValue(mockTree as any);

      const result = await repository.create(createData);

      expect(result.settings.isPublic).toBe(false);
      expect(result.settings.allowComments).toBe(true);
      expect(result.settings.defaultPhotoQuality).toBe('medium');
    });
  });

  describe('update', () => {
    it('should update and return the tree', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const updateData: UpdateTreeData = {
        name: 'Updated Name',
      };

      const updatedDoc = createMockTreeDoc({
        _id: treeId,
        name: 'Updated Name',
      });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedDoc),
      });

      mockFamilyTreeModel.findByIdAndUpdate.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.update(treeId.toString(), updateData);

      expect(mockFamilyTreeModel.findByIdAndUpdate).toHaveBeenCalledWith(
        treeId.toString(),
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result?.name).toBe('Updated Name');
    });

    it('should throw error when tree not found for update', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockFamilyTreeModel.findByIdAndUpdate.mockReturnValue({ lean: leanMock } as any);

      await expect(
        repository.update('507f1f77bcf86cd799439011', { name: 'New Name' })
      ).rejects.toThrow('Tree with id 507f1f77bcf86cd799439011 not found');
    });
  });

  describe('delete', () => {
    it('should delete the tree', async () => {
      const treeId = new mongoose.Types.ObjectId();

      const execMock = jest.fn().mockResolvedValue({ _id: treeId });
      mockFamilyTreeModel.findByIdAndDelete.mockReturnValue({ exec: execMock } as any);

      await repository.delete(treeId.toString());

      expect(mockFamilyTreeModel.findByIdAndDelete).toHaveBeenCalledWith(treeId.toString());
      expect(execMock).toHaveBeenCalled();
    });

    it('should be idempotent - deleting non-existent tree should not throw', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockFamilyTreeModel.findByIdAndDelete.mockReturnValue({ exec: execMock } as any);

      await expect(
        repository.delete('507f1f77bcf86cd799439011')
      ).resolves.not.toThrow();
    });
  });

  describe('addCollaborator', () => {
    it('should add collaborator to tree', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const collaborator: ICollaborator = {
        userId: userId.toString(),
        permission: 'editor',
        addedAt: new Date(),
      };

      const existingTree = createMockTreeDoc({ _id: treeId, collaborators: [] });
      const updatedTree = createMockTreeDoc({
        _id: treeId,
        collaborators: [
          { userId, permission: 'editor', addedAt: collaborator.addedAt },
        ],
      });

      const findByIdLeanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(existingTree),
      });

      const findOneAndUpdateLeanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(updatedTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: findByIdLeanMock } as any);
      mockFamilyTreeModel.findOneAndUpdate.mockReturnValue({ lean: findOneAndUpdateLeanMock } as any);

      const result = await repository.addCollaborator(treeId.toString(), collaborator);

      expect(result.collaborators).toHaveLength(1);
      expect(result.collaborators[0].userId).toBe(userId.toString());
    });

    it('should throw error when tree not found', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      await expect(
        repository.addCollaborator('507f1f77bcf86cd799439011', {
          userId: 'user-123',
          permission: 'viewer',
          addedAt: new Date(),
        })
      ).rejects.toThrow('Tree with id 507f1f77bcf86cd799439011 not found');
    });
  });

  describe('removeCollaborator', () => {
    it('should remove collaborator from tree', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();

      const existingTree = createMockTreeDoc({
        _id: treeId,
        collaborators: [
          { userId, permission: 'editor', addedAt: new Date() },
          { userId: otherUserId, permission: 'viewer', addedAt: new Date() },
        ],
      });

      const updatedTree = createMockTreeDoc({
        _id: treeId,
        collaborators: [
          { userId: otherUserId, permission: 'viewer', addedAt: new Date() },
        ],
      });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(updatedTree),
      });

      mockFamilyTreeModel.findOneAndUpdate.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.removeCollaborator(treeId.toString(), userId.toString());

      expect(result.collaborators).toHaveLength(1);
      expect(result.collaborators[0].userId).toBe(otherUserId.toString());
    });
  });

  describe('updateCollaboratorRole', () => {
    it('should update collaborator permission', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const addedAt = new Date();

      const existingTree = createMockTreeDoc({
        _id: treeId,
        collaborators: [
          { userId, permission: 'viewer', addedAt },
        ],
      });

      const updatedTree = createMockTreeDoc({
        _id: treeId,
        collaborators: [
          { userId, permission: 'admin', addedAt },
        ],
      });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(updatedTree),
      });

      mockFamilyTreeModel.findOneAndUpdate.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.updateCollaboratorRole(
        treeId.toString(),
        userId.toString(),
        'admin'
      );

      expect(result.collaborators[0].permission).toBe('admin');
    });
  });

  describe('getCollaborators', () => {
    it('should return tree collaborators', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();

      const mockTree = createMockTreeDoc({
        _id: treeId,
        collaborators: [
          { userId: userId1, permission: 'editor', addedAt: new Date() },
          { userId: userId2, permission: 'viewer', addedAt: new Date() },
        ],
      });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.getCollaborators(treeId.toString());

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId1.toString());
      expect(result[1].userId).toBe(userId2.toString());
    });

    it('should return empty array when tree has no collaborators', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const mockTree = createMockTreeDoc({ _id: treeId, collaborators: [] });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.getCollaborators(treeId.toString());

      expect(result).toEqual([]);
    });
  });

  describe('countByOwnerId', () => {
    it('should return count of trees owned by user', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(5);
      mockFamilyTreeModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const count = await repository.countByOwnerId(ownerId.toString());

      expect(mockFamilyTreeModel.countDocuments).toHaveBeenCalledWith({
        ownerId: expect.any(mongoose.Types.ObjectId),
      });
      expect(count).toBe(5);
    });
  });

  describe('exists', () => {
    it('should return true when tree exists', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(1);
      mockFamilyTreeModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const exists = await repository.exists(treeId.toString());

      expect(exists).toBe(true);
    });

    it('should return false when tree does not exist', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(0);
      mockFamilyTreeModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const exists = await repository.exists(treeId.toString());

      expect(exists).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true when user is owner', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const ownerId = new mongoose.Types.ObjectId();

      const mockTree = createMockTreeDoc({ _id: treeId, ownerId });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const isOwner = await repository.isOwner(treeId.toString(), ownerId.toString());

      expect(isOwner).toBe(true);
    });

    it('should return false when user is not owner', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const ownerId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();

      const mockTree = createMockTreeDoc({ _id: treeId, ownerId });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const isOwner = await repository.isOwner(treeId.toString(), otherUserId.toString());

      expect(isOwner).toBe(false);
    });

    it('should return false when tree not found', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const isOwner = await repository.isOwner('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');

      expect(isOwner).toBe(false);
    });
  });

  describe('hasAccess', () => {
    it('should return true when user is owner', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const ownerId = new mongoose.Types.ObjectId();

      const mockTree = createMockTreeDoc({ _id: treeId, ownerId });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const hasAccess = await repository.hasAccess(treeId.toString(), ownerId.toString());

      expect(hasAccess).toBe(true);
    });

    it('should return true when user is collaborator', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const ownerId = new mongoose.Types.ObjectId();
      const collaboratorId = new mongoose.Types.ObjectId();

      const mockTree = createMockTreeDoc({
        _id: treeId,
        ownerId,
        collaborators: [
          { userId: collaboratorId, permission: 'editor', addedAt: new Date() },
        ],
      });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const hasAccess = await repository.hasAccess(treeId.toString(), collaboratorId.toString());

      expect(hasAccess).toBe(true);
    });

    it('should return false when user has no access', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const ownerId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();

      const mockTree = createMockTreeDoc({ _id: treeId, ownerId, collaborators: [] });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTree),
      });

      mockFamilyTreeModel.findById.mockReturnValue({ lean: leanMock } as any);

      const hasAccess = await repository.hasAccess(treeId.toString(), otherUserId.toString());

      expect(hasAccess).toBe(false);
    });
  });
});
