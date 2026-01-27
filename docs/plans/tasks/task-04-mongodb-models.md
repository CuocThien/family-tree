# Task 04: Create MongoDB Models

**Phase:** 2 - Database Layer
**Priority:** Critical
**Dependencies:** Task 03
**Estimated Complexity:** Medium

---

## Objective

Create Mongoose models for all entities: User, FamilyTree, Person, Relationship, Media, and AuditLog.

---

## Requirements

### Data Model Overview

```
┌─────────────┐       ┌─────────────┐
│    User     │──────>│ FamilyTree  │
└─────────────┘  1:N  └─────────────┘
                            │
                            │ 1:N
                            ▼
                      ┌─────────────┐
                      │   Person    │
                      └─────────────┘
                            │
                            │ N:N
                            ▼
                      ┌─────────────┐
                      │Relationship │
                      └─────────────┘
                            │
                      ┌─────────────┐
                      │    Media    │
                      └─────────────┘
```

---

## Model Specifications

### 1. User Model

**File:** `src/models/User.ts`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | String | Yes | email format, unique | User email |
| password | String | No | min 8 chars | Hashed password |
| profile.name | String | Yes | 2-100 chars | Display name |
| profile.avatar | String | No | URL format | Avatar URL |
| trees | ObjectId[] | No | ref: FamilyTree | Owned trees |
| role | String | Yes | enum: user, admin | User role |
| isVerified | Boolean | Yes | default: false | Email verified |
| createdAt | Date | Auto | - | Creation time |
| updatedAt | Date | Auto | - | Update time |

**Edge Cases:**
- Email must be lowercase and trimmed
- Password excluded from queries by default (select: false)
- Empty trees array for new users
- Handle OAuth users (no password)

### 2. FamilyTree Model

**File:** `src/models/FamilyTree.ts`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | String | Yes | 1-200 chars | Tree name |
| description | String | No | max 2000 chars | Tree description |
| ownerId | ObjectId | Yes | ref: User | Tree owner |
| collaborators | Object[] | No | - | Shared users |
| collaborators.userId | ObjectId | Yes | ref: User | Collaborator |
| collaborators.role | String | Yes | enum: viewer, editor | Permission |
| settings | Object | No | - | Tree settings |
| settings.visibility | String | Yes | enum: private, public | Visibility |
| settings.defaultView | String | Yes | enum: vertical, horizontal | Default view |
| coverImage | String | No | URL format | Cover image |
| memberCount | Number | No | default: 0 | Cached count |
| createdAt | Date | Auto | - | Creation time |
| updatedAt | Date | Auto | - | Update time |

**Edge Cases:**
- Owner cannot be added as collaborator
- Prevent duplicate collaborators
- memberCount must stay in sync (or be computed)
- Handle tree deletion cascade

### 3. Person Model

**File:** `src/models/Person.ts`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| treeId | ObjectId | Yes | ref: FamilyTree | Parent tree |
| firstName | String | Yes | 1-100 chars | First name |
| lastName | String | Yes | 1-100 chars | Last name |
| middleName | String | No | max 100 chars | Middle name |
| maidenName | String | No | max 100 chars | Maiden name |
| nicknames | String[] | No | max 10 items | Aliases |
| gender | String | No | enum: male, female, other, unknown | Gender |
| birthDate | Date | No | <= today | Birth date |
| birthPlace | String | No | max 200 chars | Birth location |
| deathDate | Date | No | >= birthDate | Death date |
| deathPlace | String | No | max 200 chars | Death location |
| isLiving | Boolean | Yes | default: true | Living status |
| biography | String | No | max 10000 chars | Life story |
| occupation | String | No | max 200 chars | Occupation |
| profilePhoto | String | No | URL format | Profile photo |
| createdBy | ObjectId | Yes | ref: User | Creator |
| createdAt | Date | Auto | - | Creation time |
| updatedAt | Date | Auto | - | Update time |

**Edge Cases:**
- deathDate must be >= birthDate (if both provided)
- isLiving must be false if deathDate is set
- Handle approximate dates (year only, decade, etc.)
- Trim and sanitize all string fields
- Handle Unicode characters in names

### 4. Relationship Model

**File:** `src/models/Relationship.ts`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| treeId | ObjectId | Yes | ref: FamilyTree | Parent tree |
| fromPersonId | ObjectId | Yes | ref: Person | Source person |
| toPersonId | ObjectId | Yes | ref: Person | Target person |
| type | String | Yes | enum | Relationship type |
| startDate | Date | No | - | Start date (marriage) |
| endDate | Date | No | >= startDate | End date (divorce) |
| notes | String | No | max 1000 chars | Notes |
| createdAt | Date | Auto | - | Creation time |
| updatedAt | Date | Auto | - | Update time |

**Relationship Types:**
- `parent` - fromPerson is parent of toPerson
- `child` - fromPerson is child of toPerson
- `spouse` - marriage relationship
- `sibling` - sibling relationship
- `adoptive_parent` - adoptive parent
- `adoptive_child` - adoptive child
- `step_parent` - step parent
- `step_child` - step child

**Edge Cases:**
- Prevent self-relationships (fromPersonId !== toPersonId)
- Prevent duplicate relationships
- Both persons must belong to same tree
- Handle relationship deletion cascade
- Bidirectional relationships (spouse, sibling)

### 5. Media Model

