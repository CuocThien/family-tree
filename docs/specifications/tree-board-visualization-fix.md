# Tree Board Visualization Fix - Technical Specification

**Document Version**: 1.0
**Date**: 2026-02-05
**Author**: PM Agent (Claude)
**Status**: Draft
**Priority**: High

## 1. Problem Statement

The tree board detail page at `/trees/[id]` is not displaying all people in the family tree and their relationships. Currently, only 1 person is shown regardless of the actual number of people in the tree.

**User Impact**:
- Users cannot visualize their complete family tree
- Family relationships cannot be viewed or managed
- Core feature of the application is non-functional

## 2. Root Cause Analysis

### Bug #1: Relationships API Returns Wrong Data Structure
**File**: `src/app/api/trees/[id]/relationships/route.ts` (lines 24-37)

**Issue**: The GET endpoint returns an array of `FamilyMember` objects instead of `IRelationship` objects.

```typescript
// Current (WRONG):
return NextResponse.json(familyMembers);

// Expected (CORRECT):
return NextResponse.json(relationships);
```

**Impact**: Frontend cannot consume the relationship data because the structure doesn't match the `IRelationship` interface.

**Evidence from codebase**:
- Frontend expects: `{ id, person1Id, person2Id, type, treeId }`
- API returns: `{ personId, name, gender, birthDate, ... }`

### Bug #2: findChildren() Has Wrong Query Logic
**File**: `src/repositories/mongodb/RelationshipRepository.ts` (lines 129-142)

**Issue**: The `findChildren()` method queries for relationships with `type: 'child'`, but relationships are stored with the type from the parent's perspective as `type: 'parent'`.

```typescript
// Current (WRONG):
async findChildren(personId: string): Promise<IRelationship[]> {
  const relationships = await Relationship.find({
    person2Id: personId,  // This person is the child (person2)
    type: 'child'         // WRONG: Should be 'parent'
  });

// Correct logic:
// When querying for children of X:
// - Find relationships where person2Id = X (X is the child/person2)
// - AND type = 'parent' (stored as parent relationship)
```

**Impact**: The tree layout algorithm cannot traverse descendant relationships, causing the tree to show only the root person.

