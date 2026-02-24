# Technical Specification: Fix Relationship Issues

## Document Information

- **Created**: 2024-02-24
- **Status**: Draft
- **Priority**: High
- **Related Components**: EditPersonModal, AddPersonModal, RelationshipService, useManageRelationships hook

## Executive Summary

This document details two critical bugs in the Family Tree application's relationship management system:

1. **Issue #1**: Users cannot delete or edit relationship data in the Edit Person Modal
2. **Issue #2**: Relationship type swaps from "parent" to "child" after saving

---

## Issue #1: Cannot Delete/Edit Relationship Data in Edit Person Modal

### Problem Description

When a user opens the Edit Person Modal on the tree board detail page and clicks the edit or delete buttons on existing relationships, the actions do not work as expected.

### Root Cause Analysis

After investigating the code flow, the issue is in the `useManageRelationships` hook and how `editRelationship` interacts with `RelationshipTypeSelector`.

#### Code Flow Analysis

1. **EditPersonModal.tsx** (lines 224-231):
   - The `RelationshipEntry` component calls `onEdit` which triggers `relationshipsManager.editRelationship(rel.tempId)`
   - This correctly sets `editingIndex` and opens `showTypeSelector`

2. **useManageRelationships.ts** (lines 80-86):
   ```typescript
   const editRelationship = useCallback((tempId: string) => {
     const index = relationships.findIndex((rel) => rel.tempId === tempId);
     if (index !== -1) {
       setEditingIndex(index);
       setShowTypeSelector(true);
     }
   }, [relationships]);
   ```

3. **The Bug Location** - `useManageRelationships.ts` (lines 103-118):
   ```typescript
   const selectRelationshipType = useCallback((type: RelationshipType) => {
     if (editingIndex !== null) {
       const tempId = relationships[editingIndex].tempId;
       updateRelationshipType(tempId, type);  // This works correctly
     } else if (pendingPerson) {
       // Add new relationship logic
     }
   }, [editingIndex, pendingPerson, relationships, updateRelationshipType, cancelAddRelationship]);
   ```

   The edit flow actually **works correctly** in the current implementation. The issue is that:

   - **Delete works**: `removeRelationship` correctly filters out the relationship by `tempId`
   - **Edit works**: `editRelationship` sets the editing index and opens the type selector

#### Real Issue: User Experience Problem

The actual issue is more subtle. When editing an existing relationship:

1. The `RelationshipTypeSelector` opens as a full-screen modal overlay
2. It overlays on top of the `EditPersonModal` which is also a full-screen modal
3. **BUT** both have `z-50` z-index, causing potential stacking issues
4. The `RelationshipTypeSelector` is rendered **inside** the `EditPersonModal` DOM structure (lines 314-320), not as a portal

This can cause click events to be captured incorrectly or the selector not to be visible.

### Proposed Solution

#### Option A: Use Portal for Nested Modals

Move `RelationshipTypeSelector` and `PersonSearchSelector` to render via React portal to ensure proper z-index stacking:

```typescript
// In EditPersonModal.tsx
{relationshipsManager.showTypeSelector && createPortal(
  <RelationshipTypeSelector
    onSelect={relationshipsManager.selectRelationshipType}
    onClose={relationshipsManager.closeTypeSelector}
  />,
  document.body
)}
```

#### Option B: Increase Z-Index for Nested Modals

Increase z-index for `RelationshipTypeSelector` to be higher than the parent modal:

```css
/* Change from z-50 to z-[60] or higher */
<div className="fixed inset-0 z-[60] flex items-center justify-center">
```

### Recommended Fix

**Option B** is simpler and requires less code change. Update both:
- `/src/components/person/RelationshipTypeSelector.tsx` (line 26)
- `/src/components/person/PersonSearchSelector.tsx` (similar z-index update)

---

## Issue #2: Relationship Type Swapping (Parent to Child)

### Problem Description

When adding a "parent" relationship for a new node, after saving successfully, the relationship type changes from "parent" to "child".

