# Task 26: Unit & Integration Testing

**Status:** Pending
**Priority:** HIGH
**Estimated Time:** 26-33 hours
**Dependencies:** Task 24 (Critical Fixes) and Task 25 (Code Review) should be complete

## Overview

Improve test coverage from current ~35-40% to 80%+ by adding comprehensive unit and integration tests. This includes fixing existing failing tests, adding missing unit tests, and creating integration tests for API routes.

---

## Current State

### Existing Tests (606+ test cases)
- ✅ Hook tests: 4 files
- ✅ Repository tests: 2 files
- ✅ Strategy tests: 5 files
- ✅ Service tests: 2 files (PersonService failing, PermissionService passing)
- ✅ Component tests: 6 files
- ✅ Store tests: 3 files
- ❌ E2E tests: 0 files

### Test Coverage: ~35-40%
- Unit tests: Partial coverage
- Integration tests: Minimal (1 file)
- E2E tests: None

### Critical Issues
- PersonService.test.ts: 9 test failures
- TreeService: No tests
- RelationshipService: No tests
- MediaService: No tests
- AuthService: No tests
- API routes: No integration tests

---

## Implementation Plan

### Phase 1: Fix Existing Tests (3-4 hours)

#### Step 1.1: Fix PersonService Tests
**File:** `src/services/person/PersonService.test.ts`

**Issues:**
- 9 test failures due to missing Permission enum import
- Possible mocking issues

**Actions:**
1. Add missing imports
2. Review test setup and teardown
3. Verify mocks are correctly configured
4. Fix any additional issues found
5. Ensure all tests pass

#### Step 1.2: Review All Existing Tests
**Command:**
```bash
npm test -- --coverage
```

**Actions:**
1. Run all tests and identify failures
2. Fix any failing tests
3. Update tests that have become outdated
4. Remove tests for deprecated functionality

#### Step 1.3: Improve Test Configuration
**File:** `jest.config.js` or `vitest.config.ts`

**Actions:**
1. Review test configuration
2. Add proper setup files for database mocking
3. Configure coverage thresholds
4. Add test reporters for better output

---

### Phase 2: Add Missing Unit Tests (12-15 hours)

#### Step 2.1: TreeService Tests
**File:** `src/services/tree/TreeService.test.ts`

**Test Cases:**
- `createTree()` - Create a new family tree
- `getTreeById()` - Get tree by ID
- `getTreesByUserId()` - Get all trees for a user
- `updateTree()` - Update tree details
- `deleteTree()` - Delete a tree (cascade delete persons/relationships)
- `addPersonToTree()` - Add a person to a tree
- `removePersonFromTree()` - Remove a person from a tree
- `getTreeStatistics()` - Get tree stats (person count, etc.)
- `exportTree()` - Export tree to JSON
- `importTree()` - Import tree from JSON
- `shareTree()` - Share tree with another user
- `getSharedTrees()` - Get trees shared with user
- Permission checks on all operations

**Setup:**
```typescript
import { TreeService } from '../TreeService';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IPermissionService } from '../permission/IPermissionService';
import { Container } from '@/lib/di/Container';

// Mock repositories
const mockTreeRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  // ... other methods
};

const mockPersonRepository = {
  deleteByTreeId: jest.fn(),
  // ... other methods
};

const mockPermissionService = {
  checkPermission: jest.fn().mockResolvedValue(true),
  // ... other methods
};
```

#### Step 2.2: RelationshipService Tests
**File:** `src/services/relationship/RelationshipService.test.ts`

**Test Cases:**
- `createRelationship()` - Create parent-child, spouse, sibling relationships
- `getRelationshipsByPersonId()` - Get all relationships for a person
- `getRelationshipsByTreeId()` - Get all relationships in a tree
- `updateRelationship()` - Update relationship details
- `deleteRelationship()` - Delete a relationship
- `getAncestors()` - Get ancestors of a person
- `getDescendants()` - Get descendants of a person
- `getSiblings()` - Get siblings of a person
- `getSpouses()` - Get spouses of a person
- Permission checks on all operations

#### Step 2.3: MediaService Tests
**File:** `src/services/media/MediaService.test.ts`

**Test Cases:**
- `uploadMedia()` - Upload a file
- `getMediaById()` - Get media by ID
- `getMediaByPersonId()` - Get all media for a person
- `getMediaByTreeId()` - Get all media in a tree
- `deleteMedia()` - Delete media
- `associateMediaWithPerson()` - Link media to person
- `dissociateMediaFromPerson()` - Unlink media from person
- Storage strategy selection (local vs cloud)
- Permission checks on all operations

#### Step 2.4: AuthService Tests
**File:** `src/services/auth/AuthService.test.ts`

