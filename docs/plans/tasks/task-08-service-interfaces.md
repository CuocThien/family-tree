# Task 08: Create Service Interfaces

**Phase:** 4 - Service Layer
**Priority:** High
**Dependencies:** Task 06
**Estimated Complexity:** Medium

---

## Objective

Define service layer interfaces that encapsulate business logic. Services orchestrate repositories and implement domain rules, validation, and cross-cutting concerns.

---

## Requirements

### Service Layer Responsibilities

1. Business logic implementation
2. Input validation and sanitization
3. Authorization checks
4. Cross-entity coordination
5. Event emission for side effects
6. Caching coordination

### Interfaces to Create

1. IPersonService
2. ITreeService
3. IRelationshipService
4. IAuthService
5. IMediaService
6. IPermissionService
7. ICollaborationService

---

## Interface Specifications

### 1. IPersonService

**File:** `src/services/person/IPersonService.ts`

```typescript
import { IPerson } from '@/types/person';
import { CreatePersonDto, UpdatePersonDto } from '@/types/dtos/person';

export interface PersonSearchParams {
  query?: string;
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  isLiving?: boolean;
  page?: number;
  limit?: number;
}

export interface PersonListResult {
  persons: IPerson[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IPersonService {
  // CRUD Operations
  createPerson(treeId: string, userId: string, data: CreatePersonDto): Promise<IPerson>;
  updatePerson(personId: string, userId: string, data: UpdatePersonDto): Promise<IPerson>;
  deletePerson(personId: string, userId: string): Promise<void>;
  getPersonById(personId: string, userId: string): Promise<IPerson | null>;

  // List Operations
  getPersonsByTreeId(treeId: string, userId: string, params?: PersonSearchParams): Promise<PersonListResult>;

  // Validation
  validatePersonData(data: CreatePersonDto | UpdatePersonDto): Promise<string[]>;

  // Derived Data
  getFullName(person: IPerson): string;
  getAge(person: IPerson): number | null;
  getLifespan(person: IPerson): string;
}
```

**Business Rules:**
- User must have access to tree to manage persons
- Validate dates (birth before death)
- Sanitize all text inputs
- Emit events on create/update/delete

### 2. ITreeService

**File:** `src/services/tree/ITreeService.ts`

```typescript
import { ITree } from '@/types/tree';
import { CreateTreeDto, UpdateTreeDto } from '@/types/dtos/tree';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

export interface TreeStats {
  memberCount: number;
  relationshipCount: number;
  mediaCount: number;
  oldestPerson?: IPerson;
  newestPerson?: IPerson;
  generations: number;
}

export interface TreeExportData {
  tree: ITree;
  persons: IPerson[];
  relationships: IRelationship[];
}

export interface ITreeService {
  // CRUD Operations
  createTree(userId: string, data: CreateTreeDto): Promise<ITree>;
  updateTree(treeId: string, userId: string, data: UpdateTreeDto): Promise<ITree>;
  deleteTree(treeId: string, userId: string): Promise<void>;
  getTreeById(treeId: string, userId: string): Promise<ITree | null>;

  // List Operations
  getTreesByUserId(userId: string): Promise<ITree[]>;
  getSharedTrees(userId: string): Promise<ITree[]>;

  // Statistics
  getTreeStats(treeId: string, userId: string): Promise<TreeStats>;

  // Export/Import
  exportTree(treeId: string, userId: string, format: 'json' | 'gedcom'): Promise<TreeExportData>;
  importTree(userId: string, data: TreeExportData): Promise<ITree>;

  // Visualization
  getTreeVisualizationData(treeId: string, userId: string, viewType: string): Promise<unknown>;
}
```

**Business Rules:**
- User can only delete own trees
- Deletion cascades to persons, relationships, media
- Export respects privacy settings
- Import validates data integrity

### 3. IRelationshipService

**File:** `src/services/relationship/IRelationshipService.ts`

```typescript
import { IRelationship, RelationshipType } from '@/types/relationship';
import { CreateRelationshipDto, UpdateRelationshipDto } from '@/types/dtos/relationship';
import { IPerson } from '@/types/person';

export interface FamilyMembers {
  parents: IPerson[];
  children: IPerson[];
  spouses: IPerson[];
  siblings: IPerson[];
}

export interface AncestryPath {
  generations: IPerson[][];
  depth: number;
}

export interface IRelationshipService {
  // CRUD Operations
  createRelationship(treeId: string, userId: string, data: CreateRelationshipDto): Promise<IRelationship>;
  updateRelationship(relationshipId: string, userId: string, data: UpdateRelationshipDto): Promise<IRelationship>;
  deleteRelationship(relationshipId: string, userId: string): Promise<void>;

  // Family Queries
  getFamilyMembers(personId: string, userId: string): Promise<FamilyMembers>;
  getAncestors(personId: string, userId: string, generations?: number): Promise<AncestryPath>;
  getDescendants(personId: string, userId: string, generations?: number): Promise<AncestryPath>;

  // Validation
  validateRelationship(data: CreateRelationshipDto): Promise<string[]>;
  checkForCycles(fromPersonId: string, toPersonId: string, type: RelationshipType): Promise<boolean>;

  // Suggestions
  suggestRelationships(personId: string, userId: string): Promise<IPerson[]>;
}
```

**Business Rules:**
- Prevent self-relationships
- Prevent duplicate relationships
- Validate persons are in same tree
- Check for impossible cycles (person as own ancestor)
- Handle bidirectional relationships

### 4. IAuthService

**File:** `src/services/auth/IAuthService.ts`

