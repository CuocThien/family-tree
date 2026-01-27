# Task 09: Create Service Implementations

**Phase:** 4 - Service Layer
**Priority:** High
**Dependencies:** Task 08 (Service Interfaces), Task 07 (MongoDB Repositories)
**Estimated Complexity:** High

---

## Objective

Implement concrete service classes that encapsulate business logic, orchestrate repositories, and enforce domain rules. Services are the core of the application logic.

---

## Requirements

### Functional Requirements

1. Implement all 7 service interfaces from Task 08
2. Inject repository dependencies via constructor
3. Implement comprehensive input validation
4. Handle all business rules and domain logic
5. Emit events for side effects (audit logging)

### Non-Functional Requirements

1. Services must be stateless
2. All public methods must validate inputs
3. Use transactions for multi-entity operations
4. Log all operations for audit trail
5. Handle errors gracefully with meaningful messages

---

## Implementation Specifications

### 1. PersonService

**File:** `src/services/person/PersonService.ts`

```typescript
import { IPersonService, PersonSearchParams, PersonListResult } from './IPersonService';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditLogRepository } from '@/repositories/interfaces/IAuditLogRepository';
import { CreatePersonDto, UpdatePersonDto, CreatePersonDtoSchema } from '@/types/dtos/person';
import { IPerson } from '@/types/person';

export class PersonService implements IPersonService {
  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly permissionService: IPermissionService,
    private readonly auditLogRepository: IAuditLogRepository
  ) {}

  async createPerson(treeId: string, userId: string, data: CreatePersonDto): Promise<IPerson> {
    // 1. Check permission
    const canAdd = await this.permissionService.canAccess(userId, treeId, Permission.ADD_PERSON);
    if (!canAdd) {
      throw new Error('Permission denied: Cannot add person to this tree');
    }

    // 2. Validate input
    const errors = await this.validatePersonData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // 3. Sanitize inputs
    const sanitizedData = this.sanitizePersonData(data);

    // 4. Create person
    const person = await this.personRepository.create({
      ...sanitizedData,
      treeId,
      createdBy: userId,
    });

    // 5. Audit log
    await this.auditLogRepository.create({
      action: 'CREATE',
      entityType: 'Person',
      entityId: person._id,
      userId,
      treeId,
      changes: { after: person },
    });

    return person;
  }

  async validatePersonData(data: CreatePersonDto | UpdatePersonDto): Promise<string[]> {
    const errors: string[] = [];

    // Validate with Zod schema
    const result = CreatePersonDtoSchema.safeParse(data);
    if (!result.success) {
      errors.push(...result.error.errors.map(e => e.message));
    }

    // Additional business rules
    if (data.birthDate && data.deathDate) {
      if (new Date(data.deathDate) < new Date(data.birthDate)) {
        errors.push('Death date cannot be before birth date');
      }
    }

    if (data.birthDate && new Date(data.birthDate) > new Date()) {
      errors.push('Birth date cannot be in the future');
    }

    return errors;
  }

  private sanitizePersonData(data: CreatePersonDto): CreatePersonDto {
    return {
      ...data,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      middleName: data.middleName?.trim(),
      biography: data.biography?.trim(),
    };
  }
}
```

### 2. TreeService

**File:** `src/services/tree/TreeService.ts`

```typescript
export class TreeService implements ITreeService {
  constructor(
    private readonly treeRepository: ITreeRepository,
    private readonly personRepository: IPersonRepository,
    private readonly relationshipRepository: IRelationshipRepository,
    private readonly mediaRepository: IMediaRepository,
    private readonly permissionService: IPermissionService,
    private readonly auditLogRepository: IAuditLogRepository
  ) {}

  async deleteTree(treeId: string, userId: string): Promise<void> {
    // 1. Check ownership (only owner can delete)
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      throw new Error('Tree not found');
    }
    if (tree.ownerId !== userId) {
      throw new Error('Only tree owner can delete');
    }

    // 2. Delete all related data (cascade)
    await this.relationshipRepository.deleteByTreeId(treeId);
    await this.personRepository.deleteByTreeId(treeId);
    await this.mediaRepository.deleteByTreeId(treeId);

    // 3. Delete tree
    await this.treeRepository.delete(treeId);

    // 4. Audit log
    await this.auditLogRepository.create({
      action: 'DELETE',
      entityType: 'Tree',
      entityId: treeId,
      userId,
      changes: { before: tree },
    });
  }

  async getTreeStats(treeId: string, userId: string): Promise<TreeStats> {
    const canView = await this.permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new Error('Permission denied');
    }

    const [persons, relationships, media] = await Promise.all([
      this.personRepository.findByTreeId(treeId),
      this.relationshipRepository.findByTreeId(treeId),
      this.mediaRepository.findByTreeId(treeId),
    ]);

    const oldestPerson = persons.reduce((oldest, person) => {
      if (!person.birthDate) return oldest;
      if (!oldest?.birthDate) return person;
      return new Date(person.birthDate) < new Date(oldest.birthDate) ? person : oldest;
    }, null as IPerson | null);

    return {
      memberCount: persons.length,
      relationshipCount: relationships.length,
      mediaCount: media.length,
      oldestPerson: oldestPerson || undefined,
      generations: this.calculateGenerations(persons, relationships),
    };
  }
}
```