### Root Cause Analysis

The issue stems from a mismatch between:

1. **UI Relationship Types** (user-facing): `parent`, `child`, `spouse`, `sibling`, etc.
2. **Database Relationship Types** (storage): `father`, `mother`, `child`, `spouse`, `sibling`
3. **API Response Transformation** (display): converts stored data to display format

#### Data Flow Analysis

**Step 1: User Adds New Person with "parent" Relationship**

In `AddPersonModal.tsx`, when user selects "parent" for the relationship type:
- `relationshipType: 'parent'` is stored in the form state

**Step 2: Data Submission via `useAddPersonToTree.ts`** (lines 62-80)

```typescript
const relationshipPromises = relationshipsToCreate.map((rel) => {
  const normalized = normalizeRelationshipType(
    rel.relationshipType,  // 'parent'
    rel.relatedPersonId,   // existing person
    newPerson._id          // new person
  );

  return fetch('/api/relationships', {
    method: 'POST',
    body: JSON.stringify({
      treeId,
      fromPersonId: normalized.fromPersonId,
      toPersonId: normalized.toPersonId,
      type: normalized.type,  // This becomes 'parent' (the DB type)
    }),
  });
});
```

**Step 3: `normalizeRelationshipType` in `relationshipNormalization.ts`** (lines 77-113)

When user selects "parent" (meaning the NEW person is the parent of the EXISTING person):
- `relationshipType = 'parent'`
- `existingPersonId` = the person already in the tree
- `newPersonId` = the newly created person

```typescript
// Line 83-100
if (isParentChildType(relationshipType)) {
  if (isChildType(relationshipType)) {
    // 'child' type logic
    return {
      fromPersonId: existingPersonId,  // parent
      toPersonId: newPersonId,         // child
      type: 'parent',
    };
  }

  // 'parent', 'step-parent', 'adoptive-parent' types
  return {
    fromPersonId: newPersonId,         // new person IS the parent
    toPersonId: existingPersonId,      // existing person IS the child
    type: 'parent',
  };
}
```

This correctly stores:
- `fromPersonId` = new parent's ID
- `toPersonId` = existing child's ID
- `type` = 'parent'

**Step 4: Database Storage via `RelationshipService.ts`** (lines 76-78)

```typescript
if (data.type === 'parent') {
  return this.createParentRelationship(treeId, userId, data.fromPersonId, data.toPersonId);
}
```

This calls `createParentRelationship` (lines 561-578) which:
```typescript
const parent = await this.personRepository.findById(parentId);
const type: RelationshipType = parent.gender === 'male' ? 'father' :
                               parent.gender === 'female' ? 'mother' : 'parent';
```

So the stored type becomes `father` or `mother` based on gender!

**Step 5: Fetching Relationships for Display via `/api/persons/[id]/relationships/route.ts`** (lines 26-51)

```typescript
const relationships = [
  ...familyMembers.parents.map((p) => ({
    _id: `rel-${personId}-${p._id}-parent`,
    relatedPersonId: p._id,
    relationshipType: 'parent' as const,  // Always returns 'parent'
    relatedPersonName: `${p.firstName} ${p.lastName}`,
  })),
  ...familyMembers.children.map((p) => ({
    relationshipType: 'child' as const,   // Always returns 'child'
    ...
  })),
];
```

**The Bug**: The API returns relationship types based on the **queried person's perspective**, not the original user selection context.

### Example Scenario

1. User adds "John" (new person) as "parent" of "Mary" (existing person)
2. System stores: `fromPersonId: John, toPersonId: Mary, type: 'father'`
3. When fetching relationships for **John**:
   - `getFamilyMembers` returns Mary as a **child** of John
   - API transforms this to `relationshipType: 'child'`
4. User sees "child" instead of "parent" in the modal

### The Core Problem

The relationship type returned is from the **perspective of the person being viewed**, not from the **perspective of the relationship direction**.

