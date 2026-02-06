# Fix: Relationship Display in Edit Person Modal

## Issue Summary

When opening the edit person modal, the API `GET /api/persons/{id}/relationships` correctly returns relationship data including `relatedPersonName`, but the relationships are not displayed in the modal.

## Root Cause Analysis

### Bug #1: Missing `relatedPersonName` in Data Transformation (CRITICAL)

**Location:** `src/components/person/EditPersonModal.tsx:37-40`

```typescript
const initialRelationships = existingRelationships.map((rel) => ({
  relatedPersonId: rel.relatedPersonId,
  relationshipType: rel.relationshipType as any,
  // ❌ BUG: relatedPersonName is NOT extracted here!
}));
```

The `existingRelationships` prop contains `relatedPersonName: "asdf asdf"`, but the `initialRelationships` array does NOT include it.

### Bug #2: Relationships Section Hidden by Default (UX Issue)

**Location:** `src/components/person/EditPersonModal.tsx:34`

```typescript
const [showRelationshipsSection, setShowRelationshipsSection] = useState(false);
```

The relationships section starts hidden. Users must click "Manage" to see relationships, but even when visible, the names show as "Unknown" due to Bug #1.

### Bug #3: Fallback to "Unknown" in Display

**Location:** `src/components/person/EditPersonModal.tsx:204`

```typescript
<RelationshipEntry
  relatedPersonName={rel.relatedPersonName || 'Unknown'}
  ...
/>
```

Since `relatedPersonName` is empty due to Bug #1, it displays "Unknown".

## Data Flow

1. **API Response** (Working correctly):
   ```json
   {
     "data": [{
       "_id": "rel-6982c139942738c9bc6b2704-6982c139942738c9bc6b2704-spouse",
       "relatedPersonId": "6982c139942738c9bc6b2704",
       "relationshipType": "spouse",
       "relatedPersonName": "asdf asdf"
     }]
   }
   ```

2. **Data Fetch** (`TreeBoardContent.tsx:44-47`):
   ```typescript
   const { data: personRelationships = [], isLoading: isFetchingRelationships } = usePersonRelationships({
     personId: selectedPerson?._id || '',
     enabled: isEditModalOpen && !!selectedPerson?._id,
   });
   ```
   ✅ Data includes `relatedPersonName`

3. **Prop Passing** (`TreeBoardContent.tsx:163`):
   ```typescript
   <EditPersonModal
     existingRelationships={personRelationships}
     ...
   />
   ```
   ✅ Data includes `relatedPersonName`

4. **Data Transformation** (`EditPersonModal.tsx:37-40`):
   ❌ `relatedPersonName` is LOST

5. **State Initialization** (`useManageRelationships.ts:40-46`):
   ```typescript
   relatedPersonName: (rel as any).relatedPersonName || ''
   ```
   ❌ Results in empty string

6. **UI Display** (`EditPersonModal.tsx:204`):
   ❌ Shows "Unknown" instead of actual name

## Acceptance Criteria

1. When editing a person with existing relationships, the relationships should be visible in the modal
2. The `relatedPersonName` should be displayed correctly (not "Unknown")
3. When relationships exist, the section should be automatically expanded
4. The relationship type should be displayed correctly
5. User can add/edit/remove relationships as expected

## Implementation Plan

### Fix 1: Preserve `relatedPersonName` in EditPersonModal

**File:** `src/components/person/EditPersonModal.tsx`

**Change line 37-40 from:**
```typescript
const initialRelationships = existingRelationships.map((rel) => ({
  relatedPersonId: rel.relatedPersonId,
  relationshipType: rel.relationshipType as any,
}));
```

**To:**
```typescript
const initialRelationships = existingRelationships.map((rel) => ({
  relatedPersonId: rel.relatedPersonId,
  relationshipType: rel.relationshipType as any,
  relatedPersonName: rel.relatedPersonName,
}));
```

### Fix 2: Auto-expand Relationships Section When Data Exists

**File:** `src/components/person/EditPersonModal.tsx`

**Change line 34 from:**
```typescript
const [showRelationshipsSection, setShowRelationshipsSection] = useState(false);
```

**To:**
```typescript
const [showRelationshipsSection, setShowRelationshipsSection] = useState(existingRelationships.length > 0);
```

### Fix 3: Update Type Definition

**File:** `src/components/person/EditPersonModal.tsx`

The `initialRelationships` type needs to include `relatedPersonName`. Update the implicit type to include this field.

## Test Cases

### Unit Tests

1. **EditPersonModal preserves relatedPersonName**
   - Input: `existingRelationships` with `relatedPersonName: "John Doe"`
   - Expected: `initialRelationships` contains `relatedPersonName: "John Doe"`

2. **useManageRelationships initializes with names**
   - Input: `initialRelationships` with `relatedPersonName`
   - Expected: State `relationships` contains the names

3. **Relationship section auto-expands**
   - Input: `existingRelationships` with 1+ items
   - Expected: `showRelationshipsSection` is `true`

### Integration Tests

1. **End-to-end relationship display**
   - Open edit modal for person with relationships
   - Verify relationships are displayed with correct names
   - Verify section is expanded

2. **Empty relationships state**
   - Open edit modal for person without relationships
   - Verify section is collapsed
   - Click "Manage" and verify section expands

## Files to Modify

1. `src/components/person/EditPersonModal.tsx` - Main fix
2. `src/components/person/EditPersonModal.test.tsx` - Add/update tests (if exists)
3. `src/hooks/useManageRelationships.ts` - Verify type compatibility

## Verification Steps

1. Open edit person modal for person with existing relationships
2. Verify relationships section is automatically expanded
3. Verify relationship names are displayed correctly (not "Unknown")
4. Verify relationship types are displayed correctly
5. Test adding a new relationship
6. Test removing a relationship
7. Test editing a relationship
8. Open edit modal for person without relationships
9. Verify relationships section is collapsed
10. Click "Manage" and verify section expands

## Architecture Compliance

- ✅ Single Responsibility: Only fixes data transformation bug
- ✅ Open/Closed: No modifications to existing logic flow
- ✅ Liskov Substitution: N/A
- ✅ Interface Segregation: Uses existing interfaces
- ✅ Dependency Injection: Uses existing prop-based injection
