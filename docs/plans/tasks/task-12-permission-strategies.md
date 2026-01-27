# Task 12: Create Permission Strategies

**Phase:** 5 - Strategy Pattern (Permissions)
**Priority:** High
**Dependencies:** Task 08 (Service Interfaces)
**Estimated Complexity:** Medium

---

## Objective

Implement permission strategies for flexible access control. Support different authorization models (Role-Based, Attribute-Based, Custom) using Strategy Pattern.

---

## Requirements

### Functional Requirements

1. Define IPermissionStrategy interface
2. Implement permission strategies:
   - RoleBasedPermissionStrategy (RBAC)
   - AttributeBasedPermissionStrategy (ABAC)
   - OwnerOnlyPermissionStrategy
3. Combine strategies for complex rules
4. Cache permission checks for performance

### Non-Functional Requirements

1. Permission checks must be fast (<10ms)
2. Support hierarchical roles
3. Handle permission inheritance
4. Log all access attempts
5. Support runtime permission changes

---

## Interface Definition

**File:** `src/strategies/permission/IPermissionStrategy.ts`

```typescript
export enum Permission {
  // Tree permissions
  VIEW_TREE = 'view_tree',
  EDIT_TREE = 'edit_tree',
  DELETE_TREE = 'delete_tree',
  SHARE_TREE = 'share_tree',
  EXPORT_TREE = 'export_tree',

  // Person permissions
  ADD_PERSON = 'add_person',
  EDIT_PERSON = 'edit_person',
  DELETE_PERSON = 'delete_person',
  VIEW_PERSON = 'view_person',

  // Relationship permissions
  ADD_RELATIONSHIP = 'add_relationship',
  EDIT_RELATIONSHIP = 'edit_relationship',
  DELETE_RELATIONSHIP = 'delete_relationship',

  // Media permissions
  UPLOAD_MEDIA = 'upload_media',
  DELETE_MEDIA = 'delete_media',

  // Collaboration permissions
  MANAGE_COLLABORATORS = 'manage_collaborators',
  INVITE_COLLABORATORS = 'invite_collaborators',
}

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

export interface PermissionContext {
  userId: string;
  treeId: string;
  resourceType?: 'tree' | 'person' | 'relationship' | 'media';
  resourceId?: string;
  action?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  grantedBy?: string; // Strategy name that granted permission
}

export interface IPermissionStrategy {
  name: string;
  priority: number; // Higher priority strategies are checked first

  canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult>;
  getPermissions(context: PermissionContext): Promise<Permission[]>;
}
```

---

## Strategy Implementations

### 1. RoleBasedPermissionStrategy (RBAC)

**File:** `src/strategies/permission/RoleBasedPermissionStrategy.ts`

