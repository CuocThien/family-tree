# Task 06: Create Repository Interfaces

**Phase:** 3 - Repository Layer
**Priority:** High
**Dependencies:** Task 04
**Estimated Complexity:** Medium

---

## Objective

Define repository interfaces (contracts) following the Dependency Inversion Principle (DIP). These interfaces abstract data access, enabling easy testing and future storage changes.

---

## Requirements

### SOLID Principles

- **Dependency Inversion:** High-level modules depend on abstractions
- **Interface Segregation:** Focused interfaces, no fat interfaces
- **Single Responsibility:** Each interface handles one entity

### Interfaces to Create

1. IUserRepository
2. ITreeRepository
3. IPersonRepository
4. IRelationshipRepository
5. IMediaRepository
6. IAuditRepository

---

## Interface Specifications

### 1. IPersonRepository

**File:** `src/repositories/interfaces/IPersonRepository.ts`

```typescript
import { IPerson, CreatePersonData, UpdatePersonData } from '@/types/person';

export interface PersonQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'firstName' | 'lastName' | 'birthDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PersonSearchCriteria {
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  deathYear?: number;
  isLiving?: boolean;
}

export interface IPersonRepository {
  // CRUD Operations
  findById(id: string): Promise<IPerson | null>;
  findByTreeId(treeId: string, options?: PersonQueryOptions): Promise<IPerson[]>;
  create(data: CreatePersonData): Promise<IPerson>;
  update(id: string, data: UpdatePersonData): Promise<IPerson>;
  delete(id: string): Promise<void>;

  // Query Operations
  search(treeId: string, criteria: PersonSearchCriteria): Promise<IPerson[]>;
  countByTreeId(treeId: string): Promise<number>;
  findByIds(ids: string[]): Promise<IPerson[]>;

  // Existence Checks
  exists(id: string): Promise<boolean>;
  existsInTree(id: string, treeId: string): Promise<boolean>;
}
```

**Edge Cases:**
- findById returns null for non-existent ID
- findByIds handles empty array input
- delete is idempotent (no error if already deleted)
- search handles partial name matches

### 2. ITreeRepository

**File:** `src/repositories/interfaces/ITreeRepository.ts`

```typescript
import { ITree, CreateTreeData, UpdateTreeData, TreeCollaborator } from '@/types/tree';

export interface TreeQueryOptions {
  includeCollaborators?: boolean;
  includeMemberCount?: boolean;
}

export interface ITreeRepository {
  // CRUD Operations
  findById(id: string, options?: TreeQueryOptions): Promise<ITree | null>;
  findByOwnerId(ownerId: string): Promise<ITree[]>;
  findByCollaboratorId(userId: string): Promise<ITree[]>;
  create(data: CreateTreeData): Promise<ITree>;
  update(id: string, data: UpdateTreeData): Promise<ITree>;
  delete(id: string): Promise<void>;

  // Collaborator Management
  addCollaborator(treeId: string, collaborator: TreeCollaborator): Promise<ITree>;
  removeCollaborator(treeId: string, userId: string): Promise<ITree>;
  updateCollaboratorRole(treeId: string, userId: string, role: string): Promise<ITree>;
  getCollaborators(treeId: string): Promise<TreeCollaborator[]>;

  // Queries
  countByOwnerId(ownerId: string): Promise<number>;
  exists(id: string): Promise<boolean>;
  isOwner(treeId: string, userId: string): Promise<boolean>;
  hasAccess(treeId: string, userId: string): Promise<boolean>;
}
```

**Edge Cases:**
- addCollaborator prevents owner as collaborator
- addCollaborator prevents duplicates
- removeCollaborator is idempotent
- hasAccess checks both owner and collaborator

### 3. IRelationshipRepository

**File:** `src/repositories/interfaces/IRelationshipRepository.ts`

```typescript
import { IRelationship, CreateRelationshipData, UpdateRelationshipData, RelationshipType } from '@/types/relationship';

export interface IRelationshipRepository {
  // CRUD Operations
  findById(id: string): Promise<IRelationship | null>;
  findByTreeId(treeId: string): Promise<IRelationship[]>;
  create(data: CreateRelationshipData): Promise<IRelationship>;
  update(id: string, data: UpdateRelationshipData): Promise<IRelationship>;
  delete(id: string): Promise<void>;

  // Person-centric Queries
  findByPersonId(personId: string): Promise<IRelationship[]>;
  findByPersonIdAndType(personId: string, type: RelationshipType): Promise<IRelationship[]>;

  // Relationship Queries
  findBetweenPersons(personId1: string, personId2: string): Promise<IRelationship | null>;
  findParents(personId: string): Promise<IRelationship[]>;
  findChildren(personId: string): Promise<IRelationship[]>;
  findSpouses(personId: string): Promise<IRelationship[]>;
  findSiblings(personId: string): Promise<IRelationship[]>;

  // Existence Checks
  exists(fromPersonId: string, toPersonId: string, type: RelationshipType): Promise<boolean>;

  // Bulk Operations
  deleteByPersonId(personId: string): Promise<number>;
  deleteByTreeId(treeId: string): Promise<number>;
}
```

**Edge Cases:**
- exists prevents duplicate relationships
- deleteByPersonId returns count of deleted
- findSiblings traverses through parents
- Handle bidirectional relationships (spouse)

### 4. IUserRepository

**File:** `src/repositories/interfaces/IUserRepository.ts`

