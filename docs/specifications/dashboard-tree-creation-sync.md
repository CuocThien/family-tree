# Dashboard Tree Creation Synchronization - Technical Specification

## Overview
This specification describes a fix to ensure the dashboard data refreshes automatically when a user creates a new tree, eliminating the need for manual page refresh.

## Problem Statement
After a user creates a new tree from the dashboard, the dashboard query cache is not invalidated. When the user returns to the dashboard (either by navigating back or after being redirected), they do not see the newly created tree in their list until a page refresh occurs. This creates a data inconsistency issue and degrades the user experience.

## Requirements

### Functional Requirements
- **FR-1**: The dashboard query cache must be invalidated after successful tree creation
- **FR-2**: When a user returns to the dashboard after creating a tree, the new tree must be visible
- **FR-3**: Cache invalidation should only occur on successful tree creation (not on failure)
- **FR-4**: The fix should work for both modal-based creation and direct page creation

### Non-Functional Requirements
- **Performance**: Minimal overhead - only invalidates cache, doesn't fetch twice
- **Security**: No security impact - client-side cache management only
- **Scalability**: No impact - uses existing TanStack Query patterns

## Acceptance Criteria

- [ ] **AC-1**: After creating a tree successfully, the dashboard query cache must be invalidated
- [ ] **AC-2**: When returning to the dashboard, the new tree must appear in the tree list
- [ ] **AC-3**: The invalidation should only occur on successful tree creation
- [ ] **AC-4**: No change in behavior when tree creation fails (dashboard cache remains unchanged)
- [ ] **AC-5**: If the user is redirected to the new tree page, the dashboard cache still needs updating for when they return
- [ ] **AC-6**: If tree creation fails, no cache invalidation should occur

## Current Behavior vs Expected Behavior

| Aspect | Current Behavior | Expected Behavior |
|--------|------------------|-------------------|
| **Dashboard Query** | Uses `useQuery` with key `['dashboard', userId]` | Should refetch after tree creation |
| **After Creation** | User redirected to new tree page | User redirected AND dashboard cache updated |
| **Return to Dashboard** | Shows stale data (old tree list) | Shows fresh data (includes new tree) |
| **Cache Invalidation** | Not implemented | Should invalidate dashboard query on success |

## Technical Approach

### Architecture
- **Services affected**: None (client-side hook only)
- **New repositories needed**: No
- **Database changes**: None

### User Flow
1. User navigates to dashboard
2. User clicks "Create New Tree" button
3. User fills form and submits
4. Tree is created via POST /api/trees
5. **NEW**: Dashboard query cache is invalidated
6. User is redirected to new tree page (or modal closes)
7. When user returns to dashboard, fresh data is fetched automatically

### Implementation Details

#### File to Modify: `src/hooks/useCreateTree.ts`

**Current Implementation (Problematic):**
```typescript
import { useMutation } from '@tanstack/react-query';
// ... other imports

export function useCreateTree() {
  const { data: session } = useSession();

  const createTree = useMutation({
    mutationFn: async (data: TreeFormInput): Promise<CreateTreeResponse> => {
      // ... mutation implementation
    },
    // NO onSuccess handler - THIS IS THE PROBLEM
  });

  return { createTree };
}
```

**Required Changes:**

1. Import `useQueryClient` from `@tanstack/react-query`
2. Get the `queryClient` instance inside the hook
3. Add `onSuccess` handler to invalidate dashboard query
4. Extract `userId` from session for query key construction

**Updated Implementation:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { TreeFormInput } from '@/schemas/tree';
import type { ITree } from '@/types/tree';

interface CreateTreeResponse {
  success: boolean;
  data?: ITree;
  error?: string;
}

export function useCreateTree() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();  // ADD: Query client instance

  const createTree = useMutation({
    mutationFn: async (data: TreeFormInput): Promise<CreateTreeResponse> => {
      if (!session?.user?.id) {
        return {
          success: false,
          error: 'You must be logged in to create a tree',
        };
      }

      try {
        const response = await fetch('/api/trees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            visibility: data.visibility,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: result.error || 'Failed to create tree',
          };
        }

        return {
          success: true,
          data: result.data,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create tree',
        };
      }
    },
    // ADD: onSuccess handler to invalidate dashboard query
    onSuccess: () => {
      if (session?.user?.id) {
        queryClient.invalidateQueries({
          queryKey: ['dashboard', session.user.id],
        });
      }
    },
  });

  return { createTree };
}
```

## Testing Strategy

### Unit Tests
**File**: `src/hooks/__tests__/useCreateTree.test.tsx`

Test cases to add:
1. Should invalidate dashboard query on successful tree creation
2. Should not invalidate dashboard query on failed tree creation
3. Should not invalidate dashboard query when not logged in

### Integration Tests
**File**: `src/components/dashboard/__tests__/DashboardContent.integration.test.tsx` (new)

Test scenarios:
1. Create tree and verify dashboard updates
2. Failed creation does not update dashboard

### E2E Tests
**File**: `tests/e2e/dashboard-tree-creation.spec.ts` (new)

Test scenarios:
1. Create tree and return to dashboard shows new tree
2. Create tree failed keeps same dashboard state

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| User redirected to new tree page before cache update | Low | `onSuccess` fires before redirect |
| Multiple rapid tree creations | Low | `invalidateQueries` is idempotent |
| Session expires during creation | Low | Check `session?.user?.id` before invalidating |
| Dashboard query fails to refetch | Low | TanStack Query handles automatically |
| User creates tree, then navigates away immediately | Low | TanStack Query continues refetch in background |

## Files to Modify

| File Path | Type | Changes |
|-----------|------|---------|
| `src/hooks/useCreateTree.ts` | Modify | Add `useQueryClient` and `onSuccess` handler |
| `src/hooks/__tests__/useCreateTree.test.tsx` | Modify | Add new test cases for cache invalidation |
| `src/components/dashboard/__tests__/DashboardContent.integration.test.tsx` | Create | Add integration test (new file) |

## Files NOT to Modify

- `src/components/dashboard/CreateTreeModal.tsx` - No changes needed
- `src/app/dashboard/DashboardContent.tsx` - No changes needed
- `src/app/api/trees/route.ts` - No changes needed
- `src/app/api/dashboard/route.ts` - No changes needed

## Success Verification Checklist

- [ ] Unit tests pass for `useCreateTree` hook
- [ ] New test cases cover success and failure scenarios
- [ ] Integration tests pass for dashboard tree creation flow
- [ ] Manual testing confirms new tree appears after creation
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] E2E tests pass (if implemented)