**Test Cases:**
- `register()` - User registration
- `login()` - User login with credentials
- `verifyEmail()` - Email verification
- `resetPassword()` - Password reset request
- `confirmPasswordReset()` - Password reset confirmation
- `changePassword()` - Password change for logged-in user
- `updateProfile()` - Profile update
- `deleteAccount()` - Account deletion
- `getSocialLoginUrl()` - Get OAuth URL
- `handleSocialCallback()` - Handle OAuth callback

#### Step 2.5: Repository Implementation Tests
**Files:**
- `src/repositories/mongodb/TreeRepository.test.ts`
- `src/repositories/mongodb/RelationshipRepository.test.ts`
- `src/repositories/mongodb/MediaRepository.test.ts`
- `src/repositories/mongodb/UserRepository.test.ts`

**Test Cases for each:**
- CRUD operations (Create, Read, Update, Delete)
- Query operations (findByX, search, filter)
- Database error handling
- MongoDB connection issues
- Transaction handling

#### Step 2.6: Additional Component Tests
**Priority Components:**
- TreeCanvas - Main tree visualization
- PersonForm - Form for creating/editing persons
- RelationshipForm - Form for creating relationships
- DashboardContent - Main dashboard
- SettingsPage - Account settings

**Test Cases:**
- Render correctly with props
- Handle user interactions
- Display loading states
- Display error states
- Form validation
- Event callbacks

---

### Phase 3: Add Integration Tests (8-10 hours)

#### Step 3.1: API Route Integration Tests
**Directory:** `tests/integration/api/`

**Test Files:**

**Trees API** (`tests/integration/api/trees.test.ts`)
```typescript
import { POST, GET, PUT, DELETE } from '@/app/api/trees/route';
import { GET, PUT, DELETE } from '@/app/api/trees/[id]/route';

describe('Trees API Integration Tests', () => {
  let testTreeId: string;
  let authToken: string;

  beforeAll(async () => {
    // Setup: Create test user and get auth token
    authToken = await getTestAuthToken();
  });

  describe('POST /api/trees', () => {
    it('should create a new tree', async () => {
      const response = await POST(
        new Request('http://localhost:3000/api/trees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            name: 'Test Family Tree',
            description: 'Test description',
          }),
        })
      );

      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      testTreeId = data.id;
    });

    it('should return 401 without auth', async () => {
      const response = await POST(
        new Request('http://localhost:3000/api/trees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Tree' }),
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/trees', () => {
    it('should get all trees for user', async () => {
      const response = await GET(
        new Request('http://localhost:3000/api/trees', {
          headers: { 'Authorization': `Bearer ${authToken}` },
        })
      );

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('GET /api/trees/[id]', () => {
    it('should get tree by id', async () => {
      const response = await GET(
        new Request(`http://localhost:3000/api/trees/${testTreeId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        })
      );

      const data = await response.json();
      expect(data.id).toBe(testTreeId);
    });
  });

  describe('PUT /api/trees/[id]', () => {
    it('should update tree', async () => {
      const response = await PUT(
        new Request(`http://localhost:3000/api/trees/${testTreeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ name: 'Updated Tree Name' }),
        })
      );

      const data = await response.json();
      expect(data.name).toBe('Updated Tree Name');
    });
  });

  describe('DELETE /api/trees/[id]', () => {
    it('should delete tree', async () => {
      const response = await DELETE(
        new Request(`http://localhost:3000/api/trees/${testTreeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` },
        })
      );

      expect(response.status).toBe(204);
    });
  });
});
```

**Persons API** (`tests/integration/api/persons.test.ts`)
- POST /api/persons - Create person
- GET /api/persons/[id] - Get person by ID
- PUT /api/persons/[id] - Update person
- DELETE /api/persons/[id] - Delete person
- GET /api/persons?treeId=X - Get all persons in tree

**Relationships API** (`tests/integration/api/relationships.test.ts`)
- POST /api/relationships - Create relationship
- GET /api/relationships/[id] - Get relationship
- PUT /api/relationships/[id] - Update relationship
- DELETE /api/relationships/[id] - Delete relationship

**Media API** (`tests/integration/api/media.test.ts`)
- POST /api/media/upload - Upload file
- GET /api/media/[id] - Get media
- DELETE /api/media/[id] - Delete media

**Dashboard API** (`tests/integration/api/dashboard.test.ts`)
- GET /api/dashboard - Get dashboard data

#### Step 3.2: Auth Flow Integration Tests
**File:** `tests/integration/auth/auth-flow.test.ts`

**Test Cases:**
```typescript
describe('Authentication Flow Integration Tests', () => {
  it('should complete full registration flow', async () => {
    // 1. Register new user
    // 2. Verify email is sent (mock)
    // 3. Login with credentials
    // 4. Verify session is created
    // 5. Access protected route
    // 6. Logout
  });

  it('should complete social login flow', async () => {
    // 1. Request social login URL
    // 2. Mock OAuth provider callback
    // 3. Verify user is created
    // 4. Verify session is created
  });

  it('should complete password reset flow', async () => {
    // 1. Request password reset
    // 2. Verify reset email is sent (mock)
    // 3. Submit reset with token
    // 4. Verify password is changed
    // 5. Login with new password
  });
});
```

#### Step 3.3: Permission System Integration Tests
**File:** `tests/integration/permissions/permission-flow.test.ts`

**Test Cases:**
```typescript
describe('Permission System Integration Tests', () => {
  it('should enforce owner permissions', async () => {
    // 1. Create tree as user A
    // 2. User B tries to modify (should fail)
    // 3. User A can modify (should succeed)
  });

  it('should enforce role-based permissions', async () => {
    // 1. Create tree with owner
    // 2. Add viewer user
    // 3. Viewer cannot modify
    // 4. Add editor user
    // 5. Editor can modify but cannot delete
  });

  it('should enforce attribute-based permissions', async () => {
    // 1. Set up custom permission rules
    // 2. Verify rules are enforced
  });
});
```

---

### Phase 4: Coverage Report & Gap Analysis (3-4 hours)

#### Step 4.1: Generate Coverage Report
```bash
npm test -- --coverage --coverageReporters='html' --coverageReporters='text'
```

**Actions:**
1. Open HTML coverage report: `coverage/index.html`
2. Identify files with low coverage
3. Identify uncovered branches
4. Identify uncovered lines

#### Step 4.2: Fill Coverage Gaps
**Priority Files for Coverage:**
- All service implementations (target: 90%+)
- All repository implementations (target: 80%+)
- Critical components (target: 80%+)
- API routes (target: 85%+)

**Actions:**
1. Create test cases for uncovered lines
2. Add edge case tests
3. Add error scenario tests
4. Add boundary condition tests

#### Step 4.3: Achieve 80%+ Coverage
**Target Metrics:**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

---

## Test Setup & Configuration

### Test Database Setup

**File:** `tests/setup/test-db.ts`

```typescript
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let client: MongoClient;