```typescript
import { IUser, CreateUserData, UpdateUserData } from '@/types/user';

export interface IUserRepository {
  // CRUD Operations
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailWithPassword(email: string): Promise<IUser | null>;
  create(data: CreateUserData): Promise<IUser>;
  update(id: string, data: UpdateUserData): Promise<IUser>;
  delete(id: string): Promise<void>;

  // Password Operations
  updatePassword(id: string, hashedPassword: string): Promise<void>;

  // Verification
  verifyEmail(id: string): Promise<IUser>;

  // Tree Association
  addTree(userId: string, treeId: string): Promise<void>;
  removeTree(userId: string, treeId: string): Promise<void>;

  // Queries
  exists(id: string): Promise<boolean>;
  emailExists(email: string): Promise<boolean>;
}
```

**Edge Cases:**
- findByEmailWithPassword includes password field (select: +password)
- emailExists is case-insensitive
- addTree prevents duplicates
- delete handles cascade to owned trees

### 5. IMediaRepository

**File:** `src/repositories/interfaces/IMediaRepository.ts`

```typescript
import { IMedia, CreateMediaData, UpdateMediaData, MediaType } from '@/types/media';

export interface MediaQueryOptions {
  limit?: number;
  offset?: number;
  type?: MediaType;
  sortBy?: 'createdAt' | 'dateTaken' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface IMediaRepository {
  // CRUD Operations
  findById(id: string): Promise<IMedia | null>;
  findByTreeId(treeId: string, options?: MediaQueryOptions): Promise<IMedia[]>;
  findByPersonId(personId: string, options?: MediaQueryOptions): Promise<IMedia[]>;
  create(data: CreateMediaData): Promise<IMedia>;
  update(id: string, data: UpdateMediaData): Promise<IMedia>;
  delete(id: string): Promise<void>;

  // Storage Key Operations
  findByStorageKey(storageKey: string): Promise<IMedia | null>;

  // Bulk Operations
  deleteByPersonId(personId: string): Promise<number>;
  deleteByTreeId(treeId: string): Promise<number>;

  // Queries
  countByTreeId(treeId: string): Promise<number>;
  countByPersonId(personId: string): Promise<number>;
  getTotalSizeByTreeId(treeId: string): Promise<number>;
}
```

**Edge Cases:**
- delete should trigger storage cleanup (via event/callback)
- findByStorageKey for deduplication
- getTotalSizeByTreeId for quota checking

### 6. IAuditRepository

**File:** `src/repositories/interfaces/IAuditRepository.ts`

```typescript
import { IAuditLog, CreateAuditLogData, AuditAction, EntityType } from '@/types/audit';

export interface AuditQueryOptions {
  limit?: number;
  offset?: number;
  action?: AuditAction;
  entityType?: EntityType;
  startDate?: Date;
  endDate?: Date;
}

export interface IAuditRepository {
  // Create Only (no update/delete for audit logs)
  create(data: CreateAuditLogData): Promise<IAuditLog>;

  // Queries
  findByTreeId(treeId: string, options?: AuditQueryOptions): Promise<IAuditLog[]>;
  findByUserId(userId: string, options?: AuditQueryOptions): Promise<IAuditLog[]>;
  findByEntityId(entityType: EntityType, entityId: string): Promise<IAuditLog[]>;

  // Counts
  countByTreeId(treeId: string, options?: AuditQueryOptions): Promise<number>;

  // Retention
  archiveOlderThan(date: Date): Promise<number>;
}
```

**Edge Cases:**
- No update or delete methods (immutable logs)
- archiveOlderThan for data retention
- Handle large result sets with pagination

---

## Input Validation

### Pre-conditions

- [ ] Task 04 completed (models defined)
- [ ] src/repositories/interfaces/ directory exists
- [ ] TypeScript types defined in src/types/

### Interface Design Principles

1. Return `null` for not found, not throw
2. Use specific query options types
3. Return domain types, not Mongoose documents
4. Include existence check methods
5. Include bulk operation methods

---

## Implementation Steps

### Step 1: Create Type Definitions First

Create `src/types/person.ts`:

```typescript
export interface IPerson {
  _id: string;
  treeId: string;
  firstName: string;
  lastName: string;
  // ... other fields
}

export interface CreatePersonData {
  treeId: string;
  firstName: string;
  lastName: string;
  // ... required fields only
}

export interface UpdatePersonData {
  firstName?: string;
  lastName?: string;
  // ... all fields optional
}
```

### Step 2: Create All Interface Files

### Step 3: Create Index Export

Create `src/repositories/interfaces/index.ts`:

```typescript
export * from './IUserRepository';
export * from './ITreeRepository';
export * from './IPersonRepository';
export * from './IRelationshipRepository';
export * from './IMediaRepository';
export * from './IAuditRepository';
```

### Step 4: Verify TypeScript Compilation

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] All 6 interfaces created
- [ ] All query options types defined
- [ ] All entity types defined in src/types/
- [ ] Index barrel export created
- [ ] TypeScript compilation succeeds
- [ ] Interfaces follow naming convention (IXxxRepository)

---

## Benefits of Repository Pattern

| Benefit | Description |
|---------|-------------|
| Testability | Easy to mock for unit tests |
| Flexibility | Swap implementations (MongoDB, PostgreSQL, etc.) |
| Separation | Business logic doesn't know about persistence |
| Consistency | Uniform data access patterns |
| Caching | Add caching layer transparently |
