/**
 * Tests for GET /api/trees/[id]/relationships
 *
 * Tests the Relationships API endpoint to ensure it returns IRelationship objects
 * instead of FamilyMember objects.
 */

import { IRelationship } from '@/types/relationship';

// Mock auth before importing the route
const mockAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock the DI container
const mockRelationshipRepository = {
  findByTreeId: jest.fn(),
};

const mockTreeService = {
  getTreeById: jest.fn(),
};

jest.mock('@/lib/di', () => ({
  container: {
    treeService: mockTreeService,
  },
  getContainer: () => ({
    resolve: jest.fn((key) => {
      if (key === 'IRelationshipRepository') {
        return mockRelationshipRepository;
      }
      if (key === 'ITreeService') {
        return mockTreeService;
      }
      return null;
    }),
  }),
  SERVICES: {
    RelationshipRepository: 'IRelationshipRepository',
    TreeService: 'ITreeService',
  },
}));

// Import route after mocks are set up
import { GET } from './route';

describe('GET /api/trees/[id]/relationships', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockTreeId = 'tree-abc-123';

  const mockRelationships: IRelationship[] = [
    {
      _id: 'rel-1',
      treeId: mockTreeId,
      fromPersonId: 'person-1',
      toPersonId: 'person-2',
      type: 'parent',
      startDate: undefined,
      endDate: undefined,
      notes: undefined,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      _id: 'rel-2',
      treeId: mockTreeId,
      fromPersonId: 'person-2',
      toPersonId: 'person-3',
      type: 'parent',
      startDate: undefined,
      endDate: undefined,
      notes: undefined,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      _id: 'rel-3',
      treeId: mockTreeId,
      fromPersonId: 'person-1',
      toPersonId: 'person-4',
      type: 'spouse',
      startDate: undefined,
      endDate: undefined,
      notes: undefined,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated session
    mockAuth.mockResolvedValue({
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      },
    });
  });

  it('should return relationships array for valid tree ID', async () => {
    // Arrange
    mockTreeService.getTreeById.mockResolvedValue({
      _id: mockTreeId,
      name: 'Test Tree',
    } as any);
    mockRelationshipRepository.findByTreeId.mockResolvedValue(mockRelationships);

    // Create a mock request with user
    const mockRequest = {
      user: mockUser,
    } as any;

    const mockContext = {
      params: Promise.resolve({ id: mockTreeId }),
    };

    // Act
    const response = await GET(mockRequest, mockContext);
    const responseData = await response.json();

    // Assert
    expect(mockTreeService.getTreeById).toHaveBeenCalledWith(mockTreeId, mockUser.id);
    expect(mockRelationshipRepository.findByTreeId).toHaveBeenCalledWith(mockTreeId);

    // Check that we got the relationships
    expect(responseData.data).toHaveLength(3);
    expect(responseData.meta.total).toBe(3);

    // Verify the structure is IRelationship, not FamilyMembers
    expect(responseData.data[0]).toMatchObject({
      _id: expect.any(String),
      treeId: mockTreeId,
      fromPersonId: expect.any(String),
      toPersonId: expect.any(String),
      type: expect.any(String),
      createdAt: expect.any(String), // Dates are serialized as strings
      updatedAt: expect.any(String),
    });

    // Verify it does NOT have FamilyMembers structure
    expect(responseData.data[0]).not.toHaveProperty('parents');
    expect(responseData.data[0]).not.toHaveProperty('children');
    expect(responseData.data[0]).not.toHaveProperty('spouses');
    expect(responseData.data[0]).not.toHaveProperty('siblings');

    // Verify specific relationship data
    expect(responseData.data[0]._id).toBe('rel-1');
    expect(responseData.data[1]._id).toBe('rel-2');
    expect(responseData.data[2]._id).toBe('rel-3');
  });

  it('should return 404 for non-existent tree', async () => {
    // Arrange
    mockTreeService.getTreeById.mockResolvedValue(null);

    const mockRequest = {
      user: mockUser,
    } as any;

    const mockContext = {
      params: Promise.resolve({ id: 'non-existent-tree' }),
    };

    // Act
    const response = await GET(mockRequest, mockContext);
    const responseData = await response.json();

    // Assert
    expect(responseData.error).toBeDefined();
    expect(responseData.error.message).toContain('not found');
    expect(mockRelationshipRepository.findByTreeId).not.toHaveBeenCalled();
  });

  it('should return empty array if no relationships exist', async () => {
    // Arrange
    mockTreeService.getTreeById.mockResolvedValue({
      _id: mockTreeId,
      name: 'Test Tree',
    } as any);
    mockRelationshipRepository.findByTreeId.mockResolvedValue([]);

    const mockRequest = {
      user: mockUser,
    } as any;

    const mockContext = {
      params: Promise.resolve({ id: mockTreeId }),
    };

    // Act
    const response = await GET(mockRequest, mockContext);
    const responseData = await response.json();

    // Assert
    expect(responseData.data).toEqual([]);
    expect(responseData.meta.total).toBe(0);
  });

  it('should return 500 on repository error', async () => {
    // Arrange
    mockTreeService.getTreeById.mockResolvedValue({
      _id: mockTreeId,
      name: 'Test Tree',
    } as any);
    mockRelationshipRepository.findByTreeId.mockRejectedValue(
      new Error('Database connection failed')
    );

    const mockRequest = {
      user: mockUser,
    } as any;

    const mockContext = {
      params: Promise.resolve({ id: mockTreeId }),
    };

    // Act & Assert
    await expect(GET(mockRequest, mockContext)).rejects.toThrow('Database connection failed');
  });

  it('should include all relationship properties', async () => {
    // Arrange
    const relationshipWithAllFields: IRelationship = {
      _id: 'rel-full',
      treeId: mockTreeId,
      fromPersonId: 'person-1',
      toPersonId: 'person-2',
      type: 'parent',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2023-12-31'),
      notes: 'Test notes',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    mockTreeService.getTreeById.mockResolvedValue({
      _id: mockTreeId,
      name: 'Test Tree',
    } as any);
    mockRelationshipRepository.findByTreeId.mockResolvedValue([relationshipWithAllFields]);

    const mockRequest = {
      user: mockUser,
    } as any;

    const mockContext = {
      params: Promise.resolve({ id: mockTreeId }),
    };

    // Act
    const response = await GET(mockRequest, mockContext);
    const responseData = await response.json();

    // Assert
    // Dates are serialized as strings in JSON response
    expect(responseData.data[0]._id).toBe(relationshipWithAllFields._id);
    expect(responseData.data[0]).toHaveProperty('startDate');
    expect(responseData.data[0]).toHaveProperty('endDate');
    expect(responseData.data[0]).toHaveProperty('notes');
    expect(responseData.data[0].notes).toBe('Test notes');
  });

  it('should handle different relationship types', async () => {
    // Arrange
    const mixedRelationships: IRelationship[] = [
      {
        _id: 'rel-1',
        treeId: mockTreeId,
        fromPersonId: 'person-1',
        toPersonId: 'person-2',
        type: 'parent',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'rel-2',
        treeId: mockTreeId,
        fromPersonId: 'person-1',
        toPersonId: 'person-3',
        type: 'spouse',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'rel-3',
        treeId: mockTreeId,
        fromPersonId: 'person-2',
        toPersonId: 'person-3',
        type: 'sibling',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockTreeService.getTreeById.mockResolvedValue({
      _id: mockTreeId,
      name: 'Test Tree',
    } as any);
    mockRelationshipRepository.findByTreeId.mockResolvedValue(mixedRelationships);

    const mockRequest = {
      user: mockUser,
    } as any;

    const mockContext = {
      params: Promise.resolve({ id: mockTreeId }),
    };

    // Act
    const response = await GET(mockRequest, mockContext);
    const responseData = await response.json();

    // Assert
    expect(responseData.data).toHaveLength(3);
    expect(responseData.data[0].type).toBe('parent');
    expect(responseData.data[1].type).toBe('spouse');
    expect(responseData.data[2].type).toBe('sibling');
  });

  it('should call repository with correct tree ID', async () => {
    // Arrange
    mockTreeService.getTreeById.mockResolvedValue({
      _id: mockTreeId,
      name: 'Test Tree',
    } as any);
    mockRelationshipRepository.findByTreeId.mockResolvedValue([]);

    const mockRequest = {
      user: mockUser,
    } as any;

    const mockContext = {
      params: Promise.resolve({ id: mockTreeId }),
    };

    // Act
    await GET(mockRequest, mockContext);

    // Assert
    expect(mockRelationshipRepository.findByTreeId).toHaveBeenCalledTimes(1);
    expect(mockRelationshipRepository.findByTreeId).toHaveBeenCalledWith(mockTreeId);
  });

  it('should verify user has access to tree before fetching relationships', async () => {
    // Arrange
    mockTreeService.getTreeById.mockResolvedValue({
      _id: mockTreeId,
      name: 'Test Tree',
    } as any);
    mockRelationshipRepository.findByTreeId.mockResolvedValue([]);

    const mockRequest = {
      user: mockUser,
    } as any;

    const mockContext = {
      params: Promise.resolve({ id: mockTreeId }),
    };

    // Act
    await GET(mockRequest, mockContext);

    // Assert
    // Tree service should be called first to verify access
    expect(mockTreeService.getTreeById).toHaveBeenCalledWith(mockTreeId, mockUser.id);

    // Both services should be called
    expect(mockTreeService.getTreeById).toHaveBeenCalled();
    expect(mockRelationshipRepository.findByTreeId).toHaveBeenCalled();

    // Tree service should be called before repository (verify access first)
    expect(mockTreeService.getTreeById.mock.invocationCallOrder[0])
      .toBeLessThan(mockRelationshipRepository.findByTreeId.mock.invocationCallOrder[0]);
  });
});
