# Technical Specification: Tree Page Refresh After Adding First Person

## Document Information
- **Created:** 2026-02-04
- **Status:** Draft
- **Priority:** High

## 1. Problem Statement

After adding the first person to a tree, the tree detail page does not display the new data. The page continues to show the "No People in Tree" empty state even though the person was successfully created on the server.

### Current Behavior
1. User navigates to an empty tree detail page
2. User clicks "Add First Person" button
3. User fills out the form and submits
4. Person is created successfully on the server
5. Page remains on empty state (no refresh)

### Expected Behavior
1. User navigates to an empty tree detail page
2. User clicks "Add First Person" button
3. User fills out the form and submits
4. Person is created successfully on the server
5. **Page refreshes and displays the newly added person**

## 2. Root Cause Analysis

### Affected Components
- **Tree Detail Page:** `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`
- **Add Person Hook:** `src/hooks/useAddPersonToTree.ts`
- **Floating Controls:** `src/components/tree/FloatingControls.tsx`

### Technical Details

The application uses React Query (`@tanstack/react-query`) for client-side data fetching. The tree detail page:
- Fetches data using the `useTreeData` hook with query key `['tree-data', treeId]`
- Caches data for 5 minutes (staleTime)
- Conditionally renders based on `data.persons.length`

When a person is added:
1. `useAddPersonToTree` mutation successfully creates the person via API
2. Components call `router.refresh()` to refresh the page
3. **Problem:** `router.refresh()` only refreshes Next.js Server Components
4. **Problem:** React Query cache is NOT invalidated
5. Component re-renders with stale cached data
6. Empty state continues to show

### Why `router.refresh()` Doesn't Work

```typescript
// This only refreshes Server Components, not React Query cache
router.refresh();
```

The `TreeBoardContent` component uses client-side data fetching with React Query. The cache must be explicitly invalidated using `queryClient.invalidateQueries()`.

## 3. Solution Design

### Approach: Add Query Invalidation to Mutation Hook

Follow the existing pattern used in other hooks:
- `usePerson.ts` - `useCreatePerson` invalidates queries (line 70)
- `useTree.ts` - `useUpdateTree` invalidates queries (lines 123-124)
- `useCreateTree.ts` - invalidates dashboard queries (line 57)

### Implementation

Modify `src/hooks/useAddPersonToTree.ts` to:

1. Import `useQueryClient` from React Query
2. Get the query client instance
3. Add `onSuccess` handler to invalidate queries after successful person creation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAddPersonToTree() {
  const queryClient = useQueryClient();

  const addPerson = useMutation({
    mutationFn: async (variables: AddPersonVariables): Promise<AddPersonResponse> => {
      // ... existing code ...
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({
          queryKey: ['tree-data', data.data.treeId]
        });
      }
    }
  });

  return { addPerson };
}
```

### Optional Cleanup

Remove unnecessary `router.refresh()` calls from:
- `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` (line 108)
- `src/components/tree/FloatingControls.tsx` (line 139)

These calls are redundant once proper query invalidation is in place.

## 4. Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/useAddPersonToTree.ts` | Modify | Add query invalidation |
| `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` | Optional | Remove redundant router.refresh() |
| `src/components/tree/FloatingControls.tsx` | Optional | Remove redundant router.refresh() |

## 5. Acceptance Criteria

1. **Given** an empty tree detail page
2. **When** user adds the first person to the tree
3. **Then** the page should automatically refresh
4. **And** the newly added person should be visible in the tree visualization

### Additional Scenarios

1. **Given** a tree with existing people
2. **When** user adds another person
3. **Then** the page should refresh and show the new person

4. **Given** a user adds a person with an error
5. **When** the API returns an error response
6. **Then** the cache should NOT be invalidated
7. **And** the page should remain in its current state

## 6. Testing Requirements

### Unit Tests
- Test `useAddPersonToTree` invalidates query on success
- Test `useAddPersonToTree` does NOT invalidate query on error

### Integration Tests
- Test adding person to tree triggers data refetch
- Test tree visualization updates after add

### E2E Tests
- Test complete flow: empty tree → add first person → verify person appears
- Test complete flow: existing tree → add person → verify person appears

## 7. Architecture Compliance

### SOLID Principles

| Principle | Compliance |
|-----------|------------|
| Single Responsibility | The mutation hook is responsible for both the mutation and cache invalidation (cohesive responsibility) |
| Open/Closed | Adding `onSuccess` handler extends behavior without modifying existing mutation logic |
| Liskov Substitution | N/A (no inheritance involved) |
| Interface Segregation | N/A (no interface changes) |
| Dependency Inversion | Depends on React Query abstraction (`useQueryClient`), not concrete implementation |

### Code Quality Standards
- Follows existing patterns in `usePerson.ts` and `useTree.ts`
- Maintains consistency with React Query best practices
- No new dependencies required
- Type-safe with TypeScript

## 8. Rollback Plan

If issues arise:
1. Revert changes to `useAddPersonToTree.ts`
2. Restore `router.refresh()` calls if removed
3. Consider alternative: manual refetch button in UI
