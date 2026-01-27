# Task 07: Create MongoDB Repository Implementations

**Phase:** 3 - Repository Layer
**Priority:** High
**Dependencies:** Task 04, Task 06
**Estimated Complexity:** High

---

## Objective

Implement all repository interfaces with MongoDB/Mongoose, following SOLID principles and ensuring proper error handling, query optimization, and transaction support.

---

## Requirements

### Implementations to Create

1. UserRepository
2. TreeRepository
3. PersonRepository
4. RelationshipRepository
5. MediaRepository
6. AuditRepository

### Design Principles

- Implement all interface methods
- Return plain objects (not Mongoose documents)
- Use lean() for read queries
- Proper error handling with meaningful messages
- Transaction support where needed

---

## Implementation Specifications

### 1. PersonRepository

**File:** `src/repositories/mongodb/PersonRepository.ts`

```typescript
import { Model } from 'mongoose';
import { PersonModel, IPersonDocument } from '@/models/Person';
import {
  IPersonRepository,
  PersonQueryOptions,
  PersonSearchCriteria,
} from '@/repositories/interfaces/IPersonRepository';
import { IPerson, CreatePersonData, UpdatePersonData } from '@/types/person';

export class PersonRepository implements IPersonRepository {
  constructor(private model: Model<IPersonDocument> = PersonModel) {}

  async findById(id: string): Promise<IPerson | null> {
    try {
      const doc = await this.model.findById(id).lean().exec();
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      if (this.isInvalidIdError(error)) {
        return null;
      }
      throw error;
    }
  }

  async findByTreeId(
    treeId: string,
    options: PersonQueryOptions = {}
  ): Promise<IPerson[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = options;

    const docs = await this.model
      .find({ treeId })
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    return docs.map(this.toEntity);
  }

  async create(data: CreatePersonData): Promise<IPerson> {
    const doc = await this.model.create(data);
    return this.toEntity(doc.toObject());
  }

  async update(id: string, data: UpdatePersonData): Promise<IPerson> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!doc) {
      throw new Error(`Person with id ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async search(
    treeId: string,
    criteria: PersonSearchCriteria
  ): Promise<IPerson[]> {
    const query: Record<string, unknown> = { treeId };

    if (criteria.firstName) {
      query.firstName = { $regex: criteria.firstName, $options: 'i' };
    }
    if (criteria.lastName) {
      query.lastName = { $regex: criteria.lastName, $options: 'i' };
    }
    if (criteria.birthYear) {
      query.birthDate = {
        $gte: new Date(criteria.birthYear, 0, 1),
        $lt: new Date(criteria.birthYear + 1, 0, 1),
      };
    }
    if (criteria.isLiving !== undefined) {
      query.isLiving = criteria.isLiving;
    }

    const docs = await this.model.find(query).lean().exec();
    return docs.map(this.toEntity);
  }

  async countByTreeId(treeId: string): Promise<number> {
    return this.model.countDocuments({ treeId }).exec();
  }

  async findByIds(ids: string[]): Promise<IPerson[]> {
    if (ids.length === 0) return [];

    const docs = await this.model
      .find({ _id: { $in: ids } })
      .lean()
      .exec();

    return docs.map(this.toEntity);
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.model.countDocuments({ _id: id }).exec();
      return count > 0;
    } catch {
      return false;
    }
  }

  async existsInTree(id: string, treeId: string): Promise<boolean> {
    try {
      const count = await this.model
        .countDocuments({ _id: id, treeId })
        .exec();
      return count > 0;
    } catch {
      return false;
    }
  }

  private toEntity(doc: Record<string, unknown>): IPerson {
    return {
      _id: doc._id.toString(),
      treeId: doc.treeId.toString(),
      firstName: doc.firstName as string,
      lastName: doc.lastName as string,
      middleName: doc.middleName as string | undefined,
      maidenName: doc.maidenName as string | undefined,
      nicknames: doc.nicknames as string[] | undefined,
      gender: doc.gender as string | undefined,
      birthDate: doc.birthDate as Date | undefined,
      birthPlace: doc.birthPlace as string | undefined,
      deathDate: doc.deathDate as Date | undefined,
      deathPlace: doc.deathPlace as string | undefined,
      isLiving: doc.isLiving as boolean,
      biography: doc.biography as string | undefined,
      occupation: doc.occupation as string | undefined,
      profilePhoto: doc.profilePhoto as string | undefined,
      createdBy: doc.createdBy?.toString(),
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }

  private isInvalidIdError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.name === 'CastError' &&
      error.message.includes('ObjectId')
    );
  }
}
```

---

## Test Specifications

### Unit Tests with Mocks

Create `tests/unit/repositories/PersonRepository.test.ts`:

```typescript
import { PersonRepository } from '@/repositories/mongodb/PersonRepository';
import { PersonModel } from '@/models/Person';

