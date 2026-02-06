# Tree Relationship Connections Fix - Technical Specification

**Document Version**: 2.0
**Date**: 2026-02-06
**Author**: PM Agent (Claude)
**Status**: Ready for Implementation
**Priority**: Critical

## 1. Problem Statement

The tree board detail page shows all people in the tree, but the relationships (parent-child connections) between persons are not being displayed correctly. Users want to see all persons connected based on their parent-child relationships across all levels.

**User Impact**:
- Users cannot see the family tree structure with connected generations
- Parent-child relationships are not visually represented with edges
- The tree appears as disconnected nodes instead of a connected family tree

## 2. Root Cause Analysis

### Critical Bug #1: Relationship Type Direction Mismatch
**File**: `src/hooks/useAddPersonToTree.ts` (lines 65-70)

**Issue**: When creating a new person with a relationship, the relationship type is stored with the wrong semantic direction.

**Current (WRONG)**:
```typescript
// In useAddPersonToTree.ts - lines 65-70
body: JSON.stringify({
  treeId,
  fromPersonId: rel.relatedPersonId,  // existing person
  toPersonId: newPerson._id,          // new person
  type: rel.relationshipType,         // 'child' (from user's perspective - WRONG!)
}),
```

**The Problem**:
- User selects "child" when adding a new person (meaning "this new person is the child of the existing person")
- Relationship is stored as: `{ fromPersonId: existingPerson, toPersonId: newPerson, type: 'child' }`
- But the repository queries for children using: `{ fromPersonId: personId, type: 'parent' }` (see `RelationshipRepository.ts` line 136-137)

**Expected (CORRECT)**:
```typescript
// Relationships must be stored from the parent's perspective
// When user selects "child", we store type: 'parent' with fromPersonId = parent
body: JSON.stringify({
  treeId,
  fromPersonId: rel.relatedPersonId,  // parent
  toPersonId: newPerson._id,          // child
  type: 'parent',                     // ALWAYS 'parent' for parent-child relationships
}),
```

**Result**: The query never finds child relationships because they're stored as `type: 'child'` but queried as `type: 'parent'`.

### Bug #2: Children Not Being Recursively Traversed (FIXED in previous iteration)
**File**: `src/lib/tree-layout/pedigree.ts` (lines 118-137)

**Note**: This issue was addressed in a previous fix. The `calculatePedigreeLayout` function now has recursive child traversal.

### Bug: Children Not Being Recursively Traversed
**File**: `src/lib/tree-layout/pedigree.ts` (lines 118-137)

**Issue**: The `calculatePedigreeLayout` function adds edges to children but does **not recursively traverse** them. The parent traversal recursively calls `traverse()` for each parent (line 114), but the child handling only adds edges without recursion.

**Current (WRONG)**:
```typescript
childRelationships.forEach((childRel) => {
  const childId = childRel.toPersonId;

  // Only add edge if not already visited (avoid duplicates)
  if (!visited.has(childId)) {
    edges.push({
      id: `${personId}-${childId}-child`,
      source: personId,
      target: childId,
      // ...
    });
  }
  // Missing: traverse(childId, generation - 1, childY);
});
```

**Expected (CORRECT)**:
```typescript
childRelationships.forEach((childRel, index) => {
  const childId = childRel.toPersonId;

  // Add edge from parent to child
  edges.push({
    id: `${personId}-${childId}`,
    source: personId,
    target: childId,
    // ...
  });

  // Calculate child position and recursively traverse
  const childY = yOffset + index * vSpacing;
  if (!visited.has(childId)) {
    traverse(childId, generation - 1, childY);
  }
});
```

**Impact**: The tree only shows:
1. The root person
2. Parents of the root person (ancestors going up)
3. All other persons as disconnected nodes at generation 0

What's missing:
1. Descendants (children, grandchildren, etc.) are NOT traversed
2. Edges may be added to children but children are never positioned correctly
3. The tree doesn't expand downward from the root

## 3. Acceptance Criteria

### AC1: Relationship Type Is Normalized
- [ ] When user selects "child" relationship, the system stores `type: 'parent'`
- [ ] When user selects "parent" relationship, the system stores `type: 'parent'` (with reversed from/to)
- [ ] All parent-child relationships are stored with `type: 'parent'` from the parent's perspective

### AC2: Parent-Child Edges Are Displayed
- [ ] All parent-child relationships are shown as edges
- [ ] Edges connect parents to their children visually
- [ ] Edge styling is consistent (gray smoothstep lines)