```typescript
import { IPermissionStrategy, Permission, Role, PermissionContext, PermissionResult } from './IPermissionStrategy';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';

export class RoleBasedPermissionStrategy implements IPermissionStrategy {
  name = 'rbac';
  priority = 10;

  private readonly rolePermissions: Map<Role, Permission[]> = new Map([
    [Role.OWNER, [
      Permission.VIEW_TREE,
      Permission.EDIT_TREE,
      Permission.DELETE_TREE,
      Permission.SHARE_TREE,
      Permission.EXPORT_TREE,
      Permission.ADD_PERSON,
      Permission.EDIT_PERSON,
      Permission.DELETE_PERSON,
      Permission.VIEW_PERSON,
      Permission.ADD_RELATIONSHIP,
      Permission.EDIT_RELATIONSHIP,
      Permission.DELETE_RELATIONSHIP,
      Permission.UPLOAD_MEDIA,
      Permission.DELETE_MEDIA,
      Permission.MANAGE_COLLABORATORS,
      Permission.INVITE_COLLABORATORS,
    ]],
    [Role.ADMIN, [
      Permission.VIEW_TREE,
      Permission.EDIT_TREE,
      Permission.SHARE_TREE,
      Permission.EXPORT_TREE,
      Permission.ADD_PERSON,
      Permission.EDIT_PERSON,
      Permission.DELETE_PERSON,
      Permission.VIEW_PERSON,
      Permission.ADD_RELATIONSHIP,
      Permission.EDIT_RELATIONSHIP,
      Permission.DELETE_RELATIONSHIP,
      Permission.UPLOAD_MEDIA,
      Permission.DELETE_MEDIA,
      Permission.INVITE_COLLABORATORS,
    ]],
    [Role.EDITOR, [
      Permission.VIEW_TREE,
      Permission.EDIT_TREE,
      Permission.EXPORT_TREE,
      Permission.ADD_PERSON,
      Permission.EDIT_PERSON,
      Permission.VIEW_PERSON,
      Permission.ADD_RELATIONSHIP,
      Permission.EDIT_RELATIONSHIP,
      Permission.UPLOAD_MEDIA,
    ]],
    [Role.VIEWER, [
      Permission.VIEW_TREE,
      Permission.VIEW_PERSON,
      Permission.EXPORT_TREE,
    ]],
    [Role.GUEST, [
      Permission.VIEW_TREE,
      Permission.VIEW_PERSON,
    ]],
  ]);

  constructor(private readonly treeRepository: ITreeRepository) {}

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    const role = await this.getUserRole(context.userId, context.treeId);

    if (!role) {
      return {
        allowed: false,
        reason: 'User has no role in this tree',
      };
    }

    const rolePerms = this.rolePermissions.get(role) || [];
    const allowed = rolePerms.includes(permission);

    return {
      allowed,
      reason: allowed
        ? `Permission granted by role: ${role}`
        : `Role ${role} does not have permission: ${permission}`,
      grantedBy: allowed ? this.name : undefined,
    };
  }

  async getPermissions(context: PermissionContext): Promise<Permission[]> {
    const role = await this.getUserRole(context.userId, context.treeId);
    if (!role) return [];
    return this.rolePermissions.get(role) || [];
  }

  private async getUserRole(userId: string, treeId: string): Promise<Role | null> {
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) return null;

    // Check if owner
    if (tree.ownerId === userId) {
      return Role.OWNER;
    }

    // Check collaborators
    const collaborator = tree.collaborators?.find(c => c.userId === userId);
    if (collaborator) {
      return collaborator.role as Role;
    }

    // Check if tree is public
    if (tree.privacy === 'public') {
      return Role.GUEST;
    }

    return null;
  }
}
```

### 2. AttributeBasedPermissionStrategy (ABAC)

**File:** `src/strategies/permission/AttributeBasedPermissionStrategy.ts`

```typescript
import { IPermissionStrategy, Permission, PermissionContext, PermissionResult } from './IPermissionStrategy';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';

interface AttributeRule {
  permission: Permission;
  condition: (context: PermissionContext, attributes: Record<string, unknown>) => boolean;
  description: string;
}

export class AttributeBasedPermissionStrategy implements IPermissionStrategy {
  name = 'abac';
  priority = 20; // Higher than RBAC

  private rules: AttributeRule[] = [];

  constructor(
    private readonly personRepository: IPersonRepository
  ) {
    this.initializeRules();
  }

  private initializeRules(): void {
    // Rule: Cannot edit deceased persons unless admin
    this.rules.push({
      permission: Permission.EDIT_PERSON,
      condition: (context, attrs) => {
        const person = attrs.person as { isLiving: boolean } | undefined;
        const userRole = attrs.userRole as string | undefined;

        if (person && !person.isLiving && userRole !== 'owner' && userRole !== 'admin') {
          return false;
        }
        return true;
      },
      description: 'Cannot edit deceased persons unless owner/admin',
    });

    // Rule: Cannot delete persons with relationships
    this.rules.push({
      permission: Permission.DELETE_PERSON,
      condition: (context, attrs) => {
        const relationshipCount = attrs.relationshipCount as number | undefined;
        return !relationshipCount || relationshipCount === 0;
      },
      description: 'Cannot delete persons with existing relationships',
    });

    // Rule: Cannot view living persons' details in public trees if privacy restricted
    this.rules.push({
      permission: Permission.VIEW_PERSON,
      condition: (context, attrs) => {
        const person = attrs.person as { isLiving: boolean; privacyLevel?: string } | undefined;
        const isCollaborator = attrs.isCollaborator as boolean | undefined;

        if (person?.isLiving && person?.privacyLevel === 'restricted' && !isCollaborator) {
          return false;
        }
        return true;
      },
      description: 'Cannot view restricted living person details',
    });
  }

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    // Get attributes for the context
    const attributes = await this.getAttributes(context);

    // Check all rules for this permission
    const applicableRules = this.rules.filter(r => r.permission === permission);

    for (const rule of applicableRules) {
      if (!rule.condition(context, attributes)) {
        return {
          allowed: false,
          reason: rule.description,
        };
      }
    }

    // ABAC doesn't grant permissions, only restricts
    // Return "allowed" with no grantedBy to indicate neutral
    return {
      allowed: true,
      reason: 'No attribute-based restrictions apply',
    };
  }

  async getPermissions(context: PermissionContext): Promise<Permission[]> {
    // ABAC doesn't enumerate permissions, it only filters
    return [];
  }

  private async getAttributes(context: PermissionContext): Promise<Record<string, unknown>> {
    const attributes: Record<string, unknown> = {
      userId: context.userId,
      treeId: context.treeId,
      resourceType: context.resourceType,
      timestamp: new Date(),
    };

    // Load person attributes if applicable
    if (context.resourceType === 'person' && context.resourceId) {
      const person = await this.personRepository.findById(context.resourceId);
      if (person) {
        attributes.person = {
          isLiving: person.isLiving,
          privacyLevel: person.privacyLevel,
        };
        // Get relationship count
        const relationships = await this.personRepository.getRelationshipCount(context.resourceId);
        attributes.relationshipCount = relationships;
      }
    }

    return attributes;
  }

  addRule(rule: AttributeRule): void {
    this.rules.push(rule);
  }
}
```