### 3. RelationshipService

**File:** `src/services/relationship/RelationshipService.ts`

```typescript
export class RelationshipService implements IRelationshipService {
  constructor(
    private readonly relationshipRepository: IRelationshipRepository,
    private readonly personRepository: IPersonRepository,
    private readonly permissionService: IPermissionService
  ) {}

  async createRelationship(
    treeId: string,
    userId: string,
    data: CreateRelationshipDto
  ): Promise<IRelationship> {
    // 1. Permission check
    const canAdd = await this.permissionService.canAccess(userId, treeId, Permission.ADD_RELATIONSHIP);
    if (!canAdd) {
      throw new Error('Permission denied');
    }

    // 2. Validate persons exist and belong to same tree
    const [fromPerson, toPerson] = await Promise.all([
      this.personRepository.findById(data.fromPersonId),
      this.personRepository.findById(data.toPersonId),
    ]);

    if (!fromPerson || !toPerson) {
      throw new Error('One or both persons not found');
    }

    if (fromPerson.treeId !== treeId || toPerson.treeId !== treeId) {
      throw new Error('Persons must belong to the same tree');
    }

    // 3. Validate relationship rules
    const validationErrors = await this.validateRelationship(data);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid relationship: ${validationErrors.join(', ')}`);
    }

    // 4. Check for cycles
    const hasCycle = await this.checkForCycles(data.fromPersonId, data.toPersonId, data.type);
    if (hasCycle) {
      throw new Error('This relationship would create an impossible cycle');
    }

    // 5. Create relationship
    return this.relationshipRepository.create({ ...data, treeId });
  }

  async checkForCycles(
    fromPersonId: string,
    toPersonId: string,
    type: RelationshipType
  ): Promise<boolean> {
    if (type !== 'parent') return false;

    // Check if toPerson is already an ancestor of fromPerson
    const ancestors = await this.getAncestorIds(fromPersonId, new Set());
    return ancestors.has(toPersonId);
  }

  private async getAncestorIds(personId: string, visited: Set<string>): Promise<Set<string>> {
    if (visited.has(personId)) return visited;
    visited.add(personId);

    const parentRelationships = await this.relationshipRepository.findByPersonId(personId);
    const parents = parentRelationships.filter(r => r.type === 'parent' && r.toPersonId === personId);

    for (const parent of parents) {
      await this.getAncestorIds(parent.fromPersonId, visited);
    }

    return visited;
  }
}
```

### 4. AuthService

**File:** `src/services/auth/AuthService.ts`

```typescript
import bcrypt from 'bcryptjs';

export class AuthService implements IAuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async register(data: RegisterDto): Promise<AuthResult> {
    // 1. Check if email exists
    const existingUser = await this.userRepository.findByEmail(data.email.toLowerCase());
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // 2. Validate password strength
    const passwordErrors = this.validatePassword(data.password);
    if (passwordErrors.length > 0) {
      throw new Error(`Weak password: ${passwordErrors.join(', ')}`);
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.BCRYPT_ROUNDS);

    // 4. Create user
    const user = await this.userRepository.create({
      name: data.fullName.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      isVerified: false,
    });

