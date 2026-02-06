# Relationship Validation Fix - Technical Specification

## Issue Summary

**Error Message:**
```
⨯ Error: Relationship validation failed: person2Id: Path `person2Id` is required., person1Id: Path `person1Id` is required.
    at ignore-listen frames {
  errors: [Object],
  _message: 'Relationship validation failed'
}
POST /api/relationships 500 in 4.4s
```

## Root Cause Analysis

There is a **field name mismatch** between the MongoDB model and the application layer:

| Layer | Field 1 | Field 2 |
|-------|---------|---------|
| **Model** (`src/models/Relationship.ts`) | `person1Id` | `person2Id` |
| **Types** (`src/types/relationship.ts`) | `fromPersonId` | `toPersonId` |
| **DTO** (`src/types/dtos/relationship.ts`) | `fromPersonId` | `toPersonId` |
| **Service** (`src/services/relationship/RelationshipService.ts`) | `fromPersonId` | `toPersonId` |
| **Repository** (`src/repositories/mongodb/RelationshipRepository.ts`) | `fromPersonId` | `toPersonId` |

The repository's `create()` method passes data with `fromPersonId` and `toPersonId`, but MongoDB validates against the schema which expects `person1Id` and `person2Id`, causing the validation error.

## Current Behavior

When creating a relationship via `POST /api/relationships`:
1. API route receives DTO with `fromPersonId` and `toPersonId`
2. Service validates and calls `relationshipRepository.create()`
3. Repository creates data with `fromPersonId` and `toPersonId`
4. **MongoDB validation fails** because schema expects `person1Id` and `person2Id`

## Expected Behavior

The relationship should be created successfully with proper field mapping between the application layer and the database layer.

## Fix Approach

**Option A: Update Model Schema (Recommended)**

Update `src/models/Relationship.ts` to use the same field names as the application layer (`fromPersonId` and `toPersonId`). This ensures consistency across all layers.

**Changes Required:**
1. `src/models/Relationship.ts`:
   - Change `person1Id` → `fromPersonId`
   - Change `person2Id` → `toPersonId`
   - Update indexes accordingly

**Option B: Add Mapping in Repository (Alternative)**

Add field mapping in `RelationshipRepository.create()` to translate `fromPersonId`/`toPersonId` to `person1Id`/`person2Id` before MongoDB operations.

## Recommended Solution

**Option A** is recommended because:
- Consistent naming across all layers
- Cleaner, more maintainable code
- Follows the domain-driven design principle (using descriptive `fromPersonId`/`toPersonId`)
- Less cognitive overhead

## Acceptance Criteria

1. **Creating a relationship** via `POST /api/relationships` should succeed
2. **Field names** are consistent across Model, Types, DTO, Service, and Repository
3. **All existing queries** continue to work (findParents, findChildren, findSpouses, findSiblings)
4. **Tests pass** for relationship creation and queries

## Test Scenarios

1. **Create relationship** with valid `fromPersonId` and `toPersonId`
2. **Query relationships** by person ID
3. **Find parents** using `findParents()`
4. **Find children** using `findChildren()`
5. **Find spouses** using `findSpouses()`
6. **Find siblings** using `findSiblings()`

## Files to Modify

1. `src/models/Relationship.ts` - Update field names in schema

## Files to Verify (No Changes Expected)

1. `src/types/relationship.ts` - Uses correct field names
2. `src/types/dtos/relationship.ts` - Uses correct field names
3. `src/services/relationship/RelationshipService.ts` - Uses correct field names
4. `src/repositories/mongodb/RelationshipRepository.ts` - Uses correct field names
5. `src/app/api/relationships/route.ts` - Uses correct field names

## Migration Considerations

**IMPORTANT:** This change affects the MongoDB schema. If the database already has relationships with `person1Id`/`person2Id`, a migration script may be needed to rename the fields in existing documents.

**Migration Script (if needed):**
```javascript
db.relationships.updateMany(
  {},
  {
    $rename: {
      person1Id: "fromPersonId",
      person2Id: "toPersonId"
    }
  }
)
```

## Rollback Plan

If issues arise, revert `src/models/Relationship.ts` changes and update the repository to add field mapping in the `create()` method instead.