### 3. OwnerOnlyPermissionStrategy

**File:** `src/strategies/permission/OwnerOnlyPermissionStrategy.ts`

```typescript
import { IPermissionStrategy, Permission, PermissionContext, PermissionResult } from './IPermissionStrategy';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';

export class OwnerOnlyPermissionStrategy implements IPermissionStrategy {
  name = 'owner-only';
  priority = 100; // Highest priority - owner bypass

  private readonly ownerOnlyPermissions: Permission[] = [
    Permission.DELETE_TREE,
    Permission.MANAGE_COLLABORATORS,
  ];

  constructor(private readonly treeRepository: ITreeRepository) {}

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    // Only applies to owner-only permissions
    if (!this.ownerOnlyPermissions.includes(permission)) {
      return {
        allowed: true, // Neutral - let other strategies decide
        reason: 'Not an owner-only permission',
      };
    }

    const tree = await this.treeRepository.findById(context.treeId);
    if (!tree) {
      return {
        allowed: false,
        reason: 'Tree not found',
      };
    }

    const isOwner = tree.ownerId === context.userId;

    return {
      allowed: isOwner,
      reason: isOwner
        ? 'User is tree owner'
        : 'Only tree owner can perform this action',
      grantedBy: isOwner ? this.name : undefined,
    };
  }

  async getPermissions(context: PermissionContext): Promise<Permission[]> {
    const tree = await this.treeRepository.findById(context.treeId);
    if (!tree || tree.ownerId !== context.userId) {
      return [];
    }
    return this.ownerOnlyPermissions;
  }
}
```

---

## Permission Service (Combines Strategies)

**File:** `src/services/permission/PermissionService.ts`

