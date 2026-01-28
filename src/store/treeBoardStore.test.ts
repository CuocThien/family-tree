import { renderHook, act } from '@testing-library/react';
import { useTreeBoardStore, useSelectedPerson, useRootPerson, usePersonById } from './treeBoardStore';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

describe('TreeBoardStore', () => {
  const mockPersons: IPerson[] = [
    {
      _id: 'person-1',
      treeId: 'tree-1',
      firstName: 'John',
      lastName: 'Doe',
      photos: [],
      documents: [],
      customAttributes: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'person-2',
      treeId: 'tree-1',
      firstName: 'Jane',
      lastName: 'Smith',
      photos: [],
      documents: [],
      customAttributes: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockRelationships: IRelationship[] = [
    {
      _id: 'rel-1',
      treeId: 'tree-1',
      fromPersonId: 'person-1',
      toPersonId: 'person-2',
      type: 'spouse',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    // Reset store state before each test
    const { reset } = useTreeBoardStore.getState();
    reset();
  });

  describe('setTreeData', () => {
    it('should set tree data and auto-select root person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setTreeData('tree-1', mockPersons, mockRelationships);
      });

      expect(result.current.treeId).toBe('tree-1');
      expect(result.current.persons.size).toBe(2);
      expect(result.current.relationships).toEqual(mockRelationships);
      expect(result.current.rootPersonId).toBe('person-1');
    });

    it('should not change root person if already set', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setRootPerson('person-2');
        result.current.setTreeData('tree-1', mockPersons, mockRelationships);
      });

      expect(result.current.rootPersonId).toBe('person-2');
    });
  });

  describe('setRootPerson', () => {
    it('should set root person and select them', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setTreeData('tree-1', mockPersons, []);
        result.current.setRootPerson('person-2');
      });

      expect(result.current.rootPersonId).toBe('person-2');
      expect(result.current.selectedPersonId).toBe('person-2');
    });
  });

  describe('addPerson', () => {
    it('should add person to store', () => {
      const { result } = renderHook(() => useTreeBoardStore());
      const newPerson: IPerson = {
        _id: 'person-3',
        treeId: 'tree-1',
        firstName: 'Bob',
        lastName: 'Johnson',
        photos: [],
        documents: [],
        customAttributes: new Map(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.setTreeData('tree-1', mockPersons, []);
        result.current.addPerson(newPerson);
      });

      expect(result.current.persons.size).toBe(3);
      expect(result.current.persons.get('person-3')?.firstName).toBe('Bob');
    });
  });

  describe('updatePerson', () => {
    it('should update existing person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setTreeData('tree-1', mockPersons, []);
        result.current.updatePerson('person-1', { firstName: 'Updated' });
      });

      expect(result.current.persons.get('person-1')?.firstName).toBe('Updated');
    });

    it('should not update non-existent person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setTreeData('tree-1', mockPersons, []);
        result.current.updatePerson('non-existent', { firstName: 'Updated' });
      });

      expect(result.current.persons.size).toBe(2);
    });
  });

  describe('removePerson', () => {
    it('should remove person and their relationships', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setTreeData('tree-1', mockPersons, mockRelationships);
        result.current.selectPerson('person-1');
        result.current.expandPerson('person-1');
        result.current.removePerson('person-1');
      });

      expect(result.current.persons.size).toBe(1);
      expect(result.current.relationships).toHaveLength(0);
      expect(result.current.selectedPersonId).toBeNull();
      expect(result.current.expandedPersonIds.has('person-1')).toBe(false);
    });
  });

  describe('viewport actions', () => {
    it('should update viewport', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setViewport({ x: 100, y: 200, zoom: 1.5 });
      });

      expect(result.current.viewport).toEqual({ x: 100, y: 200, zoom: 1.5 });
    });

    it('should zoom in', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.viewport.zoom).toBe(1.2);
    });

    it('should zoom out', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setViewport({ zoom: 1.5 });
        result.current.zoomOut();
      });

      expect(result.current.viewport.zoom).toBeCloseTo(1.25);
    });

    it('should limit zoom in to max 2', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setViewport({ zoom: 2 });
        result.current.zoomIn();
      });

      expect(result.current.viewport.zoom).toBe(2);
    });

    it('should limit zoom out to min 0.1', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setViewport({ zoom: 0.1 });
        result.current.zoomOut();
      });

      expect(result.current.viewport.zoom).toBe(0.1);
    });

    it('should reset zoom', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setViewport({ x: 100, y: 200, zoom: 1.5 });
        result.current.resetZoom();
      });

      expect(result.current.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });

  describe('view mode', () => {
    it('should change view mode', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setViewMode('fan');
      });

      expect(result.current.viewMode).toBe('fan');
    });
  });

  describe('selection actions', () => {
    it('should select person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.selectPerson('person-1');
      });

      expect(result.current.selectedPersonId).toBe('person-1');
    });

    it('should deselect person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.selectPerson('person-1');
        result.current.selectPerson(null);
      });

      expect(result.current.selectedPersonId).toBeNull();
    });

    it('should hover person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.hoverPerson('person-1');
      });

      expect(result.current.hoveredPersonId).toBe('person-1');
    });

    it('should expand person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.expandPerson('person-1');
      });

      expect(result.current.expandedPersonIds.has('person-1')).toBe(true);
    });

    it('should collapse person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.expandPerson('person-1');
        result.current.collapsePerson('person-1');
      });

      expect(result.current.expandedPersonIds.has('person-1')).toBe(false);
    });

    it('should toggle expanded state', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.toggleExpanded('person-1');
      });

      expect(result.current.expandedPersonIds.has('person-1')).toBe(true);

      act(() => {
        result.current.toggleExpanded('person-1');
      });

      expect(result.current.expandedPersonIds.has('person-1')).toBe(false);
    });
  });

  describe('UI toggle actions', () => {
    it('should toggle minimap', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.toggleMinimap();
      });

      expect(result.current.showMinimap).toBe(false);
    });

    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.showSidebar).toBe(false);
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set error', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });
  });

  describe('tooltip actions', () => {
    it('should show tooltip', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.showTooltip('person-1', { x: 100, y: 200 });
      });

      expect(result.current.tooltip).toEqual({
        visible: true,
        personId: 'person-1',
        position: { x: 100, y: 200 },
      });
    });

    it('should hide tooltip', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.showTooltip('person-1', { x: 100, y: 200 });
        result.current.hideTooltip();
      });

      expect(result.current.tooltip.visible).toBe(false);
    });

    it('should hide tooltip when selecting person', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.showTooltip('person-1', { x: 100, y: 200 });
        result.current.selectPerson('person-2');
      });

      expect(result.current.tooltip.visible).toBe(false);
    });
  });

  describe('selectors', () => {
    it('useSelectedPerson should return selected person', () => {
      const { result: storeResult } = renderHook(() => useTreeBoardStore());
      const { result: selectorResult } = renderHook(() => useSelectedPerson());

      act(() => {
        storeResult.current.setTreeData('tree-1', mockPersons, []);
        storeResult.current.selectPerson('person-1');
      });

      expect(selectorResult.current?._id).toBe('person-1');
      expect(selectorResult.current?.firstName).toBe('John');
    });

    it('useSelectedPerson should return null when no person selected', () => {
      const { result } = renderHook(() => useSelectedPerson());

      expect(result.current).toBeNull();
    });

    it('useRootPerson should return root person', () => {
      const { result: storeResult } = renderHook(() => useTreeBoardStore());
      const { result: selectorResult } = renderHook(() => useRootPerson());

      act(() => {
        storeResult.current.setTreeData('tree-1', mockPersons, []);
      });

      expect(selectorResult.current?._id).toBe('person-1');
    });

    it('usePersonById should return person by id', () => {
      const { result: storeResult } = renderHook(() => useTreeBoardStore());
      const { result: selectorResult } = renderHook(() => usePersonById('person-2'));

      act(() => {
        storeResult.current.setTreeData('tree-1', mockPersons, []);
      });

      expect(selectorResult.current?.firstName).toBe('Jane');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useTreeBoardStore());

      act(() => {
        result.current.setTreeData('tree-1', mockPersons, mockRelationships);
        result.current.setViewport({ x: 100, y: 100, zoom: 1.5 });
        result.current.setViewMode('fan');
        result.current.selectPerson('person-1');
        result.current.reset();
      });

      expect(result.current.treeId).toBeNull();
      expect(result.current.persons.size).toBe(0);
      expect(result.current.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
      expect(result.current.viewMode).toBe('pedigree');
      expect(result.current.selectedPersonId).toBeNull();
    });
  });
});
