# Technical Specification: Show Relationship Data in Edit Person Form

## Overview

**Feature**: Display existing relationship data in the Edit Person Modal when clicking on a person node in the tree board detail page.

**Issue**: When a user clicks on a person node on the tree board, the Edit Person Modal opens but does not show the person's existing relationships. This makes it difficult to view or update relationship data.

**Priority**: High - Core user workflow affected

## Problem Analysis

### Root Cause

The issue is a **race condition** in the data flow:

1. When a person node is clicked, `isEditModalOpen` becomes `true`
2. `usePersonRelationships` hook starts fetching relationships (async)
3. `EditPersonModal` renders immediately with empty `personRelationships`
4. `useManageRelationships` initializes with empty array (useState only runs once on mount)
5. When relationship data arrives, `useManageRelationships` doesn't update because useState initialization doesn't re-run

### Current Code Flow

```
TreeBoardContent.tsx
  ├── usePersonRelationships({ enabled: isEditModalOpen && selectedPerson })
  │   └── Returns: { data: personRelationships, isLoading: isFetchingRelationships }
  │
  └── EditPersonModal
        └── existingRelationships={personRelationships}  // Empty on first render!
              └── useManageRelationships({ initialRelationships: existingRelationships })
                    └── useState(() => [...]) // Only runs once on mount
```

### Files Involved

| File | Purpose |
|------|---------|
| `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` | Tree board page, opens EditPersonModal |
| `src/components/person/EditPersonModal.tsx` | The modal that should show relationships |
| `src/hooks/useManageRelationships.ts` | Hook that manages relationship state |
| `src/hooks/usePersonRelationships.ts` | Hook that fetches relationships from API |

## Solution Design

### Approach: Add useEffect to Sync Relationships

The most minimal and SOLID-compliant fix is to add a `useEffect` in `EditPersonModal` that updates the relationships manager when `existingRelationships` prop changes.

This approach:
- Follows **Single Responsibility Principle**: Each component handles its own state synchronization
- Is **Open/Closed**: We extend functionality without modifying core logic
- Maintains **Dependency Inversion**: We don't introduce new dependencies

### Implementation Details

#### 1. Modify `EditPersonModal.tsx`

Add a mechanism to update relationships when data arrives:

```tsx
// Add useEffect to sync relationships when existingRelationships changes
useEffect(() => {
  if (existingRelationships.length > 0) {
    relationshipsManager.syncRelationships(existingRelationships);
  }
}, [existingRelationships]);
```

#### 2. Add `syncRelationships` method to `useManageRelationships.ts`

Add a new method to allow external synchronization:

```tsx
const syncRelationships = useCallback((newRelationships: PersonRelationshipInput[]) => {
  setRelationships(newRelationships.map((rel, index) => ({
    ...rel,
    tempId: `rel-${Date.now()}-${index}`,
    relatedPersonName: (rel as any).relatedPersonName || '',
  })));
}, []);
```

#### 3. Add Loading State in `EditPersonModal.tsx`

Show a loading indicator while relationships are being fetched:

```tsx
{isFetchingRelationships ? (
  <div className="flex items-center justify-center py-4">
    <Spinner size="sm" />
    <span className="ml-2 text-sm text-[#4c8d9a]">Loading relationships...</span>
  </div>
) : (
  // Existing relationships section
)}
```

#### 4. Pass Loading State from `TreeBoardContent.tsx`

Pass the loading state to the modal:

```tsx
<EditPersonModal
  // ... existing props
  isFetchingRelationships={isFetchingRelationships}
/>
```

## Acceptance Criteria

### AC1: Display Existing Relationships
**Given** a person with existing relationships (parents, children, spouse, siblings)
**When** the user clicks on the person node in the tree board
**Then** the Edit Person Modal displays all existing relationships

### AC2: Show Loading State
**Given** a person is selected
**When** the Edit Person Modal opens and relationships are being fetched
**Then** a loading indicator is shown in the relationships section

### AC3: Handle Empty Relationships
**Given** a person with no relationships
**When** the Edit Person Modal opens
**Then** the "No relationships yet" message is displayed

### AC4: Maintain Existing Functionality
**Given** the Edit Person Modal is open
**When** the user adds, edits, or removes relationships
**Then** the functionality works as before

### AC5: Update Person with Relationships
**Given** the Edit Person Modal shows existing relationships
**When** the user modifies relationships and saves
**Then** the changes are persisted correctly

## Technical Requirements

### Frontend Changes

1. **`src/hooks/useManageRelationships.ts`**
   - Add `syncRelationships` method to interface
   - Implement method to update internal state

2. **`src/components/person/EditPersonModal.tsx`**
   - Accept `isFetchingRelationships` prop (optional)
   - Add useEffect to sync relationships
   - Show loading state while fetching

3. **`src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`**
   - Pass `isFetchingRelationships` to EditPersonModal

### Code Quality

- Follow existing code patterns and naming conventions
- Maintain TypeScript type safety
- No breaking changes to existing functionality
- Add unit tests for new functionality

## Test Plan

### Unit Tests

1. `useManageRelationships.test.ts`
   - Test `syncRelationships` method
   - Test that sync replaces existing relationships

2. `EditPersonModal.test.tsx`
   - Test that relationships are displayed when provided
   - Test loading state rendering
   - Test empty state rendering

### Integration Tests

1. Test the full flow from clicking node to seeing relationships
2. Test updating relationships and saving

### Manual Testing Checklist

- [ ] Click on person with relationships - verify they appear
- [ ] Click on person without relationships - verify empty state
- [ ] Add new relationship in modal - verify it works
- [ ] Remove existing relationship in modal - verify it works
- [ ] Edit relationship type - verify it works
- [ ] Save changes - verify persistence

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race condition persists | Medium | Use React Query's isLoading state |
| State sync issues | Low | Add comprehensive tests |
| Performance impact | Low | useEffect is efficient |

## Timeline

- Implementation: 1-2 hours
- Testing: 30 minutes
- Review: 30 minutes

**Total Estimated Effort**: 2-3 hours
