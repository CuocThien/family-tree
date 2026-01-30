import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

export type ViewMode = 'pedigree' | 'fan' | 'timeline' | 'vertical';

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface TreeFilters {
  generations?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  branches?: string[];
  gender?: ('male' | 'female' | 'other')[];
  lifeStatus?: 'all' | 'living' | 'deceased';
}

interface TreeBoardState {
  // Data
  treeId: string | null;
  persons: Map<string, IPerson>;
  relationships: IRelationship[];
  rootPersonId: string | null;

  // View State
  viewport: Viewport;
  viewMode: ViewMode;
  selectedPersonId: string | null;
  hoveredPersonId: string | null;
  expandedPersonIds: Set<string>;
  maxGenerations: number;

  // Search and filter state
  searchQuery: string;
  filters: TreeFilters;

  // UI State
  showMinimap: boolean;
  showSidebar: boolean;
  isLoading: boolean;
  error: string | null;

  // Tooltip
  tooltip: {
    visible: boolean;
    personId: string | null;
    position: { x: number; y: number };
  };
}

interface TreeBoardActions {
  // Data Actions
  setTreeData: (treeId: string, persons: IPerson[], relationships: IRelationship[]) => void;
  setRootPerson: (personId: string) => void;
  addPerson: (person: IPerson) => void;
  updatePerson: (personId: string, updates: Partial<IPerson>) => void;
  removePerson: (personId: string) => void;

  // View Actions
  setViewport: (viewport: Partial<Viewport>) => void;
  setViewMode: (mode: ViewMode) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;

  // Selection Actions
  selectPerson: (personId: string | null) => void;
  hoverPerson: (personId: string | null) => void;
  expandPerson: (personId: string) => void;
  collapsePerson: (personId: string) => void;
  toggleExpanded: (personId: string) => void;

  // Search and filter actions
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<TreeFilters>) => void;
  clearFilters: () => void;

  // UI Actions
  toggleMinimap: () => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Tooltip Actions
  showTooltip: (personId: string, position: { x: number; y: number }) => void;
  hideTooltip: () => void;

  // Reset
  reset: () => void;

  // Computed
  filteredPersons: IPerson[];
}

const initialState: TreeBoardState = {
  treeId: null,
  persons: new Map(),
  relationships: [],
  rootPersonId: null,

  viewport: { x: 0, y: 0, zoom: 1 },
  viewMode: 'pedigree',
  selectedPersonId: null,
  hoveredPersonId: null,
  expandedPersonIds: new Set(),
  maxGenerations: 5,

  searchQuery: '',
  filters: {},

  showMinimap: true,
  showSidebar: true,
  isLoading: false,
  error: null,

  tooltip: {
    visible: false,
    personId: null,
    position: { x: 0, y: 0 },
  },
};

