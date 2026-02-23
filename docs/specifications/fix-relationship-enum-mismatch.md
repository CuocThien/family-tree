# Bug Fix Specification: Relationship Type Enum Mismatch

## Issue Summary

**Bug ID**: REL-001
**Priority**: High
**Severity**: Critical
**Status**: To Do

### Problem Description

When adding a new person with a parent relationship, the system throws a Mongoose validation error:

```
Error: Relationship validation failed: type: `father` is not a valid enum value for path `type`.
```

**Error Response**: POST /api/relationships 500

### Root Cause Analysis

The codebase has an inconsistency between:

1. **TypeScript Types** (`src/types/relationship.ts`):
   - Supports: `'father'`, `'mother'`, `'parent'`, `'child'`, `'spouse'`, `'sibling'`, etc.
   - Used throughout the application layer

2. **Mongoose Schema** (`src/models/Relationship.ts`):
   - Only supports: `'parent'`, `'child'`, `'spouse'`, `'sibling'`
   - Missing: `'father'`, `'mother'`, and other extended types

3. **API Validation** (`src/app/api/relationships/route.ts`):
   - Also missing `'father'` and `'mother'` in the enum validation

### Business Logic Flow

When creating a parent relationship:

1. User submits relationship with `type: 'parent'`
2. `RelationshipService.createRelationship()` receives the request
3. Service determines the specific type based on parent's gender:
   - Male → `father`
   - Female → `mother`
   - Other → `parent`
4. Service calls `createParentRelationshipWithType()` with specific type
5. Repository attempts to save to MongoDB
6. **Mongoose validation fails** because `father`/`mother` not in enum

## Acceptance Criteria

- [ ] Mongoose schema accepts `father` and `mother` relationship types
- [ ] API validation accepts `father` and `mother` relationship types
- [ ] Existing functionality continues to work
- [ ] All existing tests pass
- [ ] New tests added for father/mother types

## Technical Specification

### Changes Required

#### 1. Update Mongoose Model (`src/models/Relationship.ts`)

**Current enum**:
```typescript
type: { type: String, enum: ['parent', 'child', 'spouse', 'sibling'], required: true }
```

**Updated enum**:
```typescript
type: {
  type: String,
  enum: [
    'father',
    'mother',
    'parent',
    'child',
    'spouse',
    'sibling',
    'step-parent',
    'step-child',
    'adoptive-parent',
    'adoptive-child',
    'partner'
  ],
  required: true
}
```

#### 2. Update API Validation (`src/app/api/relationships/route.ts`)

**Current enum**:
```typescript
const relationshipTypeEnum = z.enum([
  'parent',
  'child',
  'spouse',
  'sibling',
  'step-parent',
  'step-child',
  'adoptive-parent',
  'adoptive-child',
  'partner',
] as const);
```

**Updated enum**:
```typescript
const relationshipTypeEnum = z.enum([
  'father',
  'mother',
  'parent',
  'child',
  'spouse',
  'sibling',
  'step-parent',
  'step-child',
  'adoptive-parent',
  'adoptive-child',
  'partner',
] as const);
```

#### 3. Update TypeScript Interface (`src/models/Relationship.ts`)

**Current interface**:
```typescript
type: 'parent' | 'child' | 'spouse' | 'sibling';
```

**Updated interface**:
```typescript
type: 'father' | 'mother' | 'parent' | 'child' | 'spouse' | 'sibling' |
      'step-parent' | 'step-child' | 'adoptive-parent' | 'adoptive-child' | 'partner';
```

### Testing Requirements

1. **Unit Tests**:
   - Test creating relationship with `father` type
   - Test creating relationship with `mother` type
   - Test creating relationship with generic `parent` type
   - Test that existing relationship types still work

2. **Integration Tests**:
   - Test full flow: POST /api/relationships with father type
   - Test full flow: POST /api/relationships with mother type
   - Verify response is 201, not 500

3. **E2E Tests**:
   - Test adding a person with father relationship through UI
   - Test adding a person with mother relationship through UI

### Database Migration

No migration needed. MongoDB does not enforce enum validation on existing documents.

### Backward Compatibility

- All existing `parent` type relationships remain valid
- Code continues to support generic `parent` type
- No breaking changes to existing functionality

## Implementation Plan

1. Update Mongoose schema in `src/models/Relationship.ts`
2. Update API validation in `src/app/api/relationships/route.ts`
3. Write unit tests for new relationship types
4. Run test suite
5. Manual testing
6. Create PR

## Risk Assessment

**Risk Level**: Low

- Simple enum update
- No database migration required
- Backward compatible
- Well-defined scope

## Verification Checklist

- [ ] Schema updated with all relationship types
- [ ] API validation updated
- [ ] TypeScript types consistent
- [ ] Unit tests added
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] No regressions detected
