# Technical Specification: Fix Tree Diagram Refresh After Adding Person

## Document Information
- **Created:** 2026-02-23
- **Status:** Draft
- **Priority:** High
- **Related:** `tree-refresh-after-add-person.md` (previous partial fix)

## 1. Problem Statement

After adding a new person in the dashboard tree detail page, the tree diagram in the view does NOT refresh to show all new data. The newly added person is successfully created on the server but does not appear in the tree visualization.

### Current Behavior
1. User navigates to tree detail page (`/dashboard/trees/[treeId]`)
2. User clicks "Quick Add" button in FloatingControls
3. User fills out AddPersonModal form and submits
4. Person is created successfully on the server
5. React Query cache is invalidated (confirmed in code)
6. Tree diagram does NOT update to show the new person
7. User must manually refresh the page to see the new person

### Expected Behavior
1. User navigates to tree detail page
2. User clicks "Quick Add" button
3. User fills out form and submits
4. Person is created successfully
5. Tree diagram automatically updates to show the new person

## 2. Root Cause Analysis

### Investigation Summary

The data flow was traced through the following components:

1. **FloatingControls.tsx** (line 129-137) - Opens AddPersonModal and calls `addPerson.mutateAsync`
2. **AddPersonModal.tsx** - Handles form submission
3. **useAddPersonToTree.ts** (line 105-111) - Has `onSuccess` handler that invalidates queries
4. **useTreeData.ts** (line 14) - Uses query key `['tree-data', treeId]`
5. **TreeBoardContent.tsx** - Uses `useTreeData` and calculates nodes/edges via `useMemo`
6. **TreeCanvas.tsx** - Receives `initialNodes` and `initialEdges` props

### Root Cause

The issue is in **TreeCanvas.tsx** (lines 39-40):

```typescript
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```

The `useNodesState` and `useEdgesState` hooks from ReactFlow **only initialize state once**. They do NOT react to prop changes. According to ReactFlow documentation:

> "The useNodesState and useEdgesState hooks are designed to initialize state once. When you pass new initial nodes/edges, they won't update the internal state."

### Data Flow Analysis

```
[Add Person] -> [useAddPersonToTree.mutateAsync]
                    |
                    v
          [onSuccess: invalidateQueries(['tree-data', treeId])]
                    |
                    v
          [useTreeData refetches] -> [new data returned]
                    |
                    v
          [TreeBoardContent re-renders]
                    |
                    v
          [useMemo recalculates nodes/edges with new data]
                    |
                    v
          [TreeCanvas receives new initialNodes/initialEdges props]
                    |
                    v
          [PROBLEM: useNodesState/useEdgesState ignore new props]
                    |
                    v
          [Tree diagram shows OLD nodes/edges]
```

### Why Query Invalidation Is Not Enough

The previous fix (`tree-refresh-after-add-person.md`) correctly added query invalidation, but this only triggers React Query to refetch data. The issue is downstream: the `TreeCanvas` component does not update when it receives new props because `useNodesState` and `useEdgesState` are designed for local state management, not for responding to external prop changes.

## 3. Affected Components

| Component | Path | Issue |
|-----------|------|-------|
| TreeCanvas | `/src/components/tree/TreeCanvas.tsx` | Does not sync with prop changes |
| TreeBoardContent | `/src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` | Passes props that TreeCanvas ignores |

## 4. Solution Design

### Approach: Add useEffect to Sync Props with State

The most straightforward fix is to add a `useEffect` in `TreeCanvas` that syncs the incoming props with the internal state whenever they change.

### Implementation Details

**File: `/src/components/tree/TreeCanvas.tsx`**

Add a `useEffect` to update nodes and edges when props change:

```typescript
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PersonNode } from './PersonNode.flow';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import { usePreferencesStore } from '@/store/preferencesStore';

const nodeTypes: NodeTypes = {
  person: PersonNode,
};

interface TreeCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick: NodeMouseHandler;
  onNodeDoubleClick: NodeMouseHandler;
}

export function TreeCanvas({
  initialNodes,
  initialEdges,
  onNodeClick,
  onNodeDoubleClick,
}: TreeCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { viewport, setViewport, showMinimap } = useTreeBoardStore();
  const theme = usePreferencesStore((state) => state.theme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // NEW: Sync nodes when initialNodes prop changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // NEW: Sync edges when initialEdges prop changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // ... rest of component remains unchanged
}
```

### Alternative Approaches Considered

1. **Use controlled mode instead of useNodesState/useEdgesState**
   - Pros: Full control over state
   - Cons: Requires more significant refactoring; loses built-in drag/selection handling

2. **Use React key to remount TreeCanvas**
   - Pros: Simple; guarantees fresh state
   - Cons: Loses viewport position; jarring UX