```typescript
import { IPermissionService, Permission } from './IPermissionService';
import { IPermissionStrategy, PermissionContext, PermissionResult } from '@/strategies/permission/IPermissionStrategy';

export class PermissionService implements IPermissionService {
  private strategies: IPermissionStrategy[] = [];
  private cache: Map<string, { result: boolean; expiry: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(strategies: IPermissionStrategy[]) {
    // Sort by priority (highest first)
    this.strategies = strategies.sort((a, b) => b.priority - a.priority);
  }

  async canAccess(userId: string, treeId: string, permission: Permission): Promise<boolean> {
    const cacheKey = `${userId}:${treeId}:${permission}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    const context: PermissionContext = { userId, treeId };

    // Check each strategy in priority order
    let finalResult: PermissionResult = { allowed: false, reason: 'No strategy granted permission' };

    for (const strategy of this.strategies) {
      const result = await strategy.canAccess(permission, context);

      // If explicitly denied by high-priority strategy, stop
      if (!result.allowed && result.reason?.includes('cannot') || result.reason?.includes('denied')) {
        finalResult = result;
        break;
      }

      // If granted, record it
      if (result.allowed && result.grantedBy) {
        finalResult = result;
        break;
      }
    }

    // Cache result
    this.cache.set(cacheKey, {
      result: finalResult.allowed,
      expiry: Date.now() + this.CACHE_TTL,
    });

    return finalResult.allowed;
  }

  async getPermissions(userId: string, treeId: string): Promise<Permission[]> {
    const context: PermissionContext = { userId, treeId };
    const allPermissions = new Set<Permission>();

    for (const strategy of this.strategies) {
      const perms = await strategy.getPermissions(context);
      perms.forEach(p => allPermissions.add(p));
    }

    return Array.from(allPermissions);
  }

  getRolePermissions(role: string): Permission[] {
    // Delegate to RBAC strategy
    const rbacStrategy = this.strategies.find(s => s.name === 'rbac');
    if (!rbacStrategy) return [];

    // Access internal role permissions (implementation detail)
    return [];
  }

  async hasMinimumRole(userId: string, treeId: string, role: string): Promise<boolean> {
    const roleHierarchy = ['guest', 'viewer', 'editor', 'admin', 'owner'];
    const requiredIndex = roleHierarchy.indexOf(role);

    const context: PermissionContext = { userId, treeId };
    const permissions = await this.getPermissions(userId, treeId);

    // Infer role from permissions
    if (permissions.includes(Permission.MANAGE_COLLABORATORS)) return requiredIndex <= 4;
    if (permissions.includes(Permission.INVITE_COLLABORATORS)) return requiredIndex <= 3;
    if (permissions.includes(Permission.ADD_PERSON)) return requiredIndex <= 2;
    if (permissions.includes(Permission.VIEW_TREE)) return requiredIndex <= 1;

    return false;
  }

  invalidateCache(userId?: string, treeId?: string): void {
    if (!userId && !treeId) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (userId && key.startsWith(userId)) {
        this.cache.delete(key);
      } else if (treeId && key.includes(`:${treeId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}
```

---

## Permission Matrix

| Permission | Owner | Admin | Editor | Viewer | Guest |
|------------|-------|-------|--------|--------|-------|
| VIEW_TREE | ✓ | ✓ | ✓ | ✓ | ✓* |
| EDIT_TREE | ✓ | ✓ | ✓ | ✗ | ✗ |
| DELETE_TREE | ✓ | ✗ | ✗ | ✗ | ✗ |
| SHARE_TREE | ✓ | ✓ | ✗ | ✗ | ✗ |
| EXPORT_TREE | ✓ | ✓ | ✓ | ✓ | ✗ |
| ADD_PERSON | ✓ | ✓ | ✓ | ✗ | ✗ |
| EDIT_PERSON | ✓ | ✓ | ✓ | ✗ | ✗ |
| DELETE_PERSON | ✓ | ✓ | ✗ | ✗ | ✗ |
| VIEW_PERSON | ✓ | ✓ | ✓ | ✓ | ✓* |
| MANAGE_COLLABORATORS | ✓ | ✗ | ✗ | ✗ | ✗ |
| INVITE_COLLABORATORS | ✓ | ✓ | ✗ | ✗ | ✗ |

\* Guest only if tree is public

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| User not in tree | Return false, no permissions |
| Deleted tree | Return false for all permissions |
| Role changed mid-session | Invalidate cache on role change |
| Conflicting rules | Higher priority strategy wins |
| Missing collaborator record | Treat as no access |
| Public tree, no user | Grant guest permissions |
| Tree privacy changed | Invalidate all tree-related cache |

---

## Testing Strategy

```typescript
describe('PermissionService', () => {
  describe('canAccess', () => {
    it('should allow owner to delete tree', async () => {
      const result = await permissionService.canAccess(ownerId, treeId, Permission.DELETE_TREE);
      expect(result).toBe(true);
    });

    it('should deny editor from deleting tree', async () => {
      const result = await permissionService.canAccess(editorId, treeId, Permission.DELETE_TREE);
      expect(result).toBe(false);
    });

    it('should cache permission results', async () => {
      await permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);
      await permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);

      expect(mockTreeRepo.findById).toHaveBeenCalledTimes(1);
    });

    it('should apply ABAC rules after RBAC', async () => {
      // Editor normally can edit persons
      // But ABAC rule prevents editing deceased persons
      const result = await permissionService.canAccess(
        editorId,
        treeId,
        Permission.EDIT_PERSON,
        { resourceId: deceasedPersonId }
      );
      expect(result).toBe(false);
    });
  });
});
```

---

## Acceptance Criteria

- [ ] IPermissionStrategy interface defined
- [ ] RoleBasedPermissionStrategy implemented
- [ ] AttributeBasedPermissionStrategy implemented
- [ ] OwnerOnlyPermissionStrategy implemented
- [ ] PermissionService combines strategies
- [ ] Permission caching working
- [ ] Cache invalidation working
- [ ] Unit tests for all strategies
- [ ] Integration tests for combined logic
- [ ] TypeScript compilation succeeds
