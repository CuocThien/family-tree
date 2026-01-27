# Task 17: Create Zustand Stores

**Phase:** 10 - State Management
**Priority:** High
**Dependencies:** Task 16 (UI Components)
**Estimated Complexity:** Medium

---

## Objective

Create Zustand stores for client-side state management. Stores should handle tree visualization state, UI state, and cached data with proper TypeScript typing.

---

## Requirements

### Functional Requirements

1. Tree Board Store (visualization state)
2. UI Store (modals, sidebars, toasts)
3. User Preferences Store (theme, settings)
4. Cache Store (optimistic updates)
5. Form Store (draft data)

### Non-Functional Requirements

1. Type-safe store definitions
2. DevTools integration for debugging
3. Persist middleware for user preferences
4. Immer middleware for immutable updates
5. Efficient selectors to prevent re-renders

---

## Store Implementations

### 1. Tree Board Store

**File:** `src/store/treeBoardStore.ts`

```typescript
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
  useTreeBoardStore((state) => Array.from(state.persons.values()));
```

### 2. UI Store

**File:** `src/store/uiStore.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type ModalType =
  | 'addPerson'
  | 'editPerson'
  | 'confirmDelete'
  | 'shareTree'
  | 'inviteCollaborator'
  | 'exportTree'
  | 'settings'
  | null;

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Modal State
  activeModal: ModalType;
  modalData: Record<string, unknown>;

  // Sidebar State
  sidebarOpen: boolean;
  sidebarTab: 'filters' | 'details' | 'activity';

  // Toasts
  toasts: Toast[];

  // Loading States
  globalLoading: boolean;
  loadingTasks: Map<string, string>;

  // Mobile
  mobileMenuOpen: boolean;
}

interface UIActions {
  // Modal Actions
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Sidebar Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: UIState['sidebarTab']) => void;

  // Toast Actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Loading Actions
  setGlobalLoading: (loading: boolean) => void;
  startTask: (taskId: string, message: string) => void;
  endTask: (taskId: string) => void;

  // Mobile Actions
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    immer((set) => ({
      // Initial State
      activeModal: null,
      modalData: {},
      sidebarOpen: true,
      sidebarTab: 'filters',
      toasts: [],
      globalLoading: false,
      loadingTasks: new Map(),
      mobileMenuOpen: false,

      // Modal Actions
      openModal: (modal, data = {}) =>
        set((state) => {
          state.activeModal = modal;
          state.modalData = data;
        }),

      closeModal: () =>
        set((state) => {
          state.activeModal = null;
          state.modalData = {};
        }),

      // Sidebar Actions
      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open;
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),

      setSidebarTab: (tab) =>
        set((state) => {
          state.sidebarTab = tab;
        }),

      // Toast Actions
      addToast: (toast) =>
        set((state) => {
          const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          state.toasts.push({ ...toast, id });

          // Auto-remove after duration
          const duration = toast.duration ?? 5000;
          if (duration > 0) {
            setTimeout(() => {
              useUIStore.getState().removeToast(id);
            }, duration);
          }
        }),

      removeToast: (id) =>
        set((state) => {
          state.toasts = state.toasts.filter((t) => t.id !== id);
        }),

      clearToasts: () =>
        set((state) => {
          state.toasts = [];
        }),

      // Loading Actions
      setGlobalLoading: (loading) =>
        set((state) => {
          state.globalLoading = loading;
        }),

      startTask: (taskId, message) =>
        set((state) => {
          state.loadingTasks.set(taskId, message);
        }),

      endTask: (taskId) =>
        set((state) => {
          state.loadingTasks.delete(taskId);
        }),

      // Mobile Actions
      setMobileMenuOpen: (open) =>
        set((state) => {
          state.mobileMenuOpen = open;
        }),

      toggleMobileMenu: () =>
        set((state) => {
          state.mobileMenuOpen = !state.mobileMenuOpen;
        }),
    })),
    { name: 'ui-store' }
  )
);

// Convenience hooks
export const useModal = () => {
  const { activeModal, modalData, openModal, closeModal } = useUIStore();
  return { activeModal, modalData, openModal, closeModal };
};

export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string) => addToast({ type: 'success', message }),
    error: (message: string) => addToast({ type: 'error', message }),
    warning: (message: string) => addToast({ type: 'warning', message }),
    info: (message: string) => addToast({ type: 'info', message }),
  };
};

export const useIsLoading = () => {
  const { globalLoading, loadingTasks } = useUIStore();
  return globalLoading || loadingTasks.size > 0;
};
```

### 3. User Preferences Store

