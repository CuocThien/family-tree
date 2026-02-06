# Technical Specification: Tree Board Edit Person Modal Integration

## Document Information
- **Created:** 2026-02-06
- **Status:** Draft
- **Priority:** High
- **Author:** PM Agent (Claude)

## 1. Feature Overview

### Summary
Enable users to edit person information directly from the tree board detail page by clicking on person nodes. After successful edit, the tree board should automatically refresh to display updated person data.

### Business Value
- Improves user experience by allowing quick edits without navigating away from the tree board
- Maintains visual context while editing person information
- Reduces navigation steps for common editing tasks

### User Story
As a family tree editor,
I want to click on a person node in the tree board to edit their information,
So that I can quickly update person details without losing my place in the tree visualization.

## 2. Current Behavior Analysis

### Existing Implementation

**Tree Board Page** (`src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`)
- Uses `useTreeData` hook to fetch tree data (persons, relationships, tree info)
- Fetches data on mount with query key `['tree-data', treeId]`
- Caches data for 5 minutes (`staleTime: 5 * 60 * 1000`)
- Currently has `handleNodeClick` that only selects person in store (line 54-56)
- Has `handleNodeDoubleClick` that navigates to person profile page (line 58-61)
- Does NOT have EditPersonModal integration

**EditPersonModal** (`src/components/person/EditPersonModal.tsx`)
- Fully functional modal component for editing person information
- Accepts `onUpdate` callback prop for handling updates
- Form validation with react-hook-form and zod
- Supports relationship management
- Already used in PersonProfileContent

**Update Person Hook** (`src/hooks/usePerson.ts`)
- `useUpdatePerson` mutation exists (lines 76-122)
- Includes optimistic updates for better UX
- Invalidates queries on success:
  - `personKeys.detail(person._id)` - person detail
  - `personKeys.byTree(person.treeId)` - tree's person list
- Uses `onMutate`, `onError`, and `onSettled` for cache management

**Tree Board Store** (`src/store/treeBoardStore.ts`)
- Has `updatePerson` action (line 158-164)
- Stores persons in a Map for efficient updates
- Already set up to handle person updates

### Current Data Flow

```
User clicks node → selectPerson() in store → Node highlights
User double-clicks node → Navigate to person profile page → User can edit there
```

### Problem
1. No direct way to edit person from tree board
2. Users must navigate to person profile page to edit
3. After edit, tree board doesn't automatically refresh

## 3. Requirement Clarification

### Functional Requirements

**FR1: Open Edit Modal**
- When user clicks (single click) on a person node in the tree board
- The EditPersonModal should open with that person's data pre-populated

**FR2: Edit Person**
- User can edit all person fields (name, gender, dates, biography, etc.)
- User can manage relationships
- Form validation must pass before submission

**FR3: Refresh After Update**
- After successful edit submission:
  - Modal should close
  - Tree board should automatically refresh with updated data
  - Person node should reflect changes immediately

**FR4: Handle Errors**
- If edit fails, modal should remain open with error message
- Tree board should NOT refresh on error
- User can retry after fixing validation errors

### Non-Functional Requirements

**NFR1: Performance**
- Data refresh should happen immediately after successful update
- No full page reload required
- Optimistic updates preferred for better UX

**NFR2: Consistency**
- Same EditPersonModal component should be reused
- Same validation logic and error handling
- Consistent with existing edit flow in PersonProfileContent

**NFR3: Accessibility**
- Keyboard navigation should work
- Modal focus management
- Screen reader announcements

## 4. Technical Design

### Architecture Approach

**Decision: Single Click for Edit Modal**

Current implementation has:
- Single click: Select person (highlight)
- Double click: Navigate to profile

New implementation will change to:
- Single click: Open EditPersonModal
- Remove selection functionality (or move to a different interaction)

**Rationale:**
1. Edit is the most common action on a person node
2. Selection is less useful in the tree board context
3. Simpler interaction model for users
4. Consistent with the requirement "open EditPersonModal when clicking to a person node"

### Data Flow

