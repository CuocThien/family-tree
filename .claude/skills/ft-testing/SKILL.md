---
name: ft-testing
description: Write unit, integration, and E2E tests for the Family Tree application. Use when: (1) Writing unit tests for services (src/services/**/*.test.ts), (2) Creating integration tests for multi-layer workflows (tests/integration/), (3) Building E2E tests with Playwright (tests/e2e/), (4) Setting up test fixtures or mock repositories, (5) Reviewing test coverage requirements.
---

# Family Tree Testing

## Test Types & Locations

| Type | Location | Purpose |
|------|----------|---------|
| Unit | `src/services/**/*.test.ts` | Test service logic in isolation |
| Integration | `tests/integration/` | Test multi-layer workflows |
| E2E | `tests/e2e/` | Test user flows in browser |

## Unit Testing Services

### Test Pattern

```typescript
// src/services/person/PersonService.test.ts
import { PersonService } from './PersonService';
import { MockPersonRepository } from '@/repositories/in-memory/PersonRepository';

describe('PersonService', () => {
  let personService: PersonService;
  let mockRepo: MockPersonRepository;

  beforeEach(() => {
    mockRepo = new MockPersonRepository();
    personService = new PersonService(
      mockRepo,
      mockPermissionService,
      mockAuditLogger
    );
  });

  describe('createPerson', () => {
    it('should create a person with valid data', async () => {
      const input = {
        treeId: 'tree-123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await personService.createPerson(input);

      expect(result.firstName).toBe('John');
      expect(mockRepo.create).toHaveBeenCalledWith(input);
    });

    it('should throw error if permission denied', async () => {
      mockPermissionService.checkPermission.mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(
        personService.createPerson({ treeId: 'tree-123', firstName: 'John', lastName: 'Doe' })
      ).rejects.toThrow('Permission denied');
    });
  });
});
```

## Mock Strategy

### Use In-Memory Repositories for Tests

```typescript
// src/repositories/in-memory/PersonRepository.ts
export class InMemoryPersonRepository implements IPersonRepository {
  private persons: Map<string, Person> = new Map();

  async create(data: PersonData): Promise<Person> {
    const person = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.persons.set(person.id, person);
    return person;
  }

  async findById(id: string): Promise<Person | null> {
    return this.persons.get(id) || null;
  }

  // ... implement all IPersonRepository methods
}
```

### Mock External Dependencies

```typescript
// Jest mock example
const mockPermissionService = {
  checkPermission: jest.fn(),
  canAccess: jest.fn()
};

const mockAuditLogger = {
  log: jest.fn()
};
```

## Testing SOLID Compliance

### Single Responsibility Test

Each test should test one behavior:

```typescript
// GOOD - one expectation per test
it('should create person with generated ID', () => { /* ... */ });
it('should call audit logger after creation', () => { /* ... */ });

// BAD - multiple assertions
it('should create person and update cache', () => {
  expect(result.id).toBeDefined();
  expect(mockCache.set).toHaveBeenCalled();
});
```

### Interface Segregation Test

Test only the methods your service uses:

```typescript
// If service only uses create and findById
it('should use create method', () => { /* ... */ });
it('should use findById method', () => { /* ... */ });
```

## Integration Testing

Test layer interactions:

```typescript
// tests/integration/person-creation.test.ts
describe('Person Creation Flow', () => {
  it('should create person through all layers', async () => {
    const input = { treeId: 'tree-123', firstName: 'John', lastName: 'Doe' };

    const result = await personService.createPerson(input);

    expect(result).toHaveProperty('id');
    const saved = await personRepo.findById(result.id);
    expect(saved).not.toBeNull();
  });
});
```

## E2E Testing with Playwright

```typescript
// tests/e2e/person-creation.spec.ts
import { test, expect } from '@playwright/test';

test('can create a new person in family tree', async ({ page }) => {
  await page.goto('/trees/tree-123');

  await page.click('button:has-text("Add Person")');
  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="lastName"]', 'Doe');
  await page.click('button:has-text("Save")');

  await expect(page.locator('.person-card:has-text("John Doe")')).toBeVisible();
});
```

## Test Coverage Requirements

- Service methods: 100% coverage
- Repository methods: 100% coverage
- Error paths: All error cases tested
- Permission checks: All roles tested

## Running Tests

```bash
# Unit tests
npm test -- src/services/**

# Integration tests
npm test -- tests/integration/**

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:coverage
```
