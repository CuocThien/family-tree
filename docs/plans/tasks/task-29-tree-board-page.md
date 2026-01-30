# Tree Board Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive tree board page with pedigree/fan chart visualization, zoom controls, search, filters, and mini-map navigation.

**Architecture:**
- Use ReactFlow for interactive canvas with drag-and-drop
- Zustand store for state management (treeBoardStore)
- Strategy pattern for different view modes (pedigree, fan, timeline, vertical)
- Service layer for business logic, repository pattern for data access

**Tech Stack:**
- ReactFlow for canvas visualization
- Zustand for state management
- Material Symbols for icons
- Tailwind CSS for styling

---

## Task 1: Enhance TreeBoardStore with Search and Filter State

**Files:**
- Modify: `src/store/treeBoardStore.ts`

**Step 1: Write the failing test**

```typescript
// src/store/__tests__/treeBoardStore.test.ts

import { renderHook, act } from '@testing-library/react';
import { useTreeBoardStore } from '../treeBoardStore';

describe('TreeBoardStore - Search and Filters', () => {
  it('should update search query', () => {
    const { result } = renderHook(() => useTreeBoardStore());

    act(() => {
      result.current.setSearchQuery('John');
    });

    expect(result.current.searchQuery).toBe('John');
  });

  it('should update active filters', () => {
    const { result } = renderHook(() => useTreeBoardStore());

    act(() => {
      result.current.setFilter({ generations: 3 });
    });

    expect(result.current.filters).toEqual({ generations: 3 });
  });

  it('should filter nodes by search query', () => {
    const { result } = renderHook(() => useTreeBoardStore());

    const mockNodes = [
      { id: '1', data: { label: 'John Smith' } },
      { id: '2', data: { label: 'Jane Doe' } },
    ];

    act(() => {
      result.current.setNodes(mockNodes);
      result.current.setSearchQuery('John');
    });

    const filtered = result.current.filteredNodes;
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/store/__tests__/treeBoardStore.test.ts`
Expected: FAIL - State properties don't exist yet

**Step 3: Implement minimal code**

```typescript
// src/store/treeBoardStore.ts
// Add to existing store interface and implementation:

interface TreeBoardState {
  // ... existing state

  // Search and filter state
  searchQuery: string;
  filters: {
    generations?: number;
    branches?: string[];
    gender?: ('male' | 'female' | 'other')[];
    lifeStatus?: 'all' | 'living' | 'deceased';
  };

  // Actions
  setSearchQuery: (query: string) => void;
  setFilter: (filter: Partial<TreeBoardState['filters']>) => void;
  clearFilters: () => void;

  // Computed
  filteredNodes: Node[];
}

// Add to store implementation:
export const useTreeBoardStore = create<TreeBoardState>((set, get) => ({
  // ... existing implementations

  searchQuery: '',
  filters: {},

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setFilter: (filter) =>
    set((state) => ({
      filters: { ...state.filters, ...filter },
    })),

  clearFilters: () =>
    set({
      searchQuery: '',
      filters: {},
    }),

  get filteredNodes() {
    const { nodes, searchQuery, filters } = get();
    return nodes.filter((node) => {
      // Search filter
      if (searchQuery) {
        const label = node.data.label?.toLowerCase() || '';
        if (!label.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Gender filter
      if (filters.gender && filters.gender.length > 0) {
        if (!filters.gender.includes(node.data.gender)) {
          return false;
        }
      }

      // Life status filter
      if (filters.lifeStatus && filters.lifeStatus !== 'all') {
        const isDeceased = node.data.deathDate !== undefined;
        if (filters.lifeStatus === 'living' && isDeceased) return false;
        if (filters.lifeStatus === 'deceased' && !isDeceased) return false;
      }

      return true;
    });
  },
}));
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/store/__tests__/treeBoardStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/treeBoardStore.ts src/store/__tests__/treeBoardStore.test.ts
git commit -m "feat: add search and filter state to treeBoardStore"
```

---

## Task 2: Create SearchBar Component