```
User clicks person node
  ↓
handleNodeClick(event, node)
  ↓
Set selectedPersonId in store (for modal)
  ↓
Open EditPersonModal with person data
  ↓
User edits and submits
  ↓
useUpdatePerson mutation
  ↓
 onSuccess:
  - Update React Query cache (optimistic + server)
  - Invalidate tree-data query
  ↓
TreeBoardContent re-renders with fresh data
  ↓
Person node shows updated information
```

### Component Changes

#### 1. Modify TreeBoardContent.tsx

**State to Add:**
```typescript
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
```

**Handler to Update:**
```typescript
const handleNodeClick: NodeMouseHandler = useCallback((event, node: Node) => {
  // Open edit modal instead of just selecting
  setIsEditModalOpen(true);
}, []);
```

**Render EditPersonModal:**
```typescript
{isEditModalOpen && selectedPerson && (
  <EditPersonModal
    isOpen={isEditModalOpen}
    person={selectedPerson}
    treeId={treeId}
    onClose={() => setIsEditModalOpen(false)}
    onUpdate={async (data) => {
      // Use the existing useUpdatePerson hook
      await updatePerson({ id: selectedPerson._id, data: mapFormDataToDto(data) });
      setIsEditModalOpen(false);
      return { success: true };
    }}
  />
)}
```

#### 2. Update Hook Usage

Import and use the existing `useUpdatePerson` hook:
```typescript
const updatePerson = useUpdatePerson();
```

**Note:** The `useUpdatePerson` hook in `src/hooks/usePerson.ts` (lines 76-122) already handles:
- Query invalidation on success
- Optimistic updates
- Error handling
- Cache management

#### 3. Query Key Alignment

The `useTreeData` hook uses query key `['tree-data', treeId]`.

The `useUpdatePerson` hook invalidates:
- `personKeys.detail(person._id)` - `['persons', person._id]`
- `personKeys.byTree(person.treeId)` - `['persons', 'tree', treeId]`

**Issue:** These don't match the `['tree-data', treeId]` key used by `useTreeData`.

**Solution:** Update `useUpdatePerson` to also invalidate the tree-data query:
```typescript
onSettled: (person) => {
  if (person) {
    queryClient.invalidateQueries({ queryKey: personKeys.detail(person._id) });
    queryClient.invalidateQueries({ queryKey: personKeys.byTree(person.treeId) });
    // Add this line:
    queryClient.invalidateQueries({ queryKey: ['tree-data', person.treeId] });
  }
},
```

### Alternative Approach: Zustand Store Update

Instead of relying solely on React Query invalidation, we could update the Zustand store directly:

```typescript
onUpdate={async (data) => {
  const result = await updatePerson.mutateAsync({
    id: selectedPerson._id,
    data: mapFormDataToDto(data)
  });

  // Update Zustand store immediately
  useTreeBoardStore.getState().updatePerson(selectedPerson._id, updates);

  setIsEditModalOpen(false);
  return { success: true };
}}
```

**Pros:**
- Instant visual feedback
- No loading state
- Works offline until sync

**Cons:**
- More complex state management
- Potential sync issues between store and server
- Requires careful error handling

**Recommendation:** Use the React Query approach (query invalidation) as it's simpler and follows existing patterns.

## 5. Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` | Modify | Add EditPersonModal integration, update click handler |
| `src/hooks/usePerson.ts` | Modify | Add tree-data query invalidation to useUpdatePerson |
| `src/components/tree/PersonNode.tsx` | No Change | Already has onClick prop, no changes needed |

**No new files to create**

## 6. Implementation Details

### Step 1: Update TreeBoardContent.tsx

Add imports:
```typescript
import { EditPersonModal } from '@/components/person/EditPersonModal';
import { useUpdatePerson } from '@/hooks/usePerson';
```

Add state:
```typescript
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
```

Add hook:
```typescript
const updatePerson = useUpdatePerson();
```

Update click handler:
```typescript
const handleNodeClick: NodeMouseHandler = useCallback((event, node: Node) => {
  // Select person in store (for potential future use)
  useTreeBoardStore.getState().selectPerson(node.id);
  // Open edit modal
  setIsEditModalOpen(true);
}, []);
```