**File:** `src/store/preferencesStore.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type DateFormat = 'DMY' | 'MDY' | 'YMD';
type MeasurementUnit = 'metric' | 'imperial';

interface PreferencesState {
  // Appearance
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';

  // Localization
  dateFormat: DateFormat;
  measurementUnit: MeasurementUnit;
  language: string;

  // Tree View
  defaultViewMode: 'pedigree' | 'fan' | 'timeline' | 'vertical';
  defaultMaxGenerations: number;
  showMinimap: boolean;
  showNodeLabels: boolean;
  animationsEnabled: boolean;

  // Privacy
  defaultTreePrivacy: 'private' | 'family' | 'public';
  hideLivingPersonDetails: boolean;

  // Notifications
  emailNotifications: boolean;
  activityDigest: 'daily' | 'weekly' | 'never';
}

interface PreferencesActions {
  setTheme: (theme: Theme) => void;
  setFontSize: (size: PreferencesState['fontSize']) => void;
  setDateFormat: (format: DateFormat) => void;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
  setLanguage: (language: string) => void;
  setDefaultViewMode: (mode: PreferencesState['defaultViewMode']) => void;
  setDefaultMaxGenerations: (generations: number) => void;
  toggleMinimap: () => void;
  toggleNodeLabels: () => void;
  toggleAnimations: () => void;
  setDefaultTreePrivacy: (privacy: PreferencesState['defaultTreePrivacy']) => void;
  toggleHideLivingPersonDetails: () => void;
  setEmailNotifications: (enabled: boolean) => void;
  setActivityDigest: (frequency: PreferencesState['activityDigest']) => void;
  resetToDefaults: () => void;
}

const defaultPreferences: PreferencesState = {
  theme: 'system',
  fontSize: 'medium',
  dateFormat: 'DMY',
  measurementUnit: 'metric',
  language: 'en',
  defaultViewMode: 'pedigree',
  defaultMaxGenerations: 5,
  showMinimap: true,
  showNodeLabels: true,
  animationsEnabled: true,
  defaultTreePrivacy: 'private',
  hideLivingPersonDetails: true,
  emailNotifications: true,
  activityDigest: 'weekly',
};

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  devtools(
    persist(
      (set) => ({
        ...defaultPreferences,

        setTheme: (theme) => set({ theme }),
        setFontSize: (fontSize) => set({ fontSize }),
        setDateFormat: (dateFormat) => set({ dateFormat }),
        setMeasurementUnit: (measurementUnit) => set({ measurementUnit }),
        setLanguage: (language) => set({ language }),
        setDefaultViewMode: (defaultViewMode) => set({ defaultViewMode }),
        setDefaultMaxGenerations: (defaultMaxGenerations) => set({ defaultMaxGenerations }),
        toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
        toggleNodeLabels: () => set((state) => ({ showNodeLabels: !state.showNodeLabels })),
        toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
        setDefaultTreePrivacy: (defaultTreePrivacy) => set({ defaultTreePrivacy }),
        toggleHideLivingPersonDetails: () =>
          set((state) => ({ hideLivingPersonDetails: !state.hideLivingPersonDetails })),
        setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
        setActivityDigest: (activityDigest) => set({ activityDigest }),
        resetToDefaults: () => set(defaultPreferences),
      }),
      {
        name: 'user-preferences',
        partialize: (state) => ({
          theme: state.theme,
          fontSize: state.fontSize,
          dateFormat: state.dateFormat,
          measurementUnit: state.measurementUnit,
          language: state.language,
          defaultViewMode: state.defaultViewMode,
          defaultMaxGenerations: state.defaultMaxGenerations,
          showMinimap: state.showMinimap,
          animationsEnabled: state.animationsEnabled,
        }),
      }
    ),
    { name: 'preferences-store' }
  )
);

// Theme effect hook
export const useThemeEffect = () => {
  const theme = usePreferencesStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);
};
```

---

## Store Utilities

### Combined Store Hook

**File:** `src/store/index.ts`

```typescript
export { useTreeBoardStore, useSelectedPerson, useRootPerson } from './treeBoardStore';
export { useUIStore, useModal, useToast, useIsLoading } from './uiStore';
export { usePreferencesStore, useThemeEffect } from './preferencesStore';

// Combined selector for common patterns
export const useAppState = () => ({
  isLoading: useUIStore((s) => s.globalLoading),
  activeModal: useUIStore((s) => s.activeModal),
  theme: usePreferencesStore((s) => s.theme),
  treeId: useTreeBoardStore((s) => s.treeId),
});
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Hydration mismatch | Use persist middleware with onRehydrateStorage |
| Large person map | Use Map for O(1) lookups |
| Stale closure | Use getState() in callbacks |
| Memory leak | Clean up subscriptions on unmount |
| Theme system change | Listen to media query changes |
| LocalStorage full | Gracefully degrade, log warning |

---

## Acceptance Criteria

- [ ] Tree Board Store implemented
- [ ] UI Store implemented
- [ ] Preferences Store implemented
- [ ] DevTools integration working
- [ ] Persist middleware for preferences
- [ ] Immer middleware for immutable updates
- [ ] Efficient selectors defined
- [ ] TypeScript types complete
- [ ] Unit tests for stores
- [ ] Integration with components
