# Dashboard Tree Loading Bug Fix

## Bug Report

**Issue**: After creating a new tree, the dashboard cannot load data about existing trees. The newly created tree does not appear on the dashboard until a page refresh.

**Severity**: Medium - Affects user experience, requires manual refresh to see new trees

## Root Cause

The bug was a **React Query cache invalidation issue**. After creating a new tree:

1. The `useCreateTree` hook successfully created the tree in the database via API
2. The dashboard page uses `useQuery` with key `['dashboard', userId]` to fetch tree data
3. The `useCreateTree` hook was missing an `onSuccess` handler to invalidate this cache
4. As a result, React Query continued serving stale cached data instead of refetching

## Files Modified

### 1. `src/hooks/useCreateTree.ts`

**Changes**:
- Added `useQueryClient` import from TanStack Query
- Added `onSuccess` callback to mutation that invalidates the `['dashboard', session.user.id]` query
- Added check to only invalidate when `data.success` is true and user is authenticated

**Before**:
```typescript
const createTree = useMutation({
  mutationFn: async (data: TreeFormInput): Promise<CreateTreeResponse> => {
    // ... mutation logic
  },
});
```

**After**:
```typescript
const createTree = useMutation({
  mutationFn: async (data: TreeFormInput): Promise<CreateTreeResponse> => {
    // ... mutation logic
  },
  onSuccess: (data) => {
    if (data.success && session?.user?.id) {
      queryClient.invalidateQueries({
        queryKey: ['dashboard', session.user.id],
      });
    }
  },
});
```

### 2. `src/hooks/__tests__/useCreateTree.test.tsx`

**Changes**:
- Added test: "should invalidate dashboard query on successful tree creation"
- Added test: "should not invalidate dashboard query on failed tree creation"
- Added test: "should not invalidate dashboard query when not logged in"
- All tests verify the correct `invalidateQueries` behavior

### 3. `jest.config.js`

**Changes**:
- Fixed configuration to properly handle setup files
- Changed `setupFilesAfterEnv` reference from `jest.setup.mjs` to `jest.setup.js`

### 4. `jest.setup.js` (renamed from `jest.setup.mjs`)

**Changes**:
- Converted from ES modules to CommonJS
- Changed `import` statements to `require` statements
- This allows Jest to properly load the setup file with `ts-jest` preset

## Acceptance Criteria

- [x] After creating a new tree, the dashboard automatically refreshes to show the new tree
- [x] Cache is only invalidated on successful tree creation (not on API errors)
- [x] Cache is not invalidated when user is not authenticated
- [x] All existing tests continue to pass
- [x] New tests cover the cache invalidation behavior
- [x] Build completes successfully

## Testing

### Unit Tests
```bash
npm test -- --testPathPatterns="useCreateTree"
```

Result: 6/6 tests passing

### Build Test
```bash
npm run build
```

Result: Build successful

## Related Code

- Dashboard query: `src/app/dashboard/DashboardContent.tsx` - uses `useQuery(['dashboard', userId])`
- Trees query: `src/app/dashboard/trees/TreesContent.tsx` - uses `useQuery(['trees', userId])`
- Create tree API: `src/app/api/trees/route.ts` - handles POST requests
- Dashboard API: `src/app/api/dashboard/route.ts` - returns dashboard data

## Prevention

To prevent similar issues in the future:
1. Always invalidate relevant queries after data mutations
2. Add tests for cache invalidation behavior
3. Consider using a code review checklist item for cache invalidation

## Timeline

- **Date**: 2026-02-03
- **Workflow**: ft-workflow (Bug Fix)
- **Total Iterations**: 1 (fix applied on first attempt)