```typescript
import { IUser } from '@/types/user';
import { RegisterDto, LoginDto, UpdateProfileDto } from '@/types/dtos/auth';

export interface AuthResult {
  user: IUser;
  accessToken?: string;
}

export interface IAuthService {
  // Registration
  register(data: RegisterDto): Promise<AuthResult>;
  verifyEmail(token: string): Promise<IUser>;

  // Authentication
  login(data: LoginDto): Promise<AuthResult>;
  logout(userId: string): Promise<void>;

  // Password Management
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;

  // Profile Management
  getProfile(userId: string): Promise<IUser>;
  updateProfile(userId: string, data: UpdateProfileDto): Promise<IUser>;

  // OAuth
  handleOAuthCallback(provider: string, profile: unknown): Promise<AuthResult>;
}
```

**Business Rules:**
- Hash passwords with bcrypt (cost 12)
- Validate email format
- Enforce password complexity
- Rate limit login attempts
- Token expiration handling

### 5. IMediaService

**File:** `src/services/media/IMediaService.ts`

```typescript
import { IMedia, MediaType } from '@/types/media';

export interface UploadMediaDto {
  treeId: string;
  personId?: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  title?: string;
  description?: string;
  dateTaken?: Date;
}

export interface MediaUploadResult {
  media: IMedia;
  url: string;
  thumbnailUrl?: string;
}

export interface IMediaService {
  // Upload
  uploadMedia(userId: string, data: UploadMediaDto): Promise<MediaUploadResult>;
  generateThumbnail(mediaId: string): Promise<string>;

  // CRUD
  getMediaById(mediaId: string, userId: string): Promise<IMedia | null>;
  getMediaByTreeId(treeId: string, userId: string, type?: MediaType): Promise<IMedia[]>;
  getMediaByPersonId(personId: string, userId: string): Promise<IMedia[]>;
  updateMedia(mediaId: string, userId: string, data: Partial<IMedia>): Promise<IMedia>;
  deleteMedia(mediaId: string, userId: string): Promise<void>;

  // Validation
  validateFile(file: Buffer, mimeType: string): Promise<string[]>;

  // Storage
  getSignedUrl(mediaId: string, userId: string, expiresIn?: number): Promise<string>;
}
```

**Business Rules:**
- Validate file size limits (50MB)
- Validate MIME types
- Generate thumbnails for images/videos
- Clean up storage on delete
- Virus scanning consideration

### 6. IPermissionService

**File:** `src/services/permission/IPermissionService.ts`

```typescript
export enum Permission {
  VIEW_TREE = 'view_tree',
  EDIT_TREE = 'edit_tree',
  DELETE_TREE = 'delete_tree',
  ADD_PERSON = 'add_person',
  EDIT_PERSON = 'edit_person',
  DELETE_PERSON = 'delete_person',
  ADD_RELATIONSHIP = 'add_relationship',
  MANAGE_COLLABORATORS = 'manage_collaborators',
  EXPORT_TREE = 'export_tree',
}

export interface IPermissionService {
  // Check Permissions
  canAccess(userId: string, treeId: string, permission: Permission): Promise<boolean>;
  getPermissions(userId: string, treeId: string): Promise<Permission[]>;

  // Role-based
  getRolePermissions(role: string): Permission[];
  hasMinimumRole(userId: string, treeId: string, role: string): Promise<boolean>;
}
```

**Permission Matrix:**

| Role | VIEW | EDIT | DELETE | ADD_PERSON | MANAGE_COLLAB |
|------|------|------|--------|------------|---------------|
| owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| editor | ✓ | ✓ | ✗ | ✓ | ✗ |
| viewer | ✓ | ✗ | ✗ | ✗ | ✗ |

### 7. ICollaborationService

**File:** `src/services/collaboration/ICollaborationService.ts`

```typescript
import { TreeCollaborator } from '@/types/tree';

export interface CollaborationInvite {
  treeId: string;
  invitedEmail: string;
  role: string;
  invitedBy: string;
  expiresAt: Date;
}

export interface ICollaborationService {
  // Invitations
  inviteCollaborator(treeId: string, userId: string, email: string, role: string): Promise<CollaborationInvite>;
  acceptInvitation(inviteToken: string, userId: string): Promise<void>;
  declineInvitation(inviteToken: string, userId: string): Promise<void>;
  getPendingInvitations(treeId: string, userId: string): Promise<CollaborationInvite[]>;

  // Collaborator Management
  getCollaborators(treeId: string, userId: string): Promise<TreeCollaborator[]>;
  updateCollaboratorRole(treeId: string, userId: string, collaboratorId: string, role: string): Promise<void>;
  removeCollaborator(treeId: string, userId: string, collaboratorId: string): Promise<void>;
  leaveTree(treeId: string, userId: string): Promise<void>;
}
```

**Business Rules:**
- Only owner can invite/manage collaborators
- Invitations expire after 7 days
- Cannot demote owner
- Owner cannot leave (must transfer or delete)

---

## Input Validation with Zod

```typescript
// src/types/dtos/person.ts
import { z } from 'zod';

export const CreatePersonDtoSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  middleName: z.string().max(100).trim().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  birthDate: z.date().optional(),
  birthPlace: z.string().max(200).optional(),
  deathDate: z.date().optional(),
  isLiving: z.boolean().default(true),
}).refine(
  (data) => !data.deathDate || !data.birthDate || data.deathDate >= data.birthDate,
  { message: 'Death date must be after birth date' }
);

export type CreatePersonDto = z.infer<typeof CreatePersonDtoSchema>;
```

---

## Acceptance Criteria

- [ ] All 7 service interfaces created
- [ ] DTO schemas with Zod validation
- [ ] Business rules documented
- [ ] Permission matrix defined
- [ ] TypeScript compilation succeeds
- [ ] Index barrel exports created