**File:** `src/models/Media.ts`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| treeId | ObjectId | Yes | ref: FamilyTree | Parent tree |
| personId | ObjectId | No | ref: Person | Associated person |
| type | String | Yes | enum: image, document, audio, video | Media type |
| filename | String | Yes | max 255 chars | Original filename |
| storageKey | String | Yes | unique | Storage identifier |
| mimeType | String | Yes | valid mime | MIME type |
| size | Number | Yes | max 50MB | File size bytes |
| url | String | Yes | URL format | Access URL |
| thumbnailUrl | String | No | URL format | Thumbnail URL |
| title | String | No | max 200 chars | Display title |
| description | String | No | max 1000 chars | Description |
| dateTaken | Date | No | - | Photo/video date |
| uploadedBy | ObjectId | Yes | ref: User | Uploader |
| createdAt | Date | Auto | - | Creation time |

**Edge Cases:**
- Validate MIME type matches file extension
- Handle orphaned media (person deleted)
- Storage cleanup on deletion
- Handle large file uploads (chunked)
- Virus/malware scanning consideration

### 6. AuditLog Model

**File:** `src/models/AuditLog.ts`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| treeId | ObjectId | Yes | ref: FamilyTree | Related tree |
| userId | ObjectId | Yes | ref: User | Acting user |
| action | String | Yes | enum | Action type |
| entityType | String | Yes | enum | Entity type |
| entityId | ObjectId | Yes | - | Entity ID |
| changes | Object | No | - | Change details |
| changes.before | Mixed | No | - | Previous value |
| changes.after | Mixed | No | - | New value |
| ipAddress | String | No | IP format | Client IP |
| userAgent | String | No | - | User agent |
| createdAt | Date | Auto | - | Timestamp |

**Action Types:**
- `create`, `update`, `delete`
- `share`, `unshare`
- `export`, `import`

**Entity Types:**
- `tree`, `person`, `relationship`, `media`

**Edge Cases:**
- Never delete audit logs (soft delete only)
- Handle large change diffs
- PII considerations in logs
- Retention policy (auto-archive old logs)

---

## Input Validation

### Pre-conditions

- [ ] Task 03 completed (directories exist)
- [ ] mongoose package installed
- [ ] src/models/ directory exists

### Validation for Each Model

| Validation Type | Implementation |
|----------------|----------------|
| Required fields | Mongoose `required: true` |
| String length | Mongoose `minlength`, `maxlength` |
| Enum values | Mongoose `enum: [...]` |
| Unique fields | Mongoose `unique: true` + index |
| Custom validation | Mongoose `validate` function |
| References | Mongoose `ref` + middleware |

---

## Implementation Steps

### Step 1: Write Model Tests First (TDD)

Create test file: `tests/unit/models/User.test.ts`

```typescript
import mongoose from 'mongoose';
import { UserModel, IUser } from '@/models/User';

describe('UserModel', () => {
  it('should have correct schema fields', () => {
    const fields = Object.keys(UserModel.schema.paths);
    expect(fields).toContain('email');
    expect(fields).toContain('password');
    expect(fields).toContain('profile');
    expect(fields).toContain('trees');
    expect(fields).toContain('role');
  });

  it('should require email', async () => {
    const user = new UserModel({ profile: { name: 'Test' } });
    await expect(user.validate()).rejects.toThrow(/email/);
  });

  it('should validate email format', async () => {
    const user = new UserModel({
      email: 'invalid-email',
      profile: { name: 'Test' }
    });
    await expect(user.validate()).rejects.toThrow(/email/);
  });

  it('should lowercase email', async () => {
    const user = new UserModel({
      email: 'TEST@Example.COM',
      profile: { name: 'Test' }
    });
    expect(user.email).toBe('test@example.com');
  });
});
```

### Step 2: Implement User Model

### Step 3: Implement FamilyTree Model with validation

### Step 4: Implement Person Model with date validation

### Step 5: Implement Relationship Model with constraints

### Step 6: Implement Media Model with file validation

### Step 7: Implement AuditLog Model

### Step 8: Run All Model Tests

```bash
npm test -- tests/unit/models/
```

---

## Acceptance Criteria

- [ ] All 6 models created with TypeScript interfaces
- [ ] All required fields enforced
- [ ] All validations working
- [ ] Indexes created for query performance
- [ ] References validated
- [ ] Unit tests passing for all models

---

## Performance Indexes

```typescript
// User indexes
UserSchema.index({ email: 1 }, { unique: true });

// FamilyTree indexes
TreeSchema.index({ ownerId: 1 });
TreeSchema.index({ 'collaborators.userId': 1 });

// Person indexes
PersonSchema.index({ treeId: 1 });
PersonSchema.index({ treeId: 1, lastName: 1 });
PersonSchema.index({ treeId: 1, firstName: 1, lastName: 1 });

// Relationship indexes
RelationshipSchema.index({ treeId: 1 });
RelationshipSchema.index({ fromPersonId: 1, type: 1 });
RelationshipSchema.index({ toPersonId: 1, type: 1 });
RelationshipSchema.index(
  { treeId: 1, fromPersonId: 1, toPersonId: 1, type: 1 },
  { unique: true }
);

// Media indexes
MediaSchema.index({ treeId: 1 });
MediaSchema.index({ personId: 1 });
MediaSchema.index({ storageKey: 1 }, { unique: true });

// AuditLog indexes
AuditLogSchema.index({ treeId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
```
