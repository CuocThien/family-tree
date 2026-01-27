import { describe, it, expect, beforeEach } from '@jest/globals';
import { AttributeBasedPermissionStrategy } from '@/strategies/permission/AttributeBasedPermissionStrategy';
import { Permission, PermissionContext } from '@/strategies/permission/IPermissionStrategy';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { ITree } from '@/types/tree';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

// Mock repositories
const mockTreeRepository = {
  findById: jest.fn(),
} as unknown as ITreeRepository;

const mockPersonRepository = {
  findById: jest.fn(),
} as unknown as IPersonRepository;

const mockRelationshipRepository = {
  findByPersonId: jest.fn(),
} as unknown as IRelationshipRepository;

describe('AttributeBasedPermissionStrategy', () => {
  let strategy: AttributeBasedPermissionStrategy;

  const mockTree: ITree = {
    _id: 'tree1',
    ownerId: 'owner1',
    name: 'Test Tree',
    collaborators: [
      { userId: 'admin1', permission: 'admin', addedAt: new Date() },
      { userId: 'viewer1', permission: 'viewer', addedAt: new Date() },
    ],
    settings: { isPublic: false, allowComments: true, defaultPhotoQuality: 'medium', language: 'en' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const livingPerson: IPerson = {
    _id: 'person1',
    treeId: 'tree1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    dateOfDeath: undefined, // Living
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const deceasedPerson: IPerson = {
    _id: 'person2',
    treeId: 'tree1',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: new Date('1950-01-01'),
    dateOfDeath: new Date('2020-01-01'), // Deceased
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new AttributeBasedPermissionStrategy(
      mockPersonRepository,
      mockRelationshipRepository,
      mockTreeRepository
    );
  });

  describe('canAccess - EDIT_PERSON restrictions', () => {
    it('should allow owner to edit deceased person', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(deceasedPerson);

      const context: PermissionContext = {
        userId: 'owner1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person2',
      };

      const result = await strategy.canAccess(Permission.EDIT_PERSON, context);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('No attribute-based restrictions');
    });

    it('should allow admin to edit deceased person', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(deceasedPerson);

      const context: PermissionContext = {
        userId: 'admin1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person2',
      };

      const result = await strategy.canAccess(Permission.EDIT_PERSON, context);
      expect(result.allowed).toBe(true);
    });

    it('should deny viewer from editing deceased person', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(deceasedPerson);

      const context: PermissionContext = {
        userId: 'viewer1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person2',
      };

      const result = await strategy.canAccess(Permission.EDIT_PERSON, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot edit deceased persons');
    });

    it('should allow editing living person regardless of role', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(livingPerson);

      const context: PermissionContext = {
        userId: 'viewer1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person1',
      };

      const result = await strategy.canAccess(Permission.EDIT_PERSON, context);
      expect(result.allowed).toBe(true);
    });
  });

  describe('canAccess - DELETE_PERSON restrictions', () => {
    it('should deny deleting person with relationships', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(livingPerson);
      (mockRelationshipRepository.findByPersonId as jest.Mock).mockResolvedValue([
        { _id: 'rel1' } as IRelationship,
        { _id: 'rel2' } as IRelationship,
      ]);

      const context: PermissionContext = {
        userId: 'owner1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person1',
      };

      const result = await strategy.canAccess(Permission.DELETE_PERSON, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot delete persons with existing relationships');
    });

    it('should allow deleting person with no relationships', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(livingPerson);
      (mockRelationshipRepository.findByPersonId as jest.Mock).mockResolvedValue([]);

      const context: PermissionContext = {
        userId: 'owner1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person1',
      };

      const result = await strategy.canAccess(Permission.DELETE_PERSON, context);
      expect(result.allowed).toBe(true);
    });
  });

  describe('canAccess - VIEW_PERSON restrictions', () => {
    it('should deny viewing living person in public tree for non-collaborators', async () => {
      const publicTree = { ...mockTree, settings: { ...mockTree.settings, isPublic: true } };
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(publicTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(livingPerson);

      const context: PermissionContext = {
        userId: 'stranger1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person1',
      };

      const result = await strategy.canAccess(Permission.VIEW_PERSON, context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot view living person details in public trees');
    });

    it('should allow collaborator to view living person in public tree', async () => {
      const publicTree = { ...mockTree, settings: { ...mockTree.settings, isPublic: true } };
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(publicTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(livingPerson);

      const context: PermissionContext = {
        userId: 'viewer1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person1',
      };

      const result = await strategy.canAccess(Permission.VIEW_PERSON, context);
      expect(result.allowed).toBe(true);
    });

    it('should allow viewing deceased person in public tree', async () => {
      const publicTree = { ...mockTree, settings: { ...mockTree.settings, isPublic: true } };
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(publicTree);
      (mockPersonRepository.findById as jest.Mock).mockResolvedValue(deceasedPerson);

      const context: PermissionContext = {
        userId: 'stranger1',
        treeId: 'tree1',
        resourceType: 'person',
        resourceId: 'person2',
      };

      const result = await strategy.canAccess(Permission.VIEW_PERSON, context);
      expect(result.allowed).toBe(true);
    });
  });

  describe('canAccess - other permissions', () => {
    it('should return neutral result for permissions without rules', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = {
        userId: 'owner1',
        treeId: 'tree1',
      };

      const result = await strategy.canAccess(Permission.VIEW_TREE, context);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('No attribute-based restrictions');
    });
  });

  describe('getPermissions', () => {
    it('should return empty array (ABAC does not enumerate permissions)', async () => {
      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = {
        userId: 'owner1',
        treeId: 'tree1',
      };

      const permissions = await strategy.getPermissions(context);
      expect(permissions).toEqual([]);
    });
  });

  describe('addRule', () => {
    it('should allow adding custom rules', async () => {
      const customRule = {
        permission: Permission.UPLOAD_MEDIA,
        condition: jest.fn().mockReturnValue(true),
        description: 'Custom rule for media upload',
      };

      strategy.addRule(customRule);

      (mockTreeRepository.findById as jest.Mock).mockResolvedValue(mockTree);

      const context: PermissionContext = {
        userId: 'owner1',
        treeId: 'tree1',
      };

      const result = await strategy.canAccess(Permission.UPLOAD_MEDIA, context);

      // Verify the custom rule's condition was called
      expect(customRule.condition).toHaveBeenCalled();
    });
  });
});