Add selector for current person:
```typescript
const selectedPerson = useTreeBoardStore((state) =>
  state.selectedPersonId ? state.persons.get(state.selectedPersonId) : null
);
```

Add modal rendering before closing div:
```typescript
{/* Edit Person Modal */}
{selectedPerson && (
  <EditPersonModal
    isOpen={isEditModalOpen}
    person={selectedPerson}
    treeId={treeId}
    onClose={() => setIsEditModalOpen(false)}
    onUpdate={async (data) => {
      try {
        await updatePerson.mutateAsync({
          id: selectedPerson._id,
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            suffix: data.suffix,
            gender: data.gender,
            dateOfBirth: data.birthDate ? new Date(data.birthDate) : undefined,
            dateOfDeath: data.deathDate ? new Date(data.deathDate) : undefined,
            birthPlace: data.birthPlace,
            deathPlace: data.deathPlace,
            biography: data.biography,
            occupation: data.occupation,
            nationality: data.nationality,
          },
        });
        setIsEditModalOpen(false);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update person',
        };
      }
    }}
  />
)}
```

### Step 2: Update usePerson.ts

Modify the `useUpdatePerson` hook's `onSettled` callback:

```typescript
onSettled: (person) => {
  if (person) {
    queryClient.invalidateQueries({ queryKey: personKeys.detail(person._id) });
    queryClient.invalidateQueries({ queryKey: personKeys.byTree(person.treeId) });
    // Invalidate tree board data query
    queryClient.invalidateQueries({ queryKey: ['tree-data', person.treeId] });
  }
},
```

### Step 3: Update PersonNode.tsx (Optional)

Consider adding a visual indicator that nodes are clickable:
- Already has `cursor-pointer` class
- Hover effects already present
- No changes needed unless we want to add an edit icon on hover

## 7. Edge Cases and Considerations

### EC1: Person Not Found in Store
**Scenario:** User clicks node, but person not in Zustand store
**Handling:** Modal won't render (null check), show error to user

### EC2: Concurrent Edits
**Scenario:** User edits person while another user also edits same person
**Handling:** Last write wins (server-side). Optimistic update may be overwritten.

### EC3: Edit During Loading
**Scenario:** User clicks node while data is loading
**Handling:** Disable click interactions during loading state

### EC4: Relationship Changes Affect Tree Structure
**Scenario:** User edits relationships that change the tree layout (e.g., changes parent)
**Handling:** React Query refetch will recalculate layout with updated data

### EC5: Network Error During Update
**Scenario:** User submits edit, but network fails
**Handling:** useUpdatePerson has error handling, modal stays open, shows error message

### EC6: Validation Errors
**Scenario:** User submits invalid data (e.g., death date before birth date)
**Handling:** Form validation prevents submission, modal stays open with validation errors

### EC7: Large Number of Persons
**Scenario:** Tree has 100+ persons
**Handling:** Query invalidation only refetches, doesn't reload full page. Performance should be acceptable.

### EC8: Rapid Clicking
**Scenario:** User rapidly clicks multiple nodes
**Handling:** Modal state changes, only last selected person opens modal. No state corruption.

### EC9: Mobile Touch
**Scenario:** User taps on touch device
**Handling:** onClick handler works on touch. Ensure touch targets are large enough (already min 120px).

### EC10: Keyboard Navigation
**Scenario:** User navigates with keyboard
**Handling:** PersonNode already supports Enter/Space keys. Should open modal.

## 8. SOLID Compliance

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **Single Responsibility** | ✅ Compliant | TreeBoardContent manages board state + modal state. EditPersonModal manages form. useUpdatePerson manages API call. |
| **Open/Closed** | ✅ Compliant | Adding modal integration extends behavior without modifying PersonNode or EditPersonModal |
| **Liskov Substitution** | ✅ Compliant | No inheritance involved |
| **Interface Segregation** | ✅ Compliant | EditPersonModal interface is focused. No unnecessary props required |
| **Dependency Inversion** | ✅ Compliant | TreeBoardContent depends on EditPersonModal abstraction (props), not internal implementation |

