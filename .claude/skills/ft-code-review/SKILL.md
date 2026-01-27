---
name: ft-code-review
description: Review code changes for SOLID principles compliance and architectural consistency in the Family Tree application. Use when: (1) Reviewing PRs or code changes before commit, (2) Checking if new code follows SOLID principles, (3) Validating architectural patterns (service/repository layers), (4) Ensuring file structure compliance, (5) Identifying code smells or anti-patterns in the codebase.
---

# Family Tree Code Review

## Review Checklist

### 1. Single Responsibility Principle (SRP)

- [ ] Does the class have one reason to change?
- [ ] Are unrelated responsibilities separated?
- [ ] Is the class focused on a single domain concern?

**Red Flags:**
- Class handles both business logic and data access
- Service handles multiple unrelated domains
- Component handles both display and state management

**Check:**
```typescript
// BAD - Multiple responsibilities
class PersonService {
  createPerson() { /* ... */ }  // Person logic
  sendEmail() { /* ... */ }      // Email logic - WRONG!
  cacheData() { /* ... */ }      // Caching logic - WRONG!
}

// GOOD - Single responsibility
class PersonService {
  createPerson() { /* ... */ }  // Person logic only
}

// Separate services for other concerns
class EmailService { sendEmail() { /* ... */ } }
class CacheService { set() { /* ... */ } }
```

### 2. Open/Closed Principle (OCP)

- [ ] Can new features be added without modifying existing code?
- [ ] Are extensions done via inheritance/composition?
- [ ] Are strategies/interfaces used for extensibility?

**Red Flags:**
- Frequent modifications to existing classes
- Large switch statements for type handling
- Hard-coded types that require class changes

**Check:**
```typescript
// GOOD - Open for extension
interface ITreeVisualizationStrategy {
  render(tree: FamilyTree): VisualizationResult;
}

class VerticalTreeStrategy implements ITreeVisualizationStrategy { }
class HorizontalTreeStrategy implements ITreeVisualizationStrategy { }

// Add new strategy without modifying existing code
class TimelineTreeStrategy implements ITreeVisualizationStrategy { }
```

### 3. Liskov Substitution Principle (LSP)

- [ ] Can derived classes replace base classes?
- [ ] Are preconditions not strengthened in subclasses?
- [ ] Are postconditions not weakened in subclasses?

**Red Flags:**
- Derived classes throw unexpected exceptions
- Method signatures change unexpectedly
- Return types differ between base and derived

**Check:**
```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
}

// All implementations must follow the contract
class PersonRepository implements IRepository<Person> { }
class TreeRepository implements IRepository<FamilyTree> { }
```

### 4. Interface Segregation Principle (ISP)

- [ ] Are interfaces focused and small?
- [ ] Do clients not depend on methods they don't use?
- [ ] Are fat interfaces split into smaller ones?

**Red Flags:**
- Interface with 20+ methods
- Classes implementing interfaces with unused methods
- Common interface for unrelated operations

**Check:**
```typescript
// BAD - Fat interface
interface IPersonOperations {
  create(): void;
  update(): void;
  delete(): void;
  uploadPhoto(): void;  // Not used by all
  generateReport(): void;  // Not used by all
}

// GOOD - Segregated interfaces
interface IPersonCRUD {
  create(): void;
  update(): void;
  delete(): void;
}

interface IPersonMedia {
  uploadPhoto(): void;
}

interface IPersonReporting {
  generateReport(): void;
}
```

### 5. Dependency Inversion Principle (DIP)

- [ ] Do high-level modules depend on abstractions?
- [ ] Are concrete implementations injected?
- [ ] Are concrete class names not hard-coded?

**Red Flags:**
- `new SomeClass()` inside service
- Direct instantiation of repositories in controllers
- Hard-coded dependencies

**Check:**
```typescript
// GOOD - Depends on abstraction
class PersonService {
  constructor(
    private personRepo: IPersonRepository,
    private relationshipRepo: IRelationshipRepository
  ) {}
}

// BAD - Depends on concretion
class PersonService {
  private personRepo = new PersonRepository();  // WRONG!
}
```

## Architecture Compliance

### File Structure Check

| Change Type | Expected Location | Check |
|-------------|-------------------|-------|
| New service | `src/services/{domain}/` | Interface + Implementation present? |
| New repository | `src/repositories/mongodb/` | Interface in `interfaces/`? |
| New model | `src/models/` | Types exported? |
| New component | `src/components/{feature}/` | Props interface defined? |
| API route | `src/app/api/{resource}/` | Uses service interface? |

### Naming Conventions

- [ ] Services: `PascalCase` with `Service` suffix
- [ ] Interfaces: `I` prefix (`IPersonService`)
- [ ] Repositories: `PascalCase` with `Repository` suffix
- [ ] Components: `PascalCase` with component type suffix

### Dependency Injection

- [ ] All services receive dependencies via constructor
- [ ] Interfaces used for all injected dependencies
- [ ] No `new` keyword for creating dependencies in classes

## Review Process

1. **Read the changes** - Understand what was modified
2. **Check SOLID compliance** - Apply each principle check
3. **Verify file structure** - Confirm correct locations
4. **Check tests** - Are tests added/modified?
5. **Look for code smells** - Long methods, deep nesting, duplication
6. **Provide actionable feedback** - Specific suggestions with examples

## Code Quality Standards

- [ ] Explicit return types on all functions
- [ ] No `any` types - use proper types or `unknown`
- [ ] Error handling with proper error types
- [ ] Async/await used consistently (no mixing with .then())
- [ ] Meaningful variable and function names
- [ ] Comments for complex logic (not for obvious code)

## Common Issues to Flag

| Issue | Example | Fix |
|-------|---------|-----|
| God class | `PersonService` with 500 lines | Split into smaller services |
| Fat interface | `IPersonService` with 30 methods | Split into focused interfaces |
| Hard-coded deps | `new PersonRepository()` in service | Inject via constructor |
| Mixed concerns | Service doing DB + business logic | Separate layers |
| No abstraction | Direct MongoDB calls in controller | Use repository pattern |