### AC3: Descendants Are Traversed and Positioned
- [ ] Children of the root person are traversed recursively
- [ ] Grandchildren and further descendants are positioned correctly
- [ ] Each generation is positioned at a different X coordinate

### AC4: Tree Structure Is Complete
- [ ] All persons connected via parent relationships are displayed
- [ ] The tree expands both upward (ancestors) and downward (descendants)
- [ ] No disconnected nodes unless they have no parent relationships

### AC5: Build and Tests Pass
- [ ] Build succeeds with no TypeScript errors
- [ ] Existing tests continue to pass
- [ ] No regressions introduced

## 4. Technical Approach

### Phase 1: Fix Relationship Type Normalization (CRITICAL)
**File**: `src/hooks/useAddPersonToTree.ts`

**Root Cause**: The relationship type needs to be normalized before storage. The system stores all parent-child relationships with `type: 'parent'` from the parent's perspective, regardless of what the user selects.

**Changes Required**:

1. **Add relationship type normalization function**:
   ```typescript
   /**
    * Normalizes relationship type to be stored from the parent's perspective.
    * The system always stores parent-child relationships as type: 'parent'
    * with fromPersonId being the parent and toPersonId being the child.
    */
   function normalizeRelationshipType(
     relationshipType: 'parent' | 'child' | 'spouse' | 'sibling',
     relatedPersonId: string,
     newPersonId: string
   ): { fromPersonId: string; toPersonId: string; type: 'parent' | 'child' | 'spouse' | 'sibling' } {
     // For parent-child relationships, always store as 'parent' from the parent's perspective
     if (relationshipType === 'child') {
       // User selected "child" meaning new person is child of related person
       return {
         fromPersonId: relatedPersonId,  // parent
         toPersonId: newPersonId,        // child
         type: 'parent',                 // stored from parent's perspective
       };
     }

     if (relationshipType === 'parent') {
       // User selected "parent" meaning new person is parent of related person
       return {
         fromPersonId: newPersonId,      // parent
         toPersonId: relatedPersonId,    // child
         type: 'parent',                 // stored from parent's perspective
       };
     }

     // For spouse and sibling, direction doesn't matter as much
     // but we keep the user's selection
     return {
       fromPersonId: relatedPersonId,
       toPersonId: newPersonId,
       type: relationshipType,
     };
   }
   ```

2. **Update relationship creation code** (lines 60-72):
   ```typescript
   // Create relationships
   const relationshipPromises = relationshipsToCreate.map((rel) => {
     const normalized = normalizeRelationshipType(
       rel.relationshipType,
       rel.relatedPersonId,
       newPerson._id
     );

     return fetch('/api/relationships', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         treeId,
         fromPersonId: normalized.fromPersonId,
         toPersonId: normalized.toPersonId,
         type: normalized.type,
       }),
     });
   });
   ```

### Phase 2: Verify Layout Algorithm (Already Fixed)
The layout algorithm in `src/lib/tree-layout/pedigree.ts` should now work correctly since:
1. It queries for children using `findChildren(personId)` which looks for `{ fromPersonId: personId, type: 'parent' }`
2. After Phase 1 fix, relationships are stored with correct type and direction
3. Recursive child traversal should work as expected

### Phase 3: Verify API Route
The API route at `src/app/api/trees/[id]/relationships/route.ts` returns relationships correctly. No changes needed there.

### Phase 4: Handle Edge Cases
1. **Existing data with wrong types**: May need a data migration to fix existing relationships
2. **Edit person functionality**: Should also use the normalization logic
3. **UI feedback**: Ensure the UI still shows the correct relationship from the user's perspective

## 5. Architecture Considerations

### SOLID Principles Compliance

**Single Responsibility Principle**:
- `calculatePedigreeLayout` handles layout calculation
- `traverse` handles node positioning and edge creation
- `recalculatePositions` handles position optimization

**Open/Closed Principle**:
- Algorithm is extended to handle bidirectional traversal
- No interface changes required

**Complexity Consideration**:
- The function is already ~240 lines (complex)
- Consider extracting child/parent traversal into separate functions
- Consider using a proper graph traversal algorithm (BFS/DFS)

## 6. Test Requirements

### Unit Test: Relationship Type Normalization
**File**: `src/hooks/__tests__/useAddPersonToTree.test.ts`