    // 5. Send verification email
    const verificationToken = this.generateToken();
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return { user };
  }

  private validatePassword(password: string): string[] {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters required');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter required');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter required');
    if (!/[0-9]/.test(password)) errors.push('One number required');
    return errors;
  }
}
```

### 5. MediaService

**File:** `src/services/media/MediaService.ts`

```typescript
export class MediaService implements IMediaService {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf',
  ];

  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly storageStrategy: IStorageStrategy,
    private readonly permissionService: IPermissionService
  ) {}

  async uploadMedia(userId: string, data: UploadMediaDto): Promise<MediaUploadResult> {
    // 1. Validate file
    const validationErrors = await this.validateFile(data.file, data.mimeType);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid file: ${validationErrors.join(', ')}`);
    }

    // 2. Check permission
    const canUpload = await this.permissionService.canAccess(userId, data.treeId, Permission.EDIT_TREE);
    if (!canUpload) {
      throw new Error('Permission denied');
    }

    // 3. Upload to storage
    const uploadResult = await this.storageStrategy.upload(data.file, {
      filename: data.filename,
      mimeType: data.mimeType,
      folder: `trees/${data.treeId}/media`,
    });

    // 4. Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (data.mimeType.startsWith('image/')) {
      thumbnailUrl = await this.generateThumbnail(uploadResult.url);
    }

    // 5. Create media record
    const media = await this.mediaRepository.create({
      treeId: data.treeId,
      personId: data.personId,
      type: this.getMediaType(data.mimeType),
      url: uploadResult.url,
      thumbnailUrl,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.file.length,
      title: data.title,
      description: data.description,
      dateTaken: data.dateTaken,
      uploadedBy: userId,
    });

    return { media, url: uploadResult.url, thumbnailUrl };
  }

  async validateFile(file: Buffer, mimeType: string): Promise<string[]> {
    const errors: string[] = [];

    if (file.length > this.MAX_FILE_SIZE) {
      errors.push(`File too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      errors.push(`File type not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`);
    }

    return errors;
  }
}
```

---

## Business Rules

### PersonService Rules

| Rule | Description |
|------|-------------|
| Date validation | Birth date must be before death date |
| Future dates | Birth date cannot be in the future |
| Living status | If death date set, isLiving must be false |
| Name requirements | First and last name required, max 100 chars |
| Tree membership | Person must belong to exactly one tree |

### TreeService Rules

| Rule | Description |
|------|-------------|
| Ownership | Only owner can delete tree |
| Cascade delete | Deleting tree removes all persons, relationships, media |
| Export privacy | Export respects living person privacy |
| Collaborator limits | Max 50 collaborators per tree |

### RelationshipService Rules

| Rule | Description |
|------|-------------|
| No self-reference | Cannot create relationship with self |
| Same tree | Both persons must be in same tree |
| No duplicates | Cannot have duplicate relationships |
| Cycle prevention | Cannot be own ancestor/descendant |
| Max parents | Person can have max 2 biological parents |

---

## Edge Cases

### PersonService Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Unicode names | Allow, validate length correctly |
| Empty optional fields | Allow null, don't store empty strings |
| Very old birth dates | Allow dates back to year 1000 |
| Future death dates | Allow (for expected deaths) |
| Missing tree | Throw "Tree not found" error |
| Concurrent updates | Use optimistic locking |

### TreeService Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Delete with collaborators | Notify collaborators first |
| Export large tree | Stream response, paginate |
| Empty tree | Allow, provide empty state |
| Duplicate tree names | Allow, user can have multiple |
| Import malformed data | Validate strictly, reject invalid |

### RelationshipService Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Multiple parents | Allow (adoption scenarios) |
| Same-sex parents | Allow |
| Complex cycles | Deep traversal with visited set |
| Step-relationships | Use 'step-parent' type |
| Half-siblings | Calculate correctly from parents |

---

## Error Handling

```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class BusinessRuleError extends Error {
  constructor(rule: string) {
    super(`Business rule violation: ${rule}`);
    this.name = 'BusinessRuleError';
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('PersonService', () => {
  let service: PersonService;
  let mockPersonRepo: jest.Mocked<IPersonRepository>;
  let mockPermissionService: jest.Mocked<IPermissionService>;

  beforeEach(() => {
    mockPersonRepo = createMock<IPersonRepository>();
    mockPermissionService = createMock<IPermissionService>();
    service = new PersonService(mockPersonRepo, mockPermissionService);
  });

  describe('createPerson', () => {
    it('should create person when valid data provided', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.create.mockResolvedValue(mockPerson);

      const result = await service.createPerson(treeId, userId, validData);

      expect(result).toEqual(mockPerson);
      expect(mockPersonRepo.create).toHaveBeenCalled();
    });

    it('should throw when permission denied', async () => {
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.createPerson(treeId, userId, validData))
        .rejects.toThrow('Permission denied');
    });

    it('should throw when death date before birth date', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);

      await expect(service.createPerson(treeId, userId, invalidDates))
        .rejects.toThrow('Death date cannot be before birth date');
    });
  });
});
```

---

## Acceptance Criteria

- [ ] All 7 service implementations created
- [ ] Constructor dependency injection
- [ ] Input validation with Zod schemas
- [ ] Permission checks on all operations
- [ ] Audit logging for all mutations
- [ ] Custom error classes used
- [ ] Unit tests with >80% coverage
- [ ] Integration tests for service interactions
- [ ] TypeScript compilation succeeds
- [ ] All business rules enforced