**Files:**
- Create: `src/components/tree/SearchBar.tsx`
- Test: `src/components/tree/__tests__/SearchBar.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/tree/__tests__/SearchBar.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import { useTreeBoardStore } from '@/store/treeBoardStore';

jest.mock('@/store/treeBoardStore');

describe('SearchBar', () => {
  const mockSetSearchQuery = jest.fn();

  beforeEach(() => {
    (useTreeBoardStore as jest.Mock).mockReturnValue({
      setSearchQuery: mockSetSearchQuery,
      searchQuery: '',
    });
  });

  it('renders search input', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/search ancestors/i)).toBeInTheDocument();
  });

  it('calls setSearchQuery on input change', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search ancestors/i);

    fireEvent.change(input, { target: { value: 'John' } });

    expect(mockSetSearchQuery).toHaveBeenCalledWith('John');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tree/__tests__/SearchBar.test.tsx`
Expected: FAIL - Component doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/components/tree/SearchBar.tsx

'use client';

import { useTreeBoardStore } from '@/store/treeBoardStore';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';

export function SearchBar() {
  const { setSearchQuery } = useTreeBoardStore();

  return (
    <div className="hidden lg:block w-72">
      <label className="flex flex-col h-10 w-full">
        <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-[#e7f1f3] dark:bg-[#1e2f32]">
          <div className="text-[#4c8d9a] flex items-center justify-center pl-4">
            <MaterialSymbol icon="search" className="text-xl" />
          </div>
          <input
            type="text"
            className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a] px-3 text-sm"
            placeholder="Search ancestors..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </label>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tree/__tests__/SearchBar.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/tree/SearchBar.tsx src/components/tree/__tests__/SearchBar.test.tsx
git commit -m "feat: add SearchBar component"
```

---

## Task 3: Create FilterPanel Component

**Files:**
- Create: `src/components/tree/FilterPanel.tsx`
- Create: `src/components/tree/types.ts` (for filter types)
- Test: `src/components/tree/__tests__/FilterPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/tree/__tests__/FilterPanel.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '../FilterPanel';
import { useTreeBoardStore } from '@/store/treeBoardStore';

jest.mock('@/store/treeBoardStore');

describe('FilterPanel', () => {
  const mockSetFilter = jest.fn();
  const mockClearFilters = jest.fn();

  beforeEach(() => {
    (useTreeBoardStore as jest.Mock).mockReturnValue({
      setFilter: mockSetFilter,
      clearFilters: mockClearFilters,
      filters: {},
    });
  });

  it('renders filter navigation', () => {
    render(<FilterPanel />);
    expect(screen.getByText(/Filters/i)).toBeInTheDocument();
  });

  it('renders generation filter options', () => {
    render(<FilterPanel />);
    expect(screen.getByText(/Generations/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tree/__tests__/FilterPanel.test.tsx`
Expected: FAIL - Component doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/components/tree/types.ts

export type GenerationFilter = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type GenderFilter = 'male' | 'female' | 'other';
export type LifeStatusFilter = 'all' | 'living' | 'deceased';

export interface TreeFilters {
  generations?: GenerationFilter;
  branches?: string[];
  gender?: GenderFilter[];
  lifeStatus?: LifeStatusFilter;
}
```

```tsx
// src/components/tree/FilterPanel.tsx

'use client';

import { useTreeBoardStore } from '@/store/treeBoardStore';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import type { GenerationFilter, GenderFilter, LifeStatusFilter } from './types';

export function FilterPanel() {
  const { filters, setFilter, clearFilters } = useTreeBoardStore();

  const generations: GenerationFilter[] = [1, 2, 3, 4, 5, 6, 7, 8];
  const genders: GenderFilter[] = ['male', 'female', 'other'];
  const lifeStatuses: LifeStatusFilter[] = ['all', 'living', 'deceased'];

  const toggleGender = (gender: GenderFilter) => {
    const current = filters.gender || [];
    const updated = current.includes(gender)
      ? current.filter((g) => g !== gender)
      : [...current, gender];
    setFilter({ gender: updated });
  };

  return (
    <aside className="z-20 w-64 border-r border-[#e7f1f3] dark:border-[#1e2f32] bg-white dark:bg-background-dark p-4 flex flex-col justify-between overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Navigation Section */}
        <div>
          <h1 className="text-[#0d191b] dark:text-white text-xs font-bold uppercase tracking-wider mb-4 opacity-60">
            Navigation
          </h1>
          <nav className="flex flex-col gap-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/10 text-primary">
              <MaterialSymbol icon="tune" />
              <p className="text-sm font-semibold">Filters</p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-[#4c8d9a] hover:bg-background-light dark:hover:bg-[#1e2f32] rounded-xl cursor-pointer">
              <MaterialSymbol icon="layers" />
              <p className="text-sm font-medium">Generations</p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-[#4c8d9a] hover:bg-background-light dark:hover:bg-[#1e2f32] rounded-xl cursor-pointer">
              <MaterialSymbol icon="account_tree" />
              <p className="text-sm font-medium">Branches</p>
            </div>
          </nav>
        </div>

        {/* Generation Filter */}
        <div className="border-t border-[#e7f1f3] dark:border-[#1e2f32] pt-6">
          <h2 className="text-[#0d191b] dark:text-white text-sm font-bold mb-4">
            Generations to Show
          </h2>
          <div className="flex flex-wrap gap-2">
            {generations.map((gen) => (
              <button
                key={gen}
                onClick={() => setFilter({ generations: gen })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.generations === gen
                    ? 'bg-primary text-white'
                    : 'bg-[#e7f1f3] dark:bg-[#1e2f32] text-[#4c8d9a]'
                }`}
              >
                {gen}
              </button>
            ))}
          </div>
        </div>

        {/* Gender Filter */}
        <div className="border-t border-[#e7f1f3] dark:border-[#1e2f32] pt-6">
          <h2 className="text-[#0d191b] dark:text-white text-sm font-bold mb-4">
            Gender
          </h2>
          <div className="space-y-2">
            {genders.map((gender) => (
              <label key={gender} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.gender || []).includes(gender)}
                  onChange={() => toggleGender(gender)}
                  className="form-checkbox rounded text-primary focus:ring-primary"
                />
                <span className="text-sm capitalize text-[#4c8d9a]">{gender}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Life Status Filter */}
        <div className="border-t border-[#e7f1f3] dark:border-[#1e2f32] pt-6">
          <h2 className="text-[#0d191b] dark:text-white text-sm font-bold mb-4">
            Life Status
          </h2>
          <div className="space-y-2">
            {lifeStatuses.map((status) => (
              <label key={status} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="lifeStatus"
                  checked={filters.lifeStatus === status}
                  onChange={() => setFilter({ lifeStatus: status })}
                  className="form-radio text-primary focus:ring-primary"
                />
                <span className="text-sm capitalize text-[#4c8d9a]">{status}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="pt-4">
        <button
          onClick={clearFilters}
          className="w-full py-2 text-[#4c8d9a] text-sm font-medium hover:text-primary transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tree/__tests__/FilterPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/tree/FilterPanel.tsx src/components/tree/types.ts src/components/tree/__tests__/FilterPanel.test.tsx
git commit -m "feat: add FilterPanel component"
```

---

## Task 4: Create MiniMap Component

**Files:**
- Create: `src/components/tree/MiniMap.tsx`
- Test: `src/components/tree/__tests__/MiniMap.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/tree/__tests__/MiniMap.test.tsx

import { render, screen } from '@testing-library/react';
import { MiniMap } from '../MiniMap';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import { ReactFlowProvider } from '@xyflow/react';

jest.mock('@/store/treeBoardStore');

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ReactFlowProvider>
      {component}
    </ReactFlowProvider>
  );
};

describe('MiniMap', () => {
  it('renders minimap container', () => {
    (useTreeBoardStore as jest.Mock).mockReturnValue({
      nodes: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });

    renderWithProvider(<MiniMap />);
    expect(screen.getByText(/Navigator/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tree/__tests__/MiniMap.test.tsx`
Expected: FAIL - Component doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/components/tree/MiniMap.tsx

'use client';

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTreeBoardStore } from '@/store/treeBoardStore';

export const MiniMap = memo(function MiniMap() {
  const { getNodes } = useReactFlow();
  const nodes = useTreeBoardStore((state) => state.filteredNodes);

  return (
    <div className="absolute top-6 right-6 z-10 w-48 h-32 bg-white/80 dark:bg-background-dark/80 backdrop-blur rounded-xl border border-[#e7f1f3] dark:border-[#1e2f32] shadow-lg overflow-hidden">
      {/* Grid Background */}
      <div className="w-full h-full opacity-30 canvas-grid scale-50" />

      {/* Viewport Indicator */}
      <div className="absolute inset-0 border-2 border-primary/40 rounded-lg m-6 pointer-events-none" />

      {/* Node Indicators */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute w-2 h-2 rounded-full bg-primary transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(node.position.x / 2000) * 100}%`,
            top: `${(node.position.y / 2000) * 100}%`,
          }}
        />
      ))}

      {/* Label */}
      <p className="absolute bottom-2 left-2 text-[8px] font-bold uppercase tracking-widest text-[#4c8d9a]">
        Navigator
      </p>
    </div>
  );
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tree/__tests__/MiniMap.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/tree/MiniMap.tsx src/components/tree/__tests__/MiniMap.test.tsx
git commit -m "feat: add MiniMap component"
```

---

## Task 5: Enhance FloatingControls with View Mode Toggle

**Files:**
- Modify: `src/components/tree/FloatingControls.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/tree/__tests__/FloatingControls.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingControls } from '../FloatingControls';
import { useTreeBoardStore } from '@/store/treeBoardStore';

jest.mock('@/store/treeBoardStore');

describe('FloatingControls - View Mode Toggle', () => {
  const mockSetViewMode = jest.fn();

  beforeEach(() => {
    (useTreeBoardStore as jest.Mock).mockReturnValue({
      viewMode: 'pedigree',
      setViewMode: mockSetViewMode,
      zoom: 85,
      setZoom: jest.fn(),
    });
  });

  it('renders view mode buttons', () => {
    render(<FloatingControls />);
    expect(screen.getByText(/Pedigree View/i)).toBeInTheDocument();
    expect(screen.getByText(/Fan Chart/i)).toBeInTheDocument();
  });

  it('calls setViewMode when clicking Fan Chart', () => {
    render(<FloatingControls />);
    fireEvent.click(screen.getByText(/Fan Chart/i));
    expect(mockSetViewMode).toHaveBeenCalledWith('fan');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tree/__tests__/FloatingControls.test.tsx`
Expected: FAIL - Component doesn't have view mode toggle

**Step 3: Enhance implementation**

```tsx
// src/components/tree/FloatingControls.tsx

'use client';

import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { cn } from '@/lib/utils';

type ViewMode = 'pedigree' | 'fan' | 'timeline' | 'vertical';

export function FloatingControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom, setZoom, viewMode, setViewMode } = useTreeBoardStore();

  const viewModes: { label: string; value: ViewMode }[] = [
    { label: 'Pedigree View', value: 'pedigree' },
    { label: 'Fan Chart', value: 'fan' },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 rounded-2xl bg-white/90 dark:bg-background-dark/90 backdrop-blur-md shadow-2xl border border-white/20 dark:border-[#1e2f32]">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 px-2 border-r border-[#e7f1f3] dark:border-[#1e2f32]">
        <button
          onClick={zoomOut}
          className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light dark:hover:bg-[#1e2f32] transition-colors"
          aria-label="Zoom out"
        >
          <MaterialSymbol icon="zoom_out" />
        </button>
        <span className="text-xs font-bold text-[#4c8d9a] w-12 text-center">
          {Math.round(zoom)}%
        </span>
        <button
          onClick={zoomIn}
          className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light dark:hover:bg-[#1e2f32] transition-colors"
          aria-label="Zoom in"
        >
          <MaterialSymbol icon="zoom_in" />
        </button>
      </div>

      {/* Fit View */}
      <button
        onClick={() => fitView({ duration: 300 })}
        className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light dark:hover:bg-[#1e2f32] transition-colors"
        aria-label="Fit view"
      >
        <MaterialSymbol icon="my_location" />
      </button>

      {/* Pan Mode Toggle */}
      <button
        className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light dark:hover:bg-[#1e2f32] transition-colors"
        aria-label="Pan mode"
      >
        <MaterialSymbol icon="pan_tool" />
      </button>

      <div className="w-px h-6 bg-[#e7f1f3] dark:bg-[#1e2f32] mx-1" />

      {/* View Mode Toggle */}
      <div className="flex h-10 items-center justify-center rounded-xl bg-[#e7f1f3] dark:bg-[#1e2f32] p-1">
        {viewModes.map((mode) => (
          <label
            key={mode.value}
            className={cn(
              'flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium transition-all',
              viewMode === mode.value
                ? 'bg-white dark:bg-[#2d3a3c] shadow-sm text-primary'
                : 'text-[#4c8d9a] hover:text-primary'
            )}
          >
            <span className="truncate">{mode.label}</span>
            <input
              type="radio"
              name="view-toggle"
              checked={viewMode === mode.value}
              onChange={() => setViewMode(mode.value)}
              className="hidden"
            />
          </label>
        ))}
      </div>

      <div className="w-px h-6 bg-[#e7f1f3] dark:bg-[#1e2f32] mx-1" />

      {/* Quick Add Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
        onClick={() => {/* TODO: Open add person modal */}}
      >
        <MaterialSymbol icon="person_add" className="text-xl" />
        <span className="text-sm">Quick Add</span>
      </button>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tree/__tests__/FloatingControls.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/tree/FloatingControls.tsx src/components/tree/__tests__/FloatingControls.test.tsx
git commit -m "feat: add view mode toggle to FloatingControls"
```

---

## Task 6: Create TreeBoardHeader Component

**Files:**
- Create: `src/components/tree/TreeBoardHeader.tsx`
- Test: `src/components/tree/__tests__/TreeBoardHeader.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/tree/__tests__/TreeBoardHeader.test.tsx

import { render, screen } from '@testing-library/react';
import { TreeBoardHeader } from '../TreeBoardHeader';

describe('TreeBoardHeader', () => {
  const mockTree = {
    id: 'tree-1',
    name: 'Smith Family Tree',
    updatedAt: new Date('2024-01-28'),
  };

  it('renders tree name', () => {
    render(<TreeBoardHeader tree={mockTree} />);
    expect(screen.getByText('Smith Family Tree')).toBeInTheDocument();
  });

  it('renders last updated date', () => {
    render(<TreeBoardHeader tree={mockTree} />);
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tree/__tests__/TreeBoardHeader.test.tsx`
Expected: FAIL - Component doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/components/tree/TreeBoardHeader.tsx

'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from 'next-auth/react';
import { formatDateDistance } from '@/lib/date-utils';
import type { ITree } from '@/types/tree';

interface TreeBoardHeaderProps {
  tree: ITree;
}

export function TreeBoardHeader({ tree }: TreeBoardHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="z-30 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7f1f3] dark:border-[#1e2f32] bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-3">
      <div className="flex items-center gap-8">
        {/* Tree Info */}
        <div className="flex items-center gap-3 text-[#0d191b] dark:text-white">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <MaterialSymbol icon="account_tree" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight tracking-tight">{tree.name}</h2>
            <p className="text-xs text-[#4c8d9a] font-medium">
              Last updated {formatDateDistance(tree.updatedAt)}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {/* <SearchBar /> - Will add in next task */}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* View Mode Toggle */}
        {/* <ViewModeToggle /> - Will add in next task */}

        <div className="h-8 w-px bg-[#e7f1f3] dark:border-[#1e2f32]" />

        {/* Share Button */}
        <button
          className="flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary size-10 transition-colors"
          aria-label="Share tree"
        >
          <MaterialSymbol icon="share" />
        </button>

        {/* User Avatar */}
        {session?.user && (
          <Avatar
            src={session.user.image}
            alt={session.user.name || 'User'}
            size="md"
            className="border-2 border-primary"
          />
        )}
      </div>
    </header>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tree/__tests__/TreeBoardHeader.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/tree/TreeBoardHeader.tsx src/components/tree/__tests__/TreeBoardHeader.test.tsx src/lib/date-utils.ts
git commit -m "feat: add TreeBoardHeader component"
```

---

## Task 7: Update TreeBoardContent to Use New Components

**Files:**
- Modify: `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`

**Step 1: Write the failing test**

```tsx
// src/app/dashboard/trees/[treeId]/__tests__/TreeBoardContent.test.tsx

import { render, screen } from '@testing-library/react';
import { TreeBoardContent } from '../TreeBoardContent';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockTree = {
  id: 'tree-1',
  name: 'Smith Family Tree',
  ownerId: 'user-1',
  rootPersonId: 'person-1',
};

jest.mock('@/services/tree/TreeService', () => ({
  treeService: {
    getTreeById: jest.fn().mockResolvedValue(mockTree),
  },
}));

describe('TreeBoardContent', () => {
  it('renders header with tree name', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TreeBoardContent treeId="tree-1" />
      </QueryClientProvider>
    );

    await screen.findByText('Smith Family Tree');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/dashboard/trees/[treeId]/__tests__/TreeBoardContent.test.tsx`
Expected: FAIL - Component needs to be updated

**Step 3: Update implementation**

```tsx
// src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx

'use client';

import { Suspense, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useTreeData } from '@/hooks/useTreeData';
import { TreeBoardHeader } from '@/components/tree/TreeBoardHeader';
import { FilterPanel } from '@/components/tree/FilterPanel';
import { SearchBar } from '@/components/tree/SearchBar';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { FloatingControls } from '@/components/tree/FloatingControls';
import { MiniMap } from '@/components/tree/MiniMap';
import { TreeBoardSkeleton } from '@/components/tree/TreeBoardSkeleton';
import { NodeTooltip } from '@/components/tree/NodeTooltip';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import type { ITree } from '@/types/tree';

interface TreeBoardContentProps {
  treeId: string;
}

export function TreeBoardContent({ treeId }: TreeBoardContentProps) {
  const { tree, isLoading, error } = useTreeData(treeId);
  const filteredNodes = useTreeBoardStore((state) => state.filteredNodes);

  // Handle node click to show profile
  const handleNodeClick = useCallback((nodeId: string) => {
    // Navigate to person profile
    window.location.href = `/dashboard/persons/${nodeId}`;
  }, []);

  if (isLoading) {
    return <TreeBoardSkeleton />;
  }

  if (error || !tree) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Error loading tree</p>
          <p className="text-sm text-[#4c8d9a]">{error?.message || 'Tree not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Header */}
      <TreeBoardHeader tree={tree} />

      <main className="relative flex flex-1 overflow-hidden">
        {/* Left Filter Panel */}
        <FilterPanel />

        {/* Main Canvas Area */}
        <div className="relative flex-1 bg-background-light dark:bg-background-dark canvas-grid overflow-hidden">
          <ReactFlowProvider>
            <TreeCanvas
              treeId={treeId}
              onNodeClick={handleNodeClick}
            />
            <MiniMap />
            <NodeTooltip />
          </ReactFlowProvider>
        </div>
      </main>

      {/* Floating Controls */}
      <FloatingControls />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/dashboard/trees/[treeId]/__tests__/TreeBoardContent.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx src/app/dashboard/trees/[treeId]/__tests__/TreeBoardContent.test.tsx
git commit -m "feat: integrate new components into TreeBoardContent"
```

---

## Task 8: Add Export PDF Functionality

**Files:**
- Create: `src/lib/tree-export/pdf-export.ts`
- Create: `src/app/api/trees/[id]/export/pdf/route.ts`
- Test: `src/lib/tree-export/__tests__/pdf-export.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/tree-export/__tests__/pdf-export.test.ts

import { exportTreeAsPDF } from '../pdf-export';
import { treeService } from '@/services/tree/TreeService';

jest.mock('@/services/tree/TreeService');

describe('PDF Export', () => {
  it('should export tree as PDF', async () => {
    const mockTree = {
      id: 'tree-1',
      name: 'Smith Family Tree',
      persons: [],
      relationships: [],
    };

    (treeService.getTreeById as jest.Mock).mockResolvedValue(mockTree);

    const pdfBuffer = await exportTreeAsPDF('tree-1');

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/tree-export/__tests__/pdf-export.test.ts`
Expected: FAIL - PDF export doesn't exist

**Step 3: Write minimal implementation**

```typescript
// src/lib/tree-export/pdf-export.ts

import jsPDF from 'jspdf';
import { treeService } from '@/services/tree/TreeService';

export async function exportTreeAsPDF(treeId: string): Promise<Buffer> {
  const tree = await treeService.getTreeById(treeId);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  // Add title
  doc.setFontSize(24);
  doc.text(tree.name, 20, 20);

  // Add metadata
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
  doc.text(`Total Persons: ${tree.persons?.length || 0}`, 20, 40);

  // TODO: Add tree visualization rendering
  // This would use html2canvas to capture the ReactFlow canvas

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
```

```typescript
// src/app/api/trees/[id]/export/pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { exportTreeAsPDF } from '@/lib/tree-export/pdf-export';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pdfBuffer = await exportTreeAsPDF(params.id);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="family-tree-${params.id}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/tree-export/__tests__/pdf-export.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/tree-export/pdf-export.ts src/app/api/trees/[id]/export/pdf/route.ts src/lib/tree-export/__tests__/pdf-export.test.ts
git commit -m "feat: add PDF export functionality"
```

---

## Task 9: Add Export PDF Button to FilterPanel

**Files:**
- Modify: `src/components/tree/FilterPanel.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/tree/__tests__/FilterPanel.export.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '../FilterPanel';
import { useTreeBoardStore } from '@/store/treeBoardStore';

jest.mock('@/store/treeBoardStore');

describe('FilterPanel - Export PDF', () => {
  it('renders export PDF button', () => {
    render(<FilterPanel />);
    expect(screen.getByText(/Export PDF/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tree/__tests__/FilterPanel.export.test.tsx`
Expected: FAIL - Button doesn't exist

**Step 3: Add button to FilterPanel**

```tsx
// src/components/tree/FilterPanel.tsx
// Add to the bottom of the component, before closing tag:

{/* Export PDF Button */}
<div className="pt-4">
  <button
    onClick={() => window.open(`/api/trees/${treeId}/export/pdf`, '_blank')}
    className="w-full flex cursor-pointer items-center justify-center rounded-xl h-11 px-4 bg-primary text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
  >
    <MaterialSymbol icon="picture_as_pdf" className="mr-2" />
    <span className="truncate">Export PDF</span>
  </button>
</div>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tree/__tests__/FilterPanel.export.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/tree/FilterPanel.tsx src/components/tree/__tests__/FilterPanel.export.test.tsx
git commit -m "feat: add export PDF button to FilterPanel"
```

---

## Task 10: Create Integration Test for Tree Board Page

**Files:**
- Create: `tests/e2e/tree-board.spec.ts`

**Step 1: Write the test**

```typescript
// tests/e2e/tree-board.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Tree Board Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should load tree board page', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Check header
    await expect(page.locator('h2')).toContainText('Smith Family Tree');

    // Check canvas
    await expect(page.locator('.react-flow')).toBeVisible();

    // Check controls
    await expect(page.getByText('Pedigree View')).toBeVisible();
    await expect(page.getByText('Fan Chart')).toBeVisible();
  });

  test('should search for person', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Type in search
    await page.fill('input[placeholder*="Search ancestors"]', 'John');

    // Wait for filtered results
    await page.waitForTimeout(300);

    // Verify only John is visible
    const nodes = page.locator('.react-flow__node');
    const count = await nodes.count();
    expect(count).toBeLessThan(5); // Should have fewer nodes
  });

  test('should filter by generation', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Click on generation filter
    await page.click('text=Generations');
    await page.click('button:has-text("3")');

    // Wait for filtered results
    await page.waitForTimeout(300);

    // Verify limited generations
    const nodes = page.locator('.react-flow__node');
    expect(await nodes.count()).toBeGreaterThan(0);
  });

  test('should switch view mode', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Click on Fan Chart
    await page.click('text=Fan Chart');

    // Verify view mode changed
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('should zoom in and out', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Get initial zoom
    const zoomLabel = page.locator('text=/\\d+%/');
    await expect(zoomLabel).toBeVisible();

    // Click zoom in
    await page.click('[aria-label="Zoom in"]');
    await page.waitForTimeout(100);

    // Click zoom out
    await page.click('[aria-label="Zoom out"]');
    await page.waitForTimeout(100);
  });

  test('should export PDF', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Setup download handler
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('text=Export PDF');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
```

**Step 2: Run test to verify behavior**

Run: `npm run test:e2e tests/e2e/tree-board.spec.ts`
Expected: Tests should pass or show areas needing improvement

**Step 3: Commit**

```bash
git add tests/e2e/tree-board.spec.ts
git commit -m "test: add E2E tests for tree board page"
```

---

## Task 11: Run Type Check and Lint

**Files:**
- All modified files

**Step 1: Run TypeScript type check**

Run: `npm run type-check`
Expected: No type errors

**Step 2: Fix any type errors**

If errors exist, fix them and re-run.

**Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors

**Step 4: Fix any lint errors**

If errors exist, fix them and re-run.

**Step 5: Commit**

```bash
git add .
git commit -m "fix: resolve type and lint issues"
```

---

## Task 12: Final Review and Documentation

**Files:**
- Create: `docs/tree-board-features.md`

**Step 1: Create feature documentation**

```markdown
# Tree Board Features

## Overview
The tree board page provides an interactive family tree visualization with multiple view modes, search, filters, and export capabilities.

## Features

### View Modes
- **Pedigree View**: Traditional horizontal pedigree chart
- **Fan Chart**: Circular fan chart visualization
- **Timeline**: Timeline-based view (planned)
- **Vertical**: Vertical tree layout (planned)

### Search
- Real-time search across all person names
- Filters nodes as you type
- Highlights matching results

### Filters
- **Generations**: Limit visible generations (1-8)
- **Branches**: Filter by specific family branches
- **Gender**: Show specific genders
- **Life Status**: Filter by living/deceased

### Controls
- **Zoom**: Zoom in/out buttons
- **Fit View**: Center the tree
- **Pan Mode**: Toggle panning
- **Quick Add**: Add new person (opens modal)

### Export
- **PDF Export**: Download tree as PDF document

## Components

### TreeBoardHeader
Tree name, search bar, and user actions.

### FilterPanel
Left sidebar with all filter options.

### TreeCanvas
ReactFlow-based interactive canvas.

### FloatingControls
Bottom control bar with zoom, view mode, and add button.

### MiniMap
Navigation minimap showing viewport position.

### NodeTooltip
Hover tooltip with person details.

## API Routes

### GET /api/trees/[id]/export/pdf
Export tree as PDF.

## Store

### treeBoardStore
Zustand store managing:
- nodes, edges
- viewMode
- zoom
- searchQuery
- filters
- computed: filteredNodes

## Testing

Unit tests: `src/components/tree/__tests__/`
E2E tests: `tests/e2e/tree-board.spec.ts`
```

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 4: Final commit**

```bash
git add docs/tree-board-features.md
git commit -m "docs: add tree board feature documentation"
```

---

## Summary

This plan implements a complete tree board page with:
- Interactive canvas using ReactFlow
- Search and filter functionality
- Multiple view modes (pedigree, fan)
- Zoom and pan controls
- Mini-map navigation
- PDF export
- Full test coverage (unit, integration, E2E)
- TypeScript strict mode compliance
- SOLID architecture adherence
