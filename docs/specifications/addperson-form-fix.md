# Specification: AddPerson Form Fix

## Requirement Summary

Fix the AddPerson form that automatically shows after creating a new tree (or opening a tree with no members) and cannot be closed.

## Current Behavior

1. When a user creates a new tree or opens a tree with no members, the AddPerson modal shows automatically
2. The modal cannot be closed by clicking the backdrop or the Cancel button
3. The `isOpen` prop is passed to `AddPersonModal` but is not used to conditionally render the modal

## Root Cause Analysis

### Issue 1: Missing Conditional Rendering
**File:** `src/components/person/AddPersonModal.tsx`

The modal component accepts an `isOpen` prop but never uses it to conditionally render. The modal UI is always visible once the component mounts.

```tsx
// Current code (line 115+):
return (
  <div className="fixed inset-0 z-50 flex items-center justify-end">
    {/* Modal always renders regardless of isOpen */}
  </div>
);
```

### Issue 2: Auto-Open on Empty Tree
**File:** `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`

When a tree has no members, the empty state is shown with the AddPersonModal rendered. While it doesn't auto-open on initial render (state is `false`), once opened, it cannot be closed due to Issue 1.

## Expected Behavior

1. **No auto-open**: The AddPerson form should NOT show automatically when creating/opening a tree
2. **Manual trigger**: The form should ONLY show when user clicks the "Add Person" or "Add First Person" button
3. **Closable**: The form must be dismissable by:
   - Clicking the backdrop
   - Clicking the Cancel button
   - Successfully adding a person

## Acceptance Criteria

- [ ] AddPersonModal only renders when `isOpen={true}`
- [ ] Modal can be closed by clicking backdrop
- [ ] Modal can be closed by clicking Cancel button
- [ ] Modal closes after successfully adding a person
- [ ] Modal does NOT auto-open when viewing an empty tree
- [ ] Modal only opens when user explicitly clicks an "Add Person" button

## Technical Approach

### Fix 1: Add Conditional Rendering to AddPersonModal
**File:** `src/components/person/AddPersonModal.tsx`

Add early return or conditional wrapper:

```tsx
// Option A: Early return
if (!isOpen) return null;

// Option B: Conditional wrapper
return (
  <>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        {/* Modal content */}
      </div>
    )}
  </>
);
```

**Recommendation:** Use early return (`if (!isOpen) return null;`) for cleaner code and better performance (avoids rendering child components when closed).

### Fix 2: Verify No Auto-Open Logic
**File:** `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`

Ensure the modal state is initialized to `false` and not set to `true` anywhere in the empty state handling:

```tsx
// Current (correct):
const [isAddModalOpen, setIsAddModalOpen] = useState(false);

// Verify there's no useEffect or logic that sets it to true automatically
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/person/AddPersonModal.tsx` | Add conditional rendering based on `isOpen` prop |

## Testing Strategy

### Manual Testing
1. Create a new tree → verify modal does NOT auto-open
2. Open an existing empty tree → verify modal does NOT auto-open
3. Click "Add First Person" → verify modal opens
4. Click backdrop → verify modal closes
5. Click "Add First Person" again → verify modal opens
6. Click "Cancel" button → verify modal closes
7. Add a person successfully → verify modal closes

### Regression Testing
- Verify normal flow (tree with members) still works
- Verify FloatingControls "Quick Add" button still works
- Verify all form validation still works

## Implementation Notes

- The fix is straightforward: add conditional rendering
- No state management changes needed
- No API changes needed
- This is a UI bug fix, not a feature change
