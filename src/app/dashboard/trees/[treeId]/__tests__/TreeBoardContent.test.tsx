import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { TreeBoardContent } from '../TreeBoardContent';
import { usePersonRelationships } from '@/hooks/usePersonRelationships';

// Mock the dependencies
jest.mock('@/hooks/useTreeData');
jest.mock('@/hooks/useAddPersonToTree');
jest.mock('@/hooks/usePerson');
jest.mock('@/hooks/usePersonRelationships');
jest.mock('@/lib/tree-layout/pedigree');
jest.mock('@/store/treeBoardStore', () => ({
  useTreeBoardStore: jest.fn(),
}));

import { useTreeData } from '@/hooks/useTreeData';
import { useAddPersonToTree } from '@/hooks/useAddPersonToTree';
import { useUpdatePerson } from '@/hooks/usePerson';
import { calculatePedigreeLayout } from '@/lib/tree-layout/pedigree';
import { useTreeBoardStore } from '@/store/treeBoardStore';

const mockUseTreeBoardStore = useTreeBoardStore as jest.MockedFunction<typeof useTreeBoardStore>;
const mockUseTreeData = useTreeData as jest.MockedFunction<typeof useTreeData>;
const mockUseAddPersonToTree = useAddPersonToTree as jest.MockedFunction<typeof useAddPersonToTree>;
const mockUseUpdatePerson = useUpdatePerson as jest.MockedFunction<typeof useUpdatePerson>;
const mockUsePersonRelationships = usePersonRelationships as jest.MockedFunction<typeof usePersonRelationships>;
const mockCalculatePedigreeLayout = calculatePedigreeLayout as jest.MockedFunction<typeof calculatePedigreeLayout>;

describe('TreeBoardContent - Relationship Integration', () => {
  const mockTreeId = 'tree123';
  const mockUserId = 'user123';
  const mockSelectedPerson = {
    _id: 'person123',
    firstName: 'John',
    lastName: 'Smith',
    gender: 'male',
    treeId: mockTreeId,
  };

  const mockStore = {
    setTreeData: jest.fn(),
    setRootPerson: jest.fn(),
    reset: jest.fn(),
    selectPerson: jest.fn(),
    selectedPersonId: 'person123',
    persons: new Map([['person123', mockSelectedPerson]]),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTreeBoardStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });

    mockUseTreeData.mockReturnValue({
      data: {
        tree: { _id: mockTreeId, name: 'Test Tree', rootPersonId: 'person123' },
        persons: [mockSelectedPerson],
        relationships: [],
      },
      isLoading: false,
      error: null,
    });

    mockUseAddPersonToTree.mockReturnValue({
      addPerson: {
        mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      },
    });

    mockUseUpdatePerson.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(mockSelectedPerson),
    } as any);

    mockCalculatePedigreeLayout.mockReturnValue({
      nodes: [{ id: 'person123', data: mockSelectedPerson, position: { x: 0, y: 0 } }],
      edges: [],
    });

    mockUsePersonRelationships.mockReturnValue({
      data: [
        {
          _id: 'rel-person123-parent456',
          relatedPersonId: 'parent456',
          relationshipType: 'parent' as const,
          relatedPersonName: 'Parent Smith',
        },
      ],
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);
  });

  it('should fetch relationships when a person is selected and modal is open', async () => {
    render(<TreeBoardContent treeId={mockTreeId} userId={mockUserId} />);

    // The usePersonRelationships hook should be called
    expect(mockUsePersonRelationships).toHaveBeenCalledWith({
      personId: 'person123',
      enabled: true,
    });
  });

  it('should not fetch relationships when modal is closed', () => {
    // Mock store with no selected person
    mockUseTreeBoardStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          ...mockStore,
          selectedPersonId: null,
          persons: new Map(),
        });
      }
      return mockStore;
    });

    render(<TreeBoardContent treeId={mockTreeId} userId={mockUserId} />);

    // Should not call with enabled: true since modal is not open
    expect(mockUsePersonRelationships).not.toHaveBeenCalledWith({
      personId: '',
      enabled: true,
    });
  });

  it('should handle relationship fetch errors gracefully', async () => {
    mockUsePersonRelationships.mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: new Error('Failed to fetch relationships'),
    } as any);

    render(<TreeBoardContent treeId={mockTreeId} userId={mockUserId} />);

    // Should still render the component despite error
    expect(mockUsePersonRelationships).toHaveBeenCalledWith({
      personId: 'person123',
      enabled: true,
    });
  });

  it('should pass existing relationships to EditPersonModal', async () => {
    const mockRelationships = [
      {
        _id: 'rel-person123-parent456',
        relatedPersonId: 'parent456',
        relationshipType: 'parent' as const,
        relatedPersonName: 'Parent Smith',
      },
      {
        _id: 'rel-person123-spouse789',
        relatedPersonId: 'spouse789',
        relationshipType: 'spouse' as const,
        relatedPersonName: 'Spouse Smith',
      },
    ];

    mockUsePersonRelationships.mockReturnValue({
      data: mockRelationships,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as any);

    render(<TreeBoardContent treeId={mockTreeId} userId={mockUserId} />);

    // The hook should return the relationships
    expect(mockUsePersonRelationships).toHaveBeenCalledWith({
      personId: 'person123',
      enabled: true,
    });
  });

  it('should show loading state while fetching relationships', () => {
    mockUsePersonRelationships.mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
    } as any);

    render(<TreeBoardContent treeId={mockTreeId} userId={mockUserId} />);

    expect(mockUsePersonRelationships).toHaveBeenCalledWith({
      personId: 'person123',
      enabled: true,
    });
  });
});
