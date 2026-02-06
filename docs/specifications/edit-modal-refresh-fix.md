# Fix: Edit Person Modal Doesn't Refresh When Switching Between Persons

## Issue Summary

When clicking on different person nodes to open the edit modal, the modal doesn't refresh with the new person's data and relationships. The first person's data persists even when selecting a different person.

## Root Cause Analysis

### Bug #1: Missing `key` Prop on EditPersonModal (CRITICAL - PRIMARY CAUSE)

**Location:** `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx:158`

The EditPersonModal component does NOT have a `key` prop. When React re-renders, it sees the same component instance and doesn't create a new one. This causes:
- The form state (from `useForm`) to persist with old values
- Internal component state (`selectedGender`, `showRelationshipsSection`, etc.) to not reset
- React Hook Form's `defaultValues` to only be used on initial mount, not on re-render

### Bug #2: No `useEffect` to Reset Form When `person` Changes

**Location:** `src/components/person/EditPersonModal.tsx:47-72`

There is NO `useEffect` that watches the `person` prop and calls `reset()` when it changes. Without this, the form will retain the values from the first person clicked.

### Bug #3: Internal State Not Resetting on Person Change

**Location:** `src/components/person/EditPersonModal.tsx:29-34`

State variables like `selectedGender` and `showRelationshipsSection` are initialized once when the component mounts. When switching to a different person, these keep the old values.

### Bug #4: useManageRelationships Doesn't Update When `initialRelationships` Changes

**Location:** `src/hooks/useManageRelationships.ts:40-46`

The `relationships` state is initialized using a function that reads `initialRelationships`, but there's no `useEffect` to update it when the prop changes.

## Data Flow Breakdown

**What happens when you click Person A then Person B:**

1. **Click Person A:**
   - `selectPerson('person-a')` called
   - `selectedPerson` becomes Person A
   - `setIsEditModalOpen(true)`
   - `usePersonRelationships` fetches Person A's relationships
   - `EditPersonModal` mounts with Person A's data
   - ✅ Modal shows Person A's data correctly

2. **Close modal:**
   - `setIsEditModalOpen(false)`
   - Component renders `null`
   - ❌ Component instance REMAINS in React's virtual DOM tree

3. **Click Person B:**
   - `selectPerson('person-b')` called
   - `selectedPerson` becomes Person B
   - `usePersonRelationships` fetches Person B's relationships ✅
   - `EditPersonModal` re-renders with Person B's data as props
   - ❌ `useForm` KEEPS old form state (no reset)
   - ❌ `selectedGender` state still has Person A's value
   - ❌ `useManageRelationships` KEEPS Person A's relationships
   - ❌ Modal shows Person B's name but Person A's data/state internally

## Acceptance Criteria

1. Click on Person A → edit modal opens with Person A's data and relationships
2. Close modal, click on Person B → edit modal opens with Person B's data and relationships
3. All form fields (name, gender, dates, etc.) should reflect the currently selected person
4. Relationships list should show the correct relationships for the currently selected person
5. Gender selection should match the currently selected person's gender
6. Relationships section should auto-expand if the person has relationships

## Implementation Plan

### Fix #1 (CRITICAL): Add `key` prop to EditPersonModal

**File:** `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx:158`

**Change from:**
```typescript
{selectedPerson && (
  <EditPersonModal
    isOpen={isEditModalOpen}
    person={selectedPerson}
```

**To:**
```typescript
{selectedPerson && (
  <EditPersonModal
    key={selectedPerson._id}
    isOpen={isEditModalOpen}
    person={selectedPerson}
```

**Why this fixes it:** When `key` changes, React unmounts the old component and mounts a new one, resetting all state.

### Fix #2 (RECOMMENDED): Add useEffect to Reset Form

**File:** `src/components/person/EditPersonModal.tsx` (after line 72)

**Add:**
```typescript
// Reset form and state when person changes
useEffect(() => {
  if (isOpen && person) {
    reset({
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName || '',
      suffix: person.suffix || '',
      gender: (person.gender as GenderType) || 'male',
      birthDate: person.dateOfBirth ? person.dateOfBirth.toString().split('T')[0] : '',
      deathDate: person.dateOfDeath ? person.dateOfDeath.toString().split('T')[0] : '',
      birthPlace: person.birthPlace || '',
      deathPlace: person.deathPlace || '',
      isDeceased: !!person.dateOfDeath,
      biography: person.biography || '',
      occupation: person.occupation || '',
      nationality: person.nationality || '',
    });
    setSelectedGender((person.gender as GenderType) || 'male');
    setShowRelationshipsSection(existingRelationships.length > 0);
  }
}, [person, isOpen, reset, existingRelationships]);
```

### Fix #3 (OPTIONAL): Update useManageRelationships to Handle Prop Changes

**File:** `src/hooks/useManageRelationships.ts` (after line 46)

**Add:**
```typescript
// Update relationships when initialRelationships prop changes
useEffect(() => {
  setRelationships(
    initialRelationships.map((rel, index) => ({
      ...rel,
      tempId: `rel-${Date.now()}-${index}`,
      relatedPersonName: (rel as any).relatedPersonName || '',
    }))
  );
}, [initialRelationships]);
```

**Note:** This is only needed if you don't use Fix #1. With Fix #1, the hook re-runs on mount anyway.

## Test Cases

### Unit Tests

1. **EditPersonModal resets when person prop changes**
   - Render with Person A, verify form shows Person A's data
   - Re-render with Person B, verify form shows Person B's data

2. **Gender state updates when person changes**
   - Render with male person, verify male is selected
   - Re-render with female person, verify female is selected

3. **Relationships state updates when prop changes**
   - Render with Person A's relationships, verify they're displayed
   - Re-render with Person B's relationships, verify they're displayed

### Integration Tests

1. **End-to-end: Click different nodes in tree**
   - Click Person A node
   - Verify edit modal shows Person A's data
   - Close modal
   - Click Person B node
   - Verify edit modal shows Person B's data (not Person A's)

2. **Verify relationships update correctly**
   - Click Person with 2 relationships
   - Verify 2 relationships shown
   - Close modal
   - Click Person with 0 relationships
   - Verify no relationships shown

## Files to Modify

1. `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` - Add `key` prop
2. `src/components/person/EditPersonModal.tsx` - Add `useEffect` to reset form
3. `src/hooks/useManageRelationships.ts` - Add `useEffect` to update relationships (optional)

## Verification Steps

1. Click on Person A in the tree
2. Verify edit modal opens with Person A's name, gender, dates, etc.
3. Verify Person A's relationships are listed
4. Close the modal
5. Click on Person B in the tree
6. Verify edit modal opens with Person B's name, gender, dates, etc.
7. Verify Person B's relationships are listed
8. Repeat for several different persons

## Architecture Compliance

- ✅ Single Responsibility: Only fixes state refresh bug
- ✅ Open/Closed: No modifications to existing logic flow
- ✅ Liskov Substitution: N/A
- ✅ Interface Segregation: Uses existing interfaces
- ✅ Dependency Injection: Uses existing prop-based injection