export async function setupTestDb() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function teardownTestDb() {
  await client.close();
  await mongod.stop();
}

export async function clearTestDatabase() {
  const db = client.db();
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
}

export function getTestDb() {
  return client.db();
}
```

### Test Utilities

**File:** `tests/utils/test-helpers.ts`

```typescript
import { getTestDb } from '../setup/test-db';

export async function createTestUser(overrides = {}) {
  const db = getTestDb();
  const user = {
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password: 'hashedpassword',
    ...overrides,
  };
  const result = await db.collection('users').insertOne(user);
  return { ...user, _id: result.insertedId };
}

export async function createTestTree(userId: string, overrides = {}) {
  const db = getTestDb();
  const tree = {
    name: 'Test Tree',
    ownerId: userId,
    ...overrides,
  };
  const result = await db.collection('trees').insertOne(tree);
  return { ...tree, _id: result.insertedId };
}

export async function createTestPerson(treeId: string, overrides = {}) {
  const db = getTestDb();
  const person = {
    treeId,
    name: 'Test Person',
    birthDate: new Date('1990-01-01'),
    ...overrides,
  };
  const result = await db.collection('persons').insertOne(person);
  return { ...person, _id: result.insertedId };
}

export async function getTestAuthToken() {
  // Create test user and return JWT token
  // Implementation depends on auth setup
  const user = await createTestUser();
  return generateTestToken(user);
}

function generateTestToken(user: any) {
  // Generate mock JWT for testing
  return 'mock-jwt-token';
}
```

---

## Acceptance Criteria

- [ ] PersonService tests pass (0 failures)
- [ ] TreeService has comprehensive test suite
- [ ] RelationshipService has comprehensive test suite
- [ ] MediaService has comprehensive test suite
- [ ] AuthService has comprehensive test suite
- [ ] All repository implementations have tests
- [ ] API routes have integration tests
- [ ] Auth flow has integration tests
- [ ] Permission system has integration tests
- [ ] Overall test coverage is 80%+
- [ ] All tests pass consistently

---

## Test Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test Files | 194 | 220+ |
| Test Cases | 606+ | 1000+ |
| Coverage | 35-40% | 80%+ |
| Unit Tests | Partial | Complete |
| Integration Tests | 1 file | 10+ files |
| Failing Tests | 9 | 0 |

---

## Next Steps

After completing this task:
1. Task 27: E2E Testing & Documentation
2. Deploy to staging for QA testing

---

## Notes

- Write tests before fixing bugs (TDD approach)
- Keep tests independent and isolated
- Use descriptive test names
- Test behavior, not implementation
- Mock external dependencies
- Use test database for integration tests
- Run tests in CI/CD pipeline