**Relationship Storage Schema**:
- Parent → Child: `{ person1Id: parentId, person2Id: childId, type: 'parent' }`
- Child → Parent: Same record, but `type` remains 'parent' (from parent's perspective)

## 3. Acceptance Criteria

### AC1: Relationships API Returns Correct Data Structure
- [ ] GET `/api/trees/[id]/relationships` returns array of `IRelationship` objects
- [ ] Each relationship contains: `id`, `person1Id`, `person2Id`, `type`, `treeId`
- [ ] Response includes all relationships for the tree
- [ ] Response has 200 status code
- [ ] Error handling for invalid tree IDs

### AC2: findChildren() Returns Correct Relationships
- [ ] `findChildren(personId)` returns all child relationships
- [ ] Query correctly filters by `type: 'parent'` (not `'child'`)
- [ ] Returns relationships where `person2Id` is the child
- [ ] Empty array returned if no children exist
- [ ] Handles invalid person IDs gracefully

### AC3: Tree Board Displays All People
- [ ] Tree board shows all people in the family tree
- [ ] People are positioned correctly based on relationships
- [ ] Parent-child relationships are visible
- [ ] Tree layout algorithm can traverse all descendants
- [ ] UI updates dynamically when relationships change

### AC4: Test Coverage
- [ ] Unit tests for Relationships API endpoint
- [ ] Unit tests for `findChildren()` method
- [ ] Integration test for full tree data flow
- [ ] E2E test for tree board visualization
- [ ] Test coverage ≥ 80% for modified files

## 4. Technical Approach

### Phase 1: Fix Relationships API
**File**: `src/app/api/trees/[id]/relationships/route.ts`

**Changes**:
1. Modify GET handler to return relationships array instead of familyMembers
2. Add proper error handling for non-existent trees
3. Add input validation for tree ID
4. Return 404 if tree not found
5. Return 500 for server errors with meaningful message

**Code changes**:
```typescript
// Before:
const familyMembers = await this.personService.findFamilyMembers(treeId);
return NextResponse.json(familyMembers);

// After:
const relationships = await this.relationshipService.findByTreeId(treeId);
return NextResponse.json(relationships);
```

### Phase 2: Fix findChildren() Query
**File**: `src/repositories/mongodb/RelationshipRepository.ts`

**Changes**:
1. Update query filter from `type: 'child'` to `type: 'parent'`
2. Add JSDoc comment explaining the query logic
3. Ensure proper error handling

**Code changes**:
```typescript
// Before:
const relationships = await Relationship.find({
  person2Id: personId,
  type: 'child'  // WRONG
});

// After:
const relationships = await Relationship.find({
  person2Id: personId,
  type: 'parent'  // CORRECT: stored as parent relationship
});
```

### Phase 3: Verify Related Methods
**Files to check**:
- `src/repositories/mongodb/RelationshipRepository.ts`
  - `findParents()` - ensure it queries correctly
  - `findSpouses()` - verify query logic
  - `findSiblings()` - check if similar bugs exist

**Audit checklist**:
- [ ] All query methods use correct type filters
- [ ] Documentation is clear on relationship storage format
- [ ] Consistent query patterns across all methods

## 5. Architecture Considerations

### SOLID Principles Compliance

**Single Responsibility Principle**:
- API route handles HTTP concerns only
- Service layer handles business logic
- Repository handles data access

**Open/Closed Principle**:
- No changes to interfaces (`IRelationshipService`, `IRelationshipRepository`)
- Implementation changes only

**Liskov Substitution Principle**:
- `MongoDBRelationshipRepository` correctly implements `IRelationshipRepository`
- Behavior matches interface contract

**Interface Segregation Principle**:
- `IRelationshipRepository` has focused methods
- No fat interfaces

**Dependency Inversion Principle**:
- API route depends on `IRelationshipService` (abstraction)
- Service depends on `IRelationshipRepository` (abstraction)

### Service/Repository Pattern
- **Layer**: Service (`RelationshipService`)
- **Operation**: `findByTreeId()` - likely exists, verify
- **Layer**: Repository (`RelationshipRepository`)
- **Operation**: `findChildren()` - exists, needs fix

### Naming Conventions
- Files: PascalCase ✓
- Interfaces: Prefix with `I` ✓
- Methods: camelCase ✓

## 6. Test Requirements

### Unit Tests

**File**: `src/app/api/trees/[id]/relationships/route.test.ts`
```typescript
describe('GET /api/trees/[id]/relationships', () => {
  it('should return relationships array for valid tree ID')
  it('should return 404 for non-existent tree')
  it('should return 500 on service error')
  it('should return empty array if no relationships exist')
});
```

**File**: `src/repositories/mongodb/RelationshipRepository.test.ts`
```typescript
describe('findChildren()', () => {
  it('should return all child relationships for person')
  it('should query with type: parent')
  it('should filter by person2Id')
  it('should return empty array if no children')
  it('should handle invalid person ID')
});
```

### Integration Test

**File**: `tests/integration/tree-visualization-flow.test.ts`
```typescript
describe('Tree Visualization Flow', () => {
  it('should load tree with all people and relationships')
  it('should display parent-child relationships correctly')
  it('should handle complex multi-generational trees')
});
```

### E2E Test

**File**: `tests/e2e/tree-board.spec.ts`
```typescript
test('displays complete family tree', async ({ page }) => {
  // Navigate to tree detail
  // Verify all people are visible
  // Verify relationships are shown
  // Verify tree layout is correct
});
```

## 7. Edge Cases and Considerations

### Data Edge Cases
1. **Empty tree**: Tree with 0 people
2. **Single person**: Tree with 1 person (root only)
3. **Large tree**: 100+ people (performance test)
4. **Disconnected relationships**: Orphaned relationship records
5. **Circular references**: Person A → B → A (shouldn't exist, but handle gracefully)

### API Edge Cases
1. **Invalid tree ID**: Non-existent UUID
2. **Malformed ID**: Invalid format
3. **Deleted tree**: Tree exists but soft-deleted
4. **Concurrent requests**: Race conditions in data access

### UI Edge Cases
1. **Overlapping nodes**: People with same position
2. **Very deep trees**: 10+ generations
3. **Very wide trees**: Many children per parent
4. **Multiple parents**: Person has 2+ parent relationships
5. **Spouse chains**: Complex spouse networks

### Error Handling
- [ ] 404: Tree not found
- [ ] 400: Invalid ID format
- [ ] 500: Database connection error
- [ ] 500: Service layer error
- [ ] Graceful degradation if visualization fails

## 8. Implementation Dependencies

### Required Changes
1. `src/app/api/trees/[id]/relationships/route.ts` - API fix
2. `src/repositories/mongodb/RelationshipRepository.ts` - Query fix
3. Test files for both (new or updated)

### No Changes Required
- Service interfaces (`IRelationshipService`, `IRelationshipRepository`)
- Frontend components (should work once API is fixed)
- Database models/schema

### Optional Improvements (Future)
- Add relationship caching for performance
- Implement pagination for very large trees
- Add relationship validation service
- Create relationship DTOs for API responses

## 9. Definition of Done

A task is complete when:
- [ ] Code changes implemented and reviewed
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E test passes in CI/CD
- [ ] Test coverage ≥ 80% for modified files
- [ ] Code follows SOLID principles
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated (JSDoc comments)
- [ ] API documented in OpenAPI/Swagger if applicable
- [ ] Manual testing completed on staging
- [ ] No regression bugs in existing functionality

## 10. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing trees | High | Low | Comprehensive testing, backward compatibility check |
| Performance degradation | Medium | Low | Performance testing with large trees |
| Data inconsistency | High | Low | Add validation, check for orphaned records |
| Frontend incompatibility | Medium | Low | Verify frontend contracts, update if needed |

## 11. Timeline Estimate

- **Phase 1 (API Fix)**: 2-3 hours
- **Phase 2 (Repository Fix)**: 1-2 hours
- **Phase 3 (Testing)**: 3-4 hours
- **Code Review**: 1-2 hours
- **Total**: 7-11 hours

## 12. Related Issues

- Issue #TBD: Tree board visualization not working
- Related PR: #25 (Relationship management feature)
- Related spec: `docs/specifications/relationship-validation-fix.md`

## 13. Appendix: Relationship Data Model

### IRelationship Interface
```typescript
interface IRelationship {
  id: string;
  person1Id: string;  // Source person (e.g., parent)
  person2Id: string;  // Target person (e.g., child)
  type: 'parent' | 'spouse' | 'sibling';
  treeId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Query Patterns
```typescript
// Find children of person X:
{
  person2Id: X,    // X is the child
  type: 'parent'   // Relationship stored as parent
}

// Find parents of person X:
{
  person1Id: X,    // X is the parent
  type: 'parent'   // Relationship stored as parent
}

// Find spouses of person X:
{
  person1Id: X,    // X is one spouse
  type: 'spouse'
}
// OR
{
  person2Id: X,    // X is the other spouse
  type: 'spouse'
}
```

---

**Document Status**: Ready for SE (Software Engineer) Agent
**Next Step**: Implement fixes according to this specification
