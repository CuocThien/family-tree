# Task 03: Create Directory Structure

**Phase:** 1 - Project Foundation
**Priority:** Critical
**Dependencies:** Task 01, Task 02
**Estimated Complexity:** Low

---

## Objective

Create the complete directory structure following layered architecture principles (Presentation, Service, Repository, Data layers).

---

## Requirements

### Architecture Layers

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│    (Next.js App Router + Components)    │
├─────────────────────────────────────────┤
│            Service Layer                │
│     (Business Logic + Interfaces)       │
├─────────────────────────────────────────┤
│           Repository Layer              │
│    (Data Access + Abstractions)         │
├─────────────────────────────────────────┤
│             Data Layer                  │
│      (MongoDB/Mongoose Models)          │
└─────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── trees/                # Family tree CRUD
│   │   ├── persons/              # Person CRUD
│   │   ├── relationships/        # Relationship management
│   │   └── media/                # Media upload/retrieval
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── register/
│   └── (dashboard)/              # Protected route group
│       ├── trees/
│       └── profile/
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── tree/                     # Tree visualization
│   ├── person/                   # Person management
│   ├── relationship/             # Relationship UI
│   ├── shared/                   # Shared components
│   └── providers/                # Context providers
├── services/                     # Business logic
│   ├── person/
│   ├── tree/
│   ├── relationship/
│   ├── auth/
│   ├── media/
│   ├── permission/
│   ├── collaboration/
│   └── audit/
├── repositories/                 # Data access
│   ├── interfaces/               # Repository contracts
│   ├── mongodb/                  # MongoDB implementations
│   └── in-memory/                # Test implementations
├── models/                       # Mongoose models
├── lib/                          # Utilities
│   ├── db/                       # Database connection
│   ├── di/                       # Dependency injection
│   ├── strategies/               # Strategy pattern
│   │   ├── visualization/
│   │   ├── storage/
│   │   └── permission/
│   └── utils/                    # Helper functions
├── hooks/                        # Custom React hooks
├── store/                        # Zustand stores
├── types/                        # TypeScript types
│   └── dtos/                     # Data transfer objects
└── styles/                       # Global styles
tests/
├── unit/                         # Unit tests
├── integration/                  # Integration tests
└── e2e/                          # End-to-end tests
```

---

## Input Validation

### Pre-conditions

- [ ] Tasks 01 and 02 completed
- [ ] src/ directory exists
- [ ] No conflicting directories exist

### Validation Steps

```bash
# Verify src directory exists
ls -la src/

# Check for conflicts
find src -type d -name "services" 2>/dev/null
```

---

## Implementation Steps

### Step 1: Create Core Directories

```bash
cd /Users/nguyenhuukhai/Project/family-tree

# Create all directories
mkdir -p \
  src/app/api/auth \
  src/app/api/trees \
  src/app/api/persons \
  src/app/api/relationships \
  src/app/api/media \
  "src/app/(auth)/login" \
  "src/app/(auth)/register" \
  "src/app/(dashboard)/trees" \
  "src/app/(dashboard)/trees/new" \
  "src/app/(dashboard)/trees/[id]" \
  "src/app/(dashboard)/profile" \
  src/components/ui \
  src/components/tree \
  src/components/person \
  src/components/relationship \
  src/components/shared \
  src/components/providers \
  src/services/person \
  src/services/tree \
  src/services/relationship \
  src/services/auth \
  src/services/media \
  src/services/permission \
  src/services/collaboration \
  src/services/audit \
  src/repositories/interfaces \
  src/repositories/mongodb \
  src/repositories/in-memory \
  src/models \
  src/lib/db \
  src/lib/di \
  src/lib/strategies/visualization \
  src/lib/strategies/storage \
  src/lib/strategies/permission \
  src/lib/utils \
  src/hooks \
  src/store \
  src/types/dtos \
  src/styles \
  tests/unit/models \
  tests/unit/services \
  tests/unit/repositories \
  tests/unit/lib \
  tests/integration \
  tests/e2e
```

### Step 2: Create .gitkeep Files

```bash
# Add .gitkeep to empty directories
find src tests -type d -empty -exec touch {}/.gitkeep \;
```

### Step 3: Create Index Files for Exports

Create barrel exports for clean imports:

**src/components/ui/index.ts:**
```typescript
// UI Component exports
export * from './Button';
export * from './Input';
export * from './Card';
export * from './Modal';
```

**src/services/index.ts:**
```typescript
// Service exports
export * from './person/PersonService';
export * from './tree/TreeService';
export * from './relationship/RelationshipService';
```

**src/repositories/interfaces/index.ts:**
```typescript
// Repository interface exports
export * from './IPersonRepository';
export * from './ITreeRepository';
export * from './IRelationshipRepository';
```

### Step 4: Verify Structure

```bash
# List all directories
find src -type d | sort

# Count directories
find src -type d | wc -l
# Expected: ~45 directories
```

---

## Edge Cases

### EC-1: Directory Already Exists

**Scenario:** Running mkdir on existing directory
**Detection:** No error (mkdir -p is idempotent)
**Resolution:** mkdir -p handles this automatically

### EC-2: Permission Denied

**Scenario:** Cannot create directories
**Detection:** "Permission denied" error
**Resolution:** Check file permissions, run with correct user

### EC-3: Path Too Long

**Scenario:** On Windows, path exceeds MAX_PATH
**Detection:** ENAMETOOLONG error
**Resolution:** Enable long paths or use shorter names

### EC-4: Special Characters in Paths

**Scenario:** Route groups with () cause issues
**Detection:** Shell escaping problems
**Resolution:** Quote paths with special characters

---

## Directory Purposes

| Directory | Layer | Purpose |
|-----------|-------|---------|
| src/app/ | Presentation | Next.js routing and pages |
| src/components/ | Presentation | Reusable UI components |
| src/services/ | Service | Business logic implementation |
| src/repositories/ | Repository | Data access abstraction |
| src/models/ | Data | MongoDB schema definitions |
| src/lib/di/ | Infrastructure | Dependency injection setup |
| src/lib/strategies/ | Service | Strategy pattern implementations |
| src/types/ | Cross-cutting | TypeScript type definitions |
| src/hooks/ | Presentation | Custom React hooks |
| src/store/ | Presentation | Zustand state stores |
| tests/ | Testing | All test files |

---

## Acceptance Criteria

- [ ] All directories created successfully
- [ ] Directory structure matches architecture diagram
- [ ] No permission errors
- [ ] .gitkeep files in empty directories
- [ ] Structure survives `git status` check

---

## Rollback Plan

```bash
# Remove all created directories (careful!)
rm -rf src/services src/repositories src/models src/lib src/hooks src/store src/types tests
```

---

## SOLID Principles Alignment

| Directory | SOLID Principle |
|-----------|-----------------|
| services/*/ | Single Responsibility - each service handles one domain |
| repositories/interfaces/ | Dependency Inversion - depend on abstractions |
| repositories/mongodb/ | Open/Closed - extend without modifying |
| lib/strategies/ | Liskov Substitution - interchangeable strategies |
| types/dtos/ | Interface Segregation - focused data shapes |