When viewing John's relationships:
- Mary is displayed as "child" (which is correct from John's perspective)
- But the user originally added John as Mary's "parent"

The issue is in the semantic mismatch between:
- **Creation context**: "John is parent of Mary" (user selected "parent")
- **Display context**: "Mary is child of John" (system shows "child")

### Proposed Solution

#### Option A: Store Original User Selection

Store the original relationship type the user selected alongside the normalized database type:

1. Add `originalType` or `userSelectedType` field to the relationship schema
2. When creating relationships, store both the normalized type and the user's selection
3. When displaying, use the original type

**Pros**: Preserves user intent
**Cons**: Requires schema change, migration, and API updates

#### Option B: Transform Relationship Type Based on Direction

When displaying relationships, calculate the type based on the relationship direction:

```typescript
// In /api/persons/[id]/relationships/route.ts
const relationships = [
  ...familyMembers.parents.map((p) => {
    // Determine if the current person is the parent or child in this relationship
    const relationship = // fetch actual relationship record
    const isFromPerson = relationship.fromPersonId === personId;
    return {
      relatedPersonId: p._id,
      relationshipType: isFromPerson ? 'child' : 'parent',  // Reverse if current person is "from"
      relatedPersonName: `${p.firstName} ${p.lastName}`,
    };
  }),
];
```

**Pros**: No schema changes needed
**Cons**: More complex logic, potential for confusion

#### Option C: Show Bidirectional Relationship Labels (Recommended)

Display the relationship with clear context showing both perspectives:

```
Mary (daughter)     instead of just     Mary (child)
John (father)       instead of just     John (parent)
```

This requires updating `RelationshipEntry.tsx` to show gender-aware labels:

```typescript
const getRelationshipLabel = (type: RelationshipType, relatedPersonGender?: string): string => {
  switch (type) {
    case 'parent':
      return relatedPersonGender === 'male' ? 'Father' :
             relatedPersonGender === 'female' ? 'Mother' : 'Parent';
    case 'child':
      return relatedPersonGender === 'male' ? 'Son' :
             relatedPersonGender === 'female' ? 'Daughter' : 'Child';
    // ... other cases
  }
};
```

**Pros**: Clearer user experience, no confusion about direction
**Cons**: Requires fetching related person's gender

#### Option D: Store Relationship from Both Perspectives

When creating a parent-child relationship, store it from the child's perspective (pointing to parent) to match user's mental model:

```typescript
// Current: parent -> child (fromParentId, toChildId)
// Proposed: child -> parent (fromChildId, toParentId)

// When user says "John is parent of Mary":
// Store: fromPersonId: Mary, toPersonId: John, type: 'father'
```

**Pros**: Matches user mental model
**Cons**: Major breaking change, affects entire system

### Recommended Fix

**Short-term (Option C)**: Update the display to show clearer relationship labels:
1. Modify `/api/persons/[id]/relationships/route.ts` to include related person's gender
2. Update `RelationshipEntry.tsx` to use gender-aware labels
3. This doesn't change the underlying data but improves UX clarity

**Long-term (Option A)**: Consider storing original user selection for audit and UI restoration purposes.

---

## Implementation Plan

### Phase 1: Fix Edit/Delete Modal Issue (High Priority)

1. **Update z-index for nested modals**
   - File: `/src/components/person/RelationshipTypeSelector.tsx`
   - Change: `z-50` to `z-[60]`
   - File: `/src/components/person/PersonSearchSelector.tsx`
   - Change: `z-50` to `z-[60]`

2. **Update EditPersonModal to close nested modals properly**
   - Ensure `closeTypeSelector` and `closePersonSelector` are called correctly

### Phase 2: Fix Relationship Type Display (High Priority)

1. **Update API to include related person's gender**
   - File: `/src/app/api/persons/[id]/relationships/route.ts`
   - Add `relatedPersonGender` to response

2. **Update RelationshipEntry to show gender-aware labels**
   - File: `/src/components/person/RelationshipEntry.tsx`
   - Add `relatedPersonGender` prop
   - Update label generation logic

3. **Update RelationshipEntry to show bidirectional context**
   - Show "Father of X" vs "Son of X" based on direction
   - Or show "John (as your father)" for clarity

### Phase 3: Update Relationship Labels (Medium Priority)

1. **Create relationship label utility**
   - File: `/src/utils/relationshipLabels.ts`
   - Functions for getting gender-aware, direction-aware labels

2. **Update all relationship display components**
   - RelationshipEntry.tsx
   - RelationshipsTab.tsx
   - PersonOverviewTab.tsx

---

## Acceptance Criteria

### Issue #1: Edit/Delete Relationship

- [ ] User can click edit button on a relationship entry
- [ ] Relationship type selector modal appears correctly
- [ ] User can select a new relationship type
- [ ] Relationship updates in the list immediately
- [ ] User can click delete button on a relationship entry
- [ ] Relationship is removed from the list immediately
- [ ] Changes persist after saving the person

### Issue #2: Relationship Type Display

- [ ] When adding "parent" relationship, it displays as parent (not child)
- [ ] When adding "child" relationship, it displays as child (not parent)
- [ ] Relationship labels are gender-aware (father/mother, son/daughter)
- [ ] Clear visual indication of relationship direction
- [ ] No confusion about who is the parent and who is the child

---

## Testing Requirements

### Unit Tests

1. **useManageRelationships hook tests**
   - Test `editRelationship` sets correct state
   - Test `removeRelationship` removes correct item
   - Test `selectRelationshipType` updates existing relationship

2. **relationshipNormalization tests**
   - Test all relationship type normalizations
   - Test direction handling for parent/child

### Integration Tests

1. **Edit Person Modal relationship editing flow**
   - Open modal, edit relationship, verify update
   - Open modal, delete relationship, verify removal

2. **Add Person Modal relationship creation flow**
   - Add person with parent relationship
   - Verify relationship displays correctly

### E2E Tests

1. **Full relationship CRUD flow**
   - Create person with relationship
   - Edit relationship type
   - Delete relationship
   - Verify tree visualization updates

---

## Files Affected

| File | Changes |
|------|---------|
| `/src/components/person/RelationshipTypeSelector.tsx` | Increase z-index |
| `/src/components/person/PersonSearchSelector.tsx` | Increase z-index |
| `/src/components/person/RelationshipEntry.tsx` | Gender-aware labels |
| `/src/app/api/persons/[id]/relationships/route.ts` | Include gender in response |
| `/src/hooks/useManageRelationships.ts` | Verify edit/delete logic |
| `/src/utils/relationshipLabels.ts` | New utility file |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Modal stacking issues persist | Low | Medium | Use React portal if z-index insufficient |
| Relationship display still confusing | Medium | High | User testing, consider Option A (store original type) |
| Breaking changes to API | Low | High | Version the API, maintain backward compatibility |
| Gender-aware labels incorrect | Low | Medium | Comprehensive unit tests |

---

## Appendix: Key Code Locations

### Edit Person Modal
- `/src/components/person/EditPersonModal.tsx`
- Lines 195-251: Relationships section
- Lines 224-231: RelationshipEntry rendering
- Lines 304-320: Nested selectors

### Relationship Management Hook
- `/src/hooks/useManageRelationships.ts`
- Lines 76-78: removeRelationship
- Lines 80-86: editRelationship
- Lines 93-101: updateRelationshipType
- Lines 103-118: selectRelationshipType

### Relationship Normalization
- `/src/utils/relationshipNormalization.ts`
- Lines 77-113: normalizeRelationshipType function

### API Routes
- `/src/app/api/persons/[id]/relationships/route.ts`
- `/src/app/api/relationships/route.ts`

### Relationship Service
- `/src/services/relationship/RelationshipService.ts`
- Lines 561-578: createParentRelationship
- Lines 215-252: getFamilyMembers