### Code Quality Standards
- ✅ Reuses existing components (EditPersonModal)
- ✅ Reuses existing hooks (useUpdatePerson)
- ✅ Follows existing patterns (similar to PersonProfileContent)
- ✅ Type-safe with TypeScript
- ✅ No new dependencies required
- ✅ Maintains separation of concerns

## 9. Testing Requirements

### Unit Tests

**Test: TreeBoardContent integration**
- `should open edit modal when node is clicked`
- `should close modal after successful edit`
- `should keep modal open after failed edit`
- `should pass correct person data to modal`

**Test: useUpdatePerson hook**
- `should invalidate tree-data query on success`
- `should not invalidate tree-data query on error`

### Integration Tests

**Test: Edit flow**
```
Given: Tree board with person "John Doe"
When: User clicks on "John Doe" node
And: User changes first name to "Jane"
And: User submits form
Then: Modal should close
And: Tree should refetch data
And: Node should show "Jane Doe"
```

**Test: Error handling**
```
Given: Tree board with person
When: User clicks node and submits invalid data
Then: Modal should remain open
And: Error message should display
And: Tree should not refetch
```

### E2E Tests

**Scenario 1: Successful Edit**
```
1. Navigate to tree board page
2. Wait for tree to load
3. Click on a person node
4. Verify EditPersonModal opens
5. Update person's first name
6. Click "Save Changes"
7. Verify modal closes
8. Verify node shows updated name
9. Verify toast notification appears
```

**Scenario 2: Validation Error**
```
1. Navigate to tree board page
2. Click on a person node
3. Clear first name field (required)
4. Click "Save Changes"
5. Verify modal stays open
6. Verify validation error shows
7. Verify tree board unchanged
```

**Scenario 3: Network Error**
```
1. Mock network failure
2. Navigate to tree board page
3. Click on a person node
4. Make valid edit
5. Click "Save Changes"
6. Verify modal stays open
7. Verify error message displays
```

## 10. Rollback Plan

If issues arise after deployment:

**Option 1: Quick Revert**
1. Revert changes to `TreeBoardContent.tsx`
2. Revert changes to `usePerson.ts`
3. Tree board returns to current behavior

**Option 2: Feature Flag**
1. Add feature flag `ENABLE_TREE_BOARD_EDIT`
2. Conditionally render EditPersonModal based on flag
3. Disable flag if issues occur

**Option 3: Fallback Behavior**
1. If EditPersonModal integration fails, double-click to profile page still works
2. Users can still edit person via profile page
3. No critical functionality lost

## 11. Success Metrics

- **User Engagement:** Track number of edits made from tree board vs profile page
- **Error Rate:** Track edit failure rate from tree board (target: < 2%)
- **Time to Edit:** Measure average time from click to successful edit
- **User Feedback:** Collect feedback on new interaction model

## 12. Open Questions

1. **Interaction Model:** Should single click open edit modal, or should we keep selection and use a different trigger (e.g., edit button, double-click)?
   - **Recommendation:** Single click for edit modal as per requirement

2. **Selection State:** Should we keep the selection functionality in the store?
   - **Recommendation:** Keep it for potential future use (e.g., showing person details in sidebar)

3. **Loading State:** Should we show loading indicator on the person node during update?
   - **Recommendation:** Yes, add visual feedback during mutation

4. **Undo/Redo:** Should we support undo after edit?
   - **Recommendation:** Out of scope for this feature

5. **Relationship Editing:** Should relationship updates trigger immediate tree re-layout?
   - **Recommendation:** Yes, query invalidation will handle this naturally

## 13. Future Enhancements

Out of scope for this requirement, but potential future improvements:

1. **Edit Mode Toggle:** Allow users to switch between "view mode" (click to select) and "edit mode" (click to edit)
2. **Inline Editing:** Allow quick edits (e.g., name) directly on the node without opening modal
3. **Bulk Edit:** Select multiple persons and edit them together
4. **Edit History:** Track and view edit history for audit trail
5. **Conflict Resolution:** Handle concurrent edits with merge conflict UI
6. **Quick Actions Menu:** Right-click context menu with options: Edit, View Profile, Delete, Add Relationship
7. **Keyboard Shortcuts:** Press 'E' to edit selected person, 'Delete' to remove, etc.
