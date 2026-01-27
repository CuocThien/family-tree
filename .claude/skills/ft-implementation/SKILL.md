---
name: ft-implementation
description: Implement services, repositories, components, and API routes following SOLID principles for the Family Tree Next.js application. Use when: (1) Writing new service layer code (src/services/), (2) Creating repository implementations (src/repositories/mongodb/), (3) Building React components (src/components/), (4) Adding API routes (src/app/api/), (5) Implementing business logic that follows the layered architecture pattern.
---

# Family Tree Implementation

## Implementation Order

Always implement in this order:

1. **Types/DTOs** - Define data structures first
2. **Models** - Database schemas
3. **Repository Interface** - Contract for data access
4. **Repository Implementation** - MongoDB data access
5. **Service Interface** - Contract for business logic
6. **Service Implementation** - Business logic with DI
7. **Components** - UI layer
8. **API Routes** - Controller layer

## Code Templates

### Service Implementation Template

```typescript
// src/services/{domain}/I{Domain}Service.ts
export interface I{Domain}Service {
  create(data: Create{Domain}Dto): Promise<{Domain}>;
  update(id: string, data: Update{Domain}Dto): Promise<{Domain}>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<{Domain} | null>;
  findByTreeId(treeId: string): Promise<{Domain}[]>;
}

// src/services/{domain}/{Domain}Service.ts
export class {Domain}Service implements I{Domain}Service {
  constructor(
    private {domain}Repo: I{Domain}Repository,
    private permissionService: IPermissionService,
    private auditLogger: IAuditLogger
  ) {}

  async create(data: Create{Domain}Dto): Promise<{Domain}> {
    // 1. Check permissions
    await this.permissionService.checkPermission(data.treeId, 'create');

    // 2. Create entity
    const {domain} = await this.{domain}Repo.create(data);

    // 3. Log audit
    await this.auditLogger.log({
      action: '{domain}.created',
      entityId: {domain}.id,
      treeId: data.treeId
    });

    return {domain};
  }

  // ... other methods
}
```

### Repository Implementation Template

```typescript
// src/repositories/interfaces/I{Domain}Repository.ts
export interface I{Domain}Repository {
  create(data: {Domain}Data): Promise<{Domain}>;
  update(id: string, data: Partial<{Domain}Data>): Promise<{Domain}>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<{Domain} | null>;
  findByTreeId(treeId: string): Promise<{Domain}[]>;
}

// src/repositories/mongodb/{Domain}Repository.ts
export class {Domain}Repository implements I{Domain}Repository {
  constructor(private model: Model<{Domain}Document>) {}

  async create(data: {Domain}Data): Promise<{Domain}> {
    const doc = await this.model.create(data);
    return this.toDomain(doc);
  }

  async findById(id: string): Promise<{Domain} | null> {
    const doc = await this.model.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  private toDomain(doc: {Domain}Document): {Domain} {
    return {
      id: doc._id.toString(),
      // ... map fields
    };
  }
}
```

## SOLID Principles Checklist

- [ ] **SRP**: Does this class have one responsibility?
- [ ] **OCP**: Can I extend this without modifying it?
- [ ] **LSP**: Are subclasses substitutable for base?
- [ ] **ISP**: Are interfaces focused (not fat)?
- [ ] **DIP**: Do I depend on interfaces, not concretions?

## Dependency Injection

Always inject dependencies via constructor:

```typescript
// GOOD
constructor(
  private personRepo: IPersonRepository,
  private relationshipRepo: IRelationshipRepository
) {}

// BAD - tight coupling
constructor() {
  this.personRepo = new PersonRepository();
}
```

## File Structure Compliance

| Feature Type | Location |
|--------------|----------|
| Service Interface | `src/services/{domain}/I{Domain}Service.ts` |
| Service Implementation | `src/services/{domain}/{Domain}Service.ts` |
| Repository Interface | `src/repositories/interfaces/I{Domain}Repository.ts` |
| Repository Implementation | `src/repositories/mongodb/{Domain}Repository.ts` |
| Model | `src/models/{Domain}.ts` |
| Component | `src/components/{feature}/{Domain}{Component}.tsx` |
| API Route | `src/app/api/{resource}/route.ts` |

## Error Handling

- Use try/catch in services
- Log errors with auditLogger
- Throw domain-specific errors
- Let API routes handle HTTP responses

## TypeScript Requirements

- Always use explicit return types
- Use interfaces for object shapes
- Use type aliases for unions/intersections
- Export all public types