export const useTreeBoardStore = create<TreeBoardState & TreeBoardActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // Data Actions
        setTreeData: (treeId, persons, relationships) =>
          set((state) => {
            state.treeId = treeId;
            state.persons = new Map(persons.map((p) => [p._id, p]));
            state.relationships = relationships;

            // Auto-select root if not set
            if (!state.rootPersonId && persons.length > 0) {
              state.rootPersonId = persons[0]._id;
            }
          }),

        setRootPerson: (personId) =>
          set((state) => {
            state.rootPersonId = personId;
            state.selectedPersonId = personId;
          }),

        addPerson: (person) =>
          set((state) => {
            state.persons.set(person._id, person);
          }),

        updatePerson: (personId, updates) =>
          set((state) => {
            const person = state.persons.get(personId);
            if (person) {
              state.persons.set(personId, { ...person, ...updates });
            }
          }),

        removePerson: (personId) =>
          set((state) => {
            state.persons.delete(personId);
            state.relationships = state.relationships.filter(
              (r) => r.fromPersonId !== personId && r.toPersonId !== personId
            );
            if (state.selectedPersonId === personId) {
              state.selectedPersonId = null;
            }
            state.expandedPersonIds.delete(personId);
          }),

        // View Actions
        setViewport: (viewport) =>
          set((state) => {
            Object.assign(state.viewport, viewport);
          }),

        setViewMode: (mode) =>
          set((state) => {
            state.viewMode = mode;
          }),

        zoomIn: () =>
          set((state) => {
            state.viewport.zoom = Math.min(state.viewport.zoom * 1.2, 2);
          }),

        zoomOut: () =>
          set((state) => {
            state.viewport.zoom = Math.max(state.viewport.zoom / 1.2, 0.1);
          }),

        resetZoom: () =>
          set((state) => {
            state.viewport.zoom = 1;
            state.viewport.x = 0;
            state.viewport.y = 0;
          }),

        fitToScreen: () =>
          set((state) => {
            // Will be calculated based on canvas size
            state.viewport.zoom = 0.85;
            state.viewport.x = 0;
            state.viewport.y = 0;
          }),

        // Selection Actions
        selectPerson: (personId) =>
          set((state) => {
            state.selectedPersonId = personId;
            if (personId) {
              state.tooltip.visible = false;
            }
          }),

        hoverPerson: (personId) =>
          set((state) => {
            state.hoveredPersonId = personId;
          }),

        expandPerson: (personId) =>
          set((state) => {
            state.expandedPersonIds.add(personId);
          }),

        collapsePerson: (personId) =>
          set((state) => {
            state.expandedPersonIds.delete(personId);
          }),

        toggleExpanded: (personId) =>
          set((state) => {
            if (state.expandedPersonIds.has(personId)) {
              state.expandedPersonIds.delete(personId);
            } else {
              state.expandedPersonIds.add(personId);
            }
          }),

        // Search and filter actions
        setSearchQuery: (query) =>
          set((state) => {
            state.searchQuery = query;
          }),

        setFilter: (filter) =>
          set((state) => {
            state.filters = { ...state.filters, ...filter };
          }),

        clearFilters: () =>
          set((state) => {
            state.searchQuery = '';
            state.filters = {};
          }),

        // UI Actions
        toggleMinimap: () =>
          set((state) => {
            state.showMinimap = !state.showMinimap;
          }),

        toggleSidebar: () =>
          set((state) => {
            state.showSidebar = !state.showSidebar;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        // Tooltip Actions
        showTooltip: (personId, position) =>
          set((state) => {
            state.tooltip = {
              visible: true,
              personId,
              position,
            };
          }),

        hideTooltip: () =>
          set((state) => {
            state.tooltip.visible = false;
          }),

        // Reset
        reset: () => set(initialState),

        // Computed
        get filteredPersons(): IPerson[] {
          const { persons, searchQuery, filters } = get();
          return Array.from(persons.values()).filter((person) => {
            // Search filter
            if (searchQuery) {
              const fullName = `${person.firstName || ''} ${person.lastName || ''}`.toLowerCase();
              if (!fullName.includes(searchQuery.toLowerCase())) {
                return false;
              }
            }

            // Gender filter
            if (filters.gender && filters.gender.length > 0) {
              if (!person.gender || !filters.gender.includes(person.gender as 'male' | 'female' | 'other')) {
                return false;
              }
            }

            // Life status filter
            if (filters.lifeStatus && filters.lifeStatus !== 'all') {
              const isDeceased = person.dateOfDeath !== undefined && person.dateOfDeath !== null;
              if (filters.lifeStatus === 'living' && isDeceased) return false;
              if (filters.lifeStatus === 'deceased' && !isDeceased) return false;
            }

            return true;
          });
        },
      }))
    ),
    { name: 'tree-board-store' }
  )
);

// Selectors
export const useSelectedPerson = () =>
  useTreeBoardStore((state) =>
    state.selectedPersonId ? state.persons.get(state.selectedPersonId) : null
  );

export const useRootPerson = () =>
  useTreeBoardStore((state) =>
    state.rootPersonId ? state.persons.get(state.rootPersonId) : null
  );

export const usePersonById = (personId: string) =>
  useTreeBoardStore((state) => state.persons.get(personId));

export const useVisiblePersons = () =>
  useTreeBoardStore((state) => state.filteredPersons);

export const useFilteredPersons = () =>
  useTreeBoardStore((state) => state.filteredPersons);

export const useZoom = () => useTreeBoardStore((state) => Math.round(state.viewport.zoom * 100));