3. **Add refresh method to TreeBoardContent**
   - Pros: Explicit control
   - Cons: Requires additional wiring; more complex

The `useEffect` approach is recommended because it is:
- Minimal code change
- Preserves viewport position
- Works with ReactFlow's built-in interactions
- Follows React best practices

## 5. Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/tree/TreeCanvas.tsx` | Modify | Add useEffect hooks to sync props with state |

## 6. Acceptance Criteria

### Primary Scenario

1. **Given** a tree detail page with existing people
2. **When** user adds a new person via Quick Add button
3. **Then** the tree diagram automatically updates
4. **And** the new person is visible in the correct position
5. **And** viewport position is preserved

### Edge Cases

1. **Given** an empty tree
2. **When** user adds the first person
3. **Then** the empty state transitions to tree view
4. **And** the single person is displayed

5. **Given** a tree with relationships
6. **When** user adds a person with relationships
7. **Then** the new person appears connected to related persons

### Error Handling

1. **Given** a failed person creation
2. **When** the API returns an error
3. **Then** the tree diagram remains unchanged
4. **And** error is displayed to user

## 7. Testing Requirements

### Unit Tests

**File: `src/components/tree/__tests__/TreeCanvas.test.tsx`** (create if not exists)

```typescript
describe('TreeCanvas', () => {
  it('should update nodes when initialNodes prop changes', () => {
    const { rerender } = render(<TreeCanvas initialNodes={[]} initialEdges={[]} ... />);
    expect(screen.queryByText('Person Name')).not.toBeInTheDocument();

    const newNodes = [{ id: '1', type: 'person', data: { firstName: 'John' } }];
    rerender(<TreeCanvas initialNodes={newNodes} initialEdges={[]} ... />);

    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('should update edges when initialEdges prop changes', () => {
    // Test edge updates
  });

  it('should preserve viewport when nodes update', () => {
    // Test viewport preservation
  });
});
```

### Integration Tests

**File: `tests/integration/tree-refresh.test.ts`**

```typescript
describe('Tree Refresh After Add Person', () => {
  it('should refresh tree after adding person', async () => {
    // 1. Navigate to tree page
    // 2. Click Quick Add
    // 3. Fill form
    // 4. Submit
    // 5. Verify new person appears in tree without page refresh
  });
});
```

### E2E Tests

**File: `tests/e2e/trees/add-person-refresh.spec.ts`**

```typescript
test('tree diagram updates after adding person', async ({ page }) => {
  await page.goto('/dashboard/trees/test-tree-id');

  // Count initial nodes
  const initialNodeCount = await page.locator('.react-flow__node').count();

  // Add new person
  await page.click('button:has-text("Quick Add")');
  await page.fill('input[name="firstName"]', 'New');
  await page.fill('input[name="lastName"]', 'Person');
  await page.click('button:has-text("Add to Family Tree")');

  // Wait for modal to close
  await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();

  // Verify new node appears
  const newNodeCount = await page.locator('.react-flow__node').count();
  expect(newNodeCount).toBe(initialNodeCount + 1);
});
```

## 8. Architecture Compliance

### SOLID Principles

| Principle | Compliance |
|-----------|------------|
| Single Responsibility | TreeCanvas already manages its own state; we're adding synchronization logic which is cohesive |
| Open/Closed | Adding useEffect extends behavior without modifying existing rendering logic |
| Liskov Substitution | N/A (no inheritance involved) |
| Interface Segregation | N/A (no interface changes) |
| Dependency Inversion | Depends on React hooks abstraction |

### Code Quality Standards

- Minimal change required (2 useEffect hooks)
- No new dependencies
- Preserves existing functionality
- Type-safe with TypeScript
- Follows React best practices for prop/state synchronization

## 9. Implementation Checklist

- [ ] Add useEffect for syncing `initialNodes` in TreeCanvas
- [ ] Add useEffect for syncing `initialEdges` in TreeCanvas
- [ ] Write unit tests for TreeCanvas prop sync
- [ ] Write integration test for add person flow
- [ ] Write E2E test for complete user flow
- [ ] Manual testing in development environment
- [ ] Code review
- [ ] QA verification

## 10. Rollback Plan

If issues arise:

1. Revert changes to `TreeCanvas.tsx`
2. Alternative: Use key-based remounting as temporary solution:
   ```typescript
   <TreeCanvas
     key={data?.persons.length}  // Force remount when person count changes
     initialNodes={nodes}
     initialEdges={edges}
     ...
   />
   ```

## 11. References

- ReactFlow useNodesState documentation: https://reactflow.dev/docs/api/hooks/use-nodes-state/
- React Query invalidation: https://tanstack.com/query/latest/docs/react/guides/invalidations-from-mutations
- Previous spec: `docs/specifications/tree-refresh-after-add-person.md`