// Mock the model
jest.mock('@/models/Person', () => ({
  PersonModel: {
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('PersonRepository', () => {
  let repository: PersonRepository;
  const mockModel = PersonModel as jest.Mocked<typeof PersonModel>;

  beforeEach(() => {
    repository = new PersonRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return person when found', async () => {
      const mockPerson = {
        _id: '123',
        treeId: 'tree-1',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockModel.findById.mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve(mockPerson),
        }),
      } as any);

      const result = await repository.findById('123');

      expect(result).toEqual(expect.objectContaining({
        _id: '123',
        firstName: 'John',
      }));
    });

    it('should return null when not found', async () => {
      mockModel.findById.mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve(null),
        }),
      } as any);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for invalid ObjectId', async () => {
      mockModel.findById.mockReturnValue({
        lean: () => ({
          exec: () => Promise.reject(new Error('CastError: ObjectId')),
        }),
      } as any);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return person', async () => {
      const createData = {
        treeId: 'tree-1',
        firstName: 'John',
        lastName: 'Doe',
        isLiving: true,
        createdBy: 'user-1',
      };

      const mockDoc = {
        ...createData,
        _id: '123',
        toObject: () => ({ ...createData, _id: '123' }),
      };

      mockModel.create.mockResolvedValue(mockDoc as any);

      const result = await repository.create(createData);

      expect(result.firstName).toBe('John');
      expect(mockModel.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('findByIds', () => {
    it('should return empty array for empty input', async () => {
      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
      expect(mockModel.find).not.toHaveBeenCalled();
    });
  });
});
```

---

## Edge Cases by Repository

### PersonRepository Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Invalid ObjectId format | Return null, don't throw |
| Empty search criteria | Return all persons in tree |
| Very long name search | Escape regex special chars |
| Concurrent updates | Use findByIdAndUpdate atomicity |
| Delete non-existent | No-op (idempotent) |

### TreeRepository Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Add owner as collaborator | Throw validation error |
| Duplicate collaborator | Upsert or reject |
| Delete tree with persons | Cascade delete or reject |
| Update non-existent tree | Throw not found error |

### RelationshipRepository Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Self-relationship | Validation error |
| Duplicate relationship | Unique index prevents |
| Persons in different trees | Validation error |
| Orphaned relationships | Clean up on person delete |

### MediaRepository Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Storage key collision | Unique index prevents |
| Delete with storage cleanup | Emit event for cleanup |
| File size over limit | Validation error |
| Invalid MIME type | Validation error |

---

## Implementation Steps

### Step 1: Create Base Repository Class (Optional)

```typescript
// src/repositories/mongodb/BaseRepository.ts
export abstract class BaseRepository<T> {
  protected isInvalidIdError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.name === 'CastError' &&
      error.message.includes('ObjectId')
    );
  }
}
```

### Step 2: Implement Each Repository

1. PersonRepository (most methods)
2. TreeRepository (collaborator logic)
3. RelationshipRepository (graph queries)
4. UserRepository (password handling)
5. MediaRepository (storage key)
6. AuditRepository (create only)

### Step 3: Create Index Export

```typescript
// src/repositories/mongodb/index.ts
export { PersonRepository } from './PersonRepository';
export { TreeRepository } from './TreeRepository';
export { RelationshipRepository } from './RelationshipRepository';
export { UserRepository } from './UserRepository';
export { MediaRepository } from './MediaRepository';
export { AuditRepository } from './AuditRepository';
```

### Step 4: Write Unit Tests for All

### Step 5: Write Integration Tests

```typescript
// tests/integration/repositories/PersonRepository.integration.test.ts
describe('PersonRepository Integration', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await PersonModel.deleteMany({});
  });

  it('should perform full CRUD cycle', async () => {
    const repo = new PersonRepository();

    // Create
    const person = await repo.create({
      treeId: 'tree-1',
      firstName: 'John',
      lastName: 'Doe',
      isLiving: true,
      createdBy: 'user-1',
    });
    expect(person._id).toBeDefined();

    // Read
    const found = await repo.findById(person._id);
    expect(found?.firstName).toBe('John');

    // Update
    const updated = await repo.update(person._id, { firstName: 'Jane' });
    expect(updated.firstName).toBe('Jane');

    // Delete
    await repo.delete(person._id);
    const deleted = await repo.findById(person._id);
    expect(deleted).toBeNull();
  });
});
```

---

## Acceptance Criteria

- [ ] All 6 repositories implemented
- [ ] All interface methods implemented
- [ ] Unit tests with mocks passing
- [ ] Integration tests passing
- [ ] Proper error handling
- [ ] Query optimization (lean, indexes)
- [ ] TypeScript compilation succeeds

---

## Performance Considerations

| Query | Optimization |
|-------|--------------|
| findById | Use lean() |
| findByTreeId | Use index, pagination |
| search | Use text index or regex |
| countDocuments | Use estimatedDocumentCount for large collections |
| findByIds | Use $in with lean() |