```typescript
import { normalizeRelationshipType } from '../useAddPersonToTree';

describe('normalizeRelationshipType', () => {
  it('should normalize "child" to parent relationship from parent perspective', () => {
    const result = normalizeRelationshipType('child', 'parent-id', 'child-id');
    expect(result).toEqual({
      fromPersonId: 'parent-id',
      toPersonId: 'child-id',
      type: 'parent',
    });
  });

  it('should normalize "parent" to parent relationship from parent perspective', () => {
    const result = normalizeRelationshipType('parent', 'child-id', 'parent-id');
    expect(result).toEqual({
      fromPersonId: 'parent-id',
      toPersonId: 'child-id',
      type: 'parent',
    });
  });

  it('should keep spouse relationship unchanged', () => {
    const result = normalizeRelationshipType('spouse', 'person1-id', 'person2-id');
    expect(result).toEqual({
      fromPersonId: 'person1-id',
      toPersonId: 'person2-id',
      type: 'spouse',
    });
  });

  it('should keep sibling relationship unchanged', () => {
    const result = normalizeRelationshipType('sibling', 'person1-id', 'person2-id');
    expect(result).toEqual({
      fromPersonId: 'person1-id',
      toPersonId: 'person2-id',
      type: 'sibling',
    });
  });
});
```

### Unit Test: Layout Algorithm (Already Implemented)
**File**: `src/lib/tree-layout/__tests__/pedigree.test.ts`

The existing tests should verify that:
1. Children are recursively traversed
2. Edges connect parents to children correctly
3. Different generations are positioned correctly

## 7. Edge Cases and Considerations

### Data Edge Cases
1. **Orphaned nodes**: Persons with no parent relationships at all
2. **Cycles**: A -> B -> A (shouldn't exist, but handle gracefully)
3. **Multiple parents**: Person has 2+ parent relationships
4. **Deep trees**: 10+ generations of descendants
5. **Wide trees**: Many children per parent

### Layout Edge Cases
1. **Overlapping nodes**: Multiple nodes at same generation/Y
2. **Crossing edges**: Edges that visually cross each other
3. **Negative generations**: Descendants have negative generation numbers
4. **Off-screen nodes**: Tree extends beyond viewport

### Algorithm Considerations
- The `visited` Set prevents infinite loops in cycles
- Y-position calculation needs to account for multiple children
- Spouse handling should continue to work
- The unconnected nodes logic should only apply to truly isolated nodes

## 8. Implementation Dependencies

### Required Changes
1. `src/lib/tree-layout/pedigree.ts` - Add recursive child traversal

### Optional Improvements (Future)
- Consider using a proper graph library for layout
- Add configurable layout direction (left-to-right, top-to-bottom)
- Implement tree auto-centering and zoom-to-fit
- Add animation for tree loading

## 9. Data Migration Consideration

**IMPORTANT**: After implementing the fix, existing relationships in the database may have incorrect types. A data migration may be needed to:

1. Find all relationships with `type: 'child'`
2. Convert them to `type: 'parent'` (keeping from/to as is, or swapping if needed)
3. Verify all parent-child relationships have `type: 'parent'` from the parent's perspective

**Migration Script** (to be created if needed):
```typescript
// Example migration logic
// 1. Find all relationships with type: 'child'
// 2. For each, update to type: 'parent'
// 3. Verify fromPersonId is actually the parent
```

## 10. Definition of Done

A task is complete when:
- [ ] Code changes implemented (`useAddPersonToTree.ts` updated)
- [ ] Build succeeds with no errors
- [ ] Existing tests pass
- [ ] New tests added for relationship type normalization
- [ ] Manual testing confirms tree shows connections
- [ ] Data migration considered/executed if needed
- [ ] No regressions in spouse/sibling handling
- [ ] Code follows SOLID principles

## 11. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing relationships | High | Medium | Data migration script, thorough testing |
| Wrong relationship direction | High | Low | Unit tests for normalization |
| Visual overlap issues | Medium | Medium | Position recalculation handles this |
| Existing data with wrong types | High | High | Data migration required |

## 12. Timeline Estimate

- **Phase 1 (Fix relationship type normalization)**: 1-2 hours
- **Phase 2 (Testing)**: 1-2 hours
- **Phase 3 (Data migration if needed)**: 1-2 hours
- **Total**: 3-6 hours

## 12. Related Issues

- Related to: `docs/specifications/tree-board-visualization-fix.md`
- Fixes regression from previous fix

---

**Document Status**: Ready for SE (Software Engineer) Agent
**Next Step**: Implement fixes according to this specification
