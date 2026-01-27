# Task 13: Create Dependency Injection Container

**Phase:** 6 - Dependency Injection
**Priority:** Critical
**Dependencies:** Task 09 (Service Implementations), Task 10-12 (Strategies)
**Estimated Complexity:** Medium

---

## Objective

Create a Dependency Injection (DI) container that wires all services, repositories, and strategies together. This enables loose coupling, testability, and runtime configuration.

---

## Requirements

### Functional Requirements

1. Register all service implementations
2. Register all repository implementations
3. Register all strategy implementations
4. Support singleton and transient lifecycles
5. Enable easy mocking for tests
6. Support environment-based configuration

### Non-Functional Requirements

1. Container initialization must be fast (<100ms)
2. Type-safe dependency resolution
3. Circular dependency detection
4. Clear error messages for missing dependencies
5. Support lazy loading for optional services

---

## Container Design

### Interface Definitions

**File:** `src/lib/di/types.ts`

```typescript
export type ServiceIdentifier<T> = symbol | string | (new (...args: unknown[]) => T);

export type Lifecycle = 'singleton' | 'transient';

export interface ServiceDescriptor<T> {
  identifier: ServiceIdentifier<T>;
  factory: (container: IContainer) => T;
  lifecycle: Lifecycle;
}

export interface IContainer {
  register<T>(descriptor: ServiceDescriptor<T>): void;
  resolve<T>(identifier: ServiceIdentifier<T>): T;
  has(identifier: ServiceIdentifier<unknown>): boolean;
}

// Service identifiers (symbols for type safety)
export const SERVICES = {
  // Repositories
  PersonRepository: Symbol.for('PersonRepository'),
  TreeRepository: Symbol.for('TreeRepository'),
  RelationshipRepository: Symbol.for('RelationshipRepository'),
  MediaRepository: Symbol.for('MediaRepository'),
  UserRepository: Symbol.for('UserRepository'),
  AuditLogRepository: Symbol.for('AuditLogRepository'),

  // Services
  PersonService: Symbol.for('PersonService'),
  TreeService: Symbol.for('TreeService'),
  RelationshipService: Symbol.for('RelationshipService'),
  AuthService: Symbol.for('AuthService'),
  MediaService: Symbol.for('MediaService'),
  PermissionService: Symbol.for('PermissionService'),
  CollaborationService: Symbol.for('CollaborationService'),

  // Strategies
  VisualizationStrategyRegistry: Symbol.for('VisualizationStrategyRegistry'),
  StorageStrategy: Symbol.for('StorageStrategy'),
  StorageStrategyRegistry: Symbol.for('StorageStrategyRegistry'),

  // Infrastructure
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  EmailService: Symbol.for('EmailService'),
} as const;
```

### Container Implementation

**File:** `src/lib/di/Container.ts`

```typescript
import { ServiceIdentifier, ServiceDescriptor, Lifecycle, IContainer } from './types';

export class Container implements IContainer {
  private descriptors: Map<ServiceIdentifier<unknown>, ServiceDescriptor<unknown>> = new Map();
  private singletons: Map<ServiceIdentifier<unknown>, unknown> = new Map();
  private resolving: Set<ServiceIdentifier<unknown>> = new Set();

  register<T>(descriptor: ServiceDescriptor<T>): void {
    this.descriptors.set(descriptor.identifier, descriptor as ServiceDescriptor<unknown>);
  }

  resolve<T>(identifier: ServiceIdentifier<T>): T {
    // Check for singleton instance
    if (this.singletons.has(identifier)) {
      return this.singletons.get(identifier) as T;
    }

    // Get descriptor
    const descriptor = this.descriptors.get(identifier);
    if (!descriptor) {
      throw new Error(
        `Service not registered: ${String(identifier)}. ` +
        `Did you forget to register it in the container?`
      );
    }

    // Circular dependency detection
    if (this.resolving.has(identifier)) {
      throw new Error(
        `Circular dependency detected while resolving: ${String(identifier)}. ` +
        `Check your service dependencies.`
      );
    }

    // Resolve
    this.resolving.add(identifier);
    try {
      const instance = descriptor.factory(this) as T;

      // Store singleton
      if (descriptor.lifecycle === 'singleton') {
        this.singletons.set(identifier, instance);
      }

      return instance;
    } finally {
      this.resolving.delete(identifier);
    }
  }

  has(identifier: ServiceIdentifier<unknown>): boolean {
    return this.descriptors.has(identifier);
  }

  // Clear all instances (useful for testing)
  clear(): void {
    this.singletons.clear();
  }

  // Replace a service (useful for testing)
  override<T>(identifier: ServiceIdentifier<T>, instance: T): void {
    this.singletons.set(identifier, instance);
  }
}
```

### Container Configuration

**File:** `src/lib/di/containerConfig.ts`

```typescript
import { Container } from './Container';
import { SERVICES } from './types';

// Repositories
import { MongoPersonRepository } from '@/repositories/mongodb/MongoPersonRepository';
import { MongoTreeRepository } from '@/repositories/mongodb/MongoTreeRepository';
import { MongoRelationshipRepository } from '@/repositories/mongodb/MongoRelationshipRepository';
import { MongoMediaRepository } from '@/repositories/mongodb/MongoMediaRepository';
import { MongoUserRepository } from '@/repositories/mongodb/MongoUserRepository';
import { MongoAuditLogRepository } from '@/repositories/mongodb/MongoAuditLogRepository';

// Services
import { PersonService } from '@/services/person/PersonService';
import { TreeService } from '@/services/tree/TreeService';
import { RelationshipService } from '@/services/relationship/RelationshipService';
import { AuthService } from '@/services/auth/AuthService';
import { MediaService } from '@/services/media/MediaService';
import { PermissionService } from '@/services/permission/PermissionService';
import { CollaborationService } from '@/services/collaboration/CollaborationService';

// Strategies
import { VisualizationStrategyRegistry } from '@/strategies/visualization/VisualizationStrategyRegistry';
import { StorageStrategyRegistry } from '@/strategies/storage/StorageStrategyRegistry';
import { LocalStorageStrategy } from '@/strategies/storage/LocalStorageStrategy';
import { CloudinaryStorageStrategy } from '@/strategies/storage/CloudinaryStorageStrategy';
import { RoleBasedPermissionStrategy } from '@/strategies/permission/RoleBasedPermissionStrategy';
import { AttributeBasedPermissionStrategy } from '@/strategies/permission/AttributeBasedPermissionStrategy';
import { OwnerOnlyPermissionStrategy } from '@/strategies/permission/OwnerOnlyPermissionStrategy';

// Infrastructure
import { connectToDatabase } from '@/lib/db/connection';

export function configureContainer(): Container {
  const container = new Container();

  // ==================
  // Infrastructure
  // ==================
  container.register({
    identifier: SERVICES.DatabaseConnection,
    factory: () => connectToDatabase(),
    lifecycle: 'singleton',
  });

  // ==================
  // Repositories
  // ==================
  container.register({
    identifier: SERVICES.PersonRepository,
    factory: () => new MongoPersonRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.TreeRepository,
    factory: () => new MongoTreeRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.RelationshipRepository,
    factory: () => new MongoRelationshipRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.MediaRepository,
    factory: () => new MongoMediaRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.UserRepository,
    factory: () => new MongoUserRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.AuditLogRepository,
    factory: () => new MongoAuditLogRepository(),
    lifecycle: 'singleton',
  });

  // ==================
  // Strategies
  // ==================
  container.register({
    identifier: SERVICES.VisualizationStrategyRegistry,
    factory: () => new VisualizationStrategyRegistry(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.StorageStrategyRegistry,
    factory: () => {
      const registry = new StorageStrategyRegistry();

      // Register storage strategies based on environment
      registry.register(new LocalStorageStrategy());

      if (process.env.CLOUDINARY_CLOUD_NAME) {
        registry.register(new CloudinaryStorageStrategy({
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: process.env.CLOUDINARY_API_KEY!,
          apiSecret: process.env.CLOUDINARY_API_SECRET!,
        }));
        registry.setDefault('cloudinary');
      }

      return registry;
    },
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.StorageStrategy,
    factory: (c) => {
      const registry = c.resolve<StorageStrategyRegistry>(SERVICES.StorageStrategyRegistry);
      return registry.get(); // Returns default strategy
    },
    lifecycle: 'singleton',
  });

  // ==================
  // Services
  // ==================
  container.register({
    identifier: SERVICES.PermissionService,
    factory: (c) => {
      const treeRepo = c.resolve(SERVICES.TreeRepository);
      const personRepo = c.resolve(SERVICES.PersonRepository);

      const strategies = [
        new OwnerOnlyPermissionStrategy(treeRepo),
        new AttributeBasedPermissionStrategy(personRepo),
        new RoleBasedPermissionStrategy(treeRepo),
      ];

      return new PermissionService(strategies);
    },
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.PersonService,
    factory: (c) => new PersonService(
      c.resolve(SERVICES.PersonRepository),
      c.resolve(SERVICES.PermissionService),
      c.resolve(SERVICES.AuditLogRepository)
    ),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.TreeService,
    factory: (c) => new TreeService(
      c.resolve(SERVICES.TreeRepository),
      c.resolve(SERVICES.PersonRepository),
      c.resolve(SERVICES.RelationshipRepository),
      c.resolve(SERVICES.MediaRepository),
      c.resolve(SERVICES.PermissionService),
      c.resolve(SERVICES.AuditLogRepository)
    ),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.RelationshipService,
    factory: (c) => new RelationshipService(
      c.resolve(SERVICES.RelationshipRepository),
      c.resolve(SERVICES.PersonRepository),
      c.resolve(SERVICES.PermissionService)
    ),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.MediaService,
    factory: (c) => new MediaService(
      c.resolve(SERVICES.MediaRepository),
      c.resolve(SERVICES.StorageStrategy),
      c.resolve(SERVICES.PermissionService)
    ),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.AuthService,
    factory: (c) => new AuthService(
      c.resolve(SERVICES.UserRepository),
      c.resolve(SERVICES.EmailService)
    ),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.CollaborationService,
    factory: (c) => new CollaborationService(
      c.resolve(SERVICES.TreeRepository),
      c.resolve(SERVICES.UserRepository),
      c.resolve(SERVICES.PermissionService),
      c.resolve(SERVICES.EmailService)
    ),
    lifecycle: 'singleton',
  });

  return container;
}
```

### Global Container Instance

**File:** `src/lib/di/container.ts`

```typescript
import { configureContainer } from './containerConfig';
import { Container } from './Container';

// Singleton container instance
let containerInstance: Container | null = null;

export function getContainer(): Container {
  if (!containerInstance) {
    containerInstance = configureContainer();
  }
  return containerInstance;
}

// For testing - reset container
export function resetContainer(): void {
  containerInstance?.clear();
  containerInstance = null;
}

// Convenience export
export const container = {
  get personService() {
    return getContainer().resolve(SERVICES.PersonService);
  },
  get treeService() {
    return getContainer().resolve(SERVICES.TreeService);
  },
  get relationshipService() {
    return getContainer().resolve(SERVICES.RelationshipService);
  },
  get authService() {
    return getContainer().resolve(SERVICES.AuthService);
  },
  get mediaService() {
    return getContainer().resolve(SERVICES.MediaService);
  },
  get permissionService() {
    return getContainer().resolve(SERVICES.PermissionService);
  },
  get collaborationService() {
    return getContainer().resolve(SERVICES.CollaborationService);
  },
  get visualizationStrategies() {
    return getContainer().resolve(SERVICES.VisualizationStrategyRegistry);
  },
};
```

---

## Testing Support

**File:** `src/lib/di/testContainer.ts`

```typescript
import { Container } from './Container';
import { SERVICES } from './types';

export function createTestContainer(): Container {
  const container = new Container();

  // Register mock repositories
  container.register({
    identifier: SERVICES.PersonRepository,
    factory: () => createMockPersonRepository(),
    lifecycle: 'singleton',
  });

  // ... register other mocks

  return container;
}

// Helper to create container with specific overrides
export function createContainerWithMocks(
  mocks: Partial<Record<keyof typeof SERVICES, unknown>>
): Container {
  const container = configureContainer();

  for (const [key, mock] of Object.entries(mocks)) {
    const identifier = SERVICES[key as keyof typeof SERVICES];
    container.override(identifier, mock);
  }

  return container;
}
```

---

## Usage Examples

### In API Routes

```typescript
// src/app/api/trees/route.ts
import { container } from '@/lib/di/container';
import { getServerSession } from 'next-auth';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trees = await container.treeService.getTreesByUserId(session.user.id);
  return Response.json({ trees });
}
```

### In React Components (Server Components)

```typescript
// src/app/(dashboard)/page.tsx
import { container } from '@/lib/di/container';

export default async function DashboardPage() {
  const session = await getServerSession();
  const trees = await container.treeService.getTreesByUserId(session.user.id);

  return <TreeGrid trees={trees} />;
}
```

### In Tests

```typescript
// tests/unit/services/PersonService.test.ts
import { createContainerWithMocks } from '@/lib/di/testContainer';
import { SERVICES } from '@/lib/di/types';

describe('PersonService', () => {
  let container: Container;
  let mockPersonRepo: jest.Mocked<IPersonRepository>;

  beforeEach(() => {
    mockPersonRepo = createMock<IPersonRepository>();
    container = createContainerWithMocks({
      PersonRepository: mockPersonRepo,
    });
  });

  it('should create person', async () => {
    const personService = container.resolve(SERVICES.PersonService);
    // ... test
  });
});
```

---

## Environment Configuration

**File:** `src/lib/di/envConfig.ts`

```typescript
export interface EnvConfig {
  database: {
    uri: string;
    name: string;
  };
  storage: {
    type: 'local' | 'cloudinary' | 's3';
    localPath?: string;
    cloudinary?: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
    s3?: {
      region: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    from: string;
  };
}

export function loadEnvConfig(): EnvConfig {
  return {
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      name: process.env.MONGODB_NAME || 'family-tree',
    },
    storage: {
      type: (process.env.STORAGE_TYPE as 'local' | 'cloudinary' | 's3') || 'local',
      localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
      } : undefined,
    },
    email: {
      provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid') || 'smtp',
      from: process.env.EMAIL_FROM || 'noreply@familytree.app',
    },
  };
}
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Circular dependency | Throw descriptive error |
| Missing service | Throw with service name |
| Singleton reuse | Store and return same instance |
| Container reset | Clear all singletons |
| Environment switch | Rebuild container |
| Hot reload (dev) | Handle module replacement |
| Multiple containers | Ensure single instance |
| Async initialization | Use lazy loading pattern |

---

## Acceptance Criteria

- [ ] Container class implemented
- [ ] Service identifiers defined
- [ ] All repositories registered
- [ ] All services registered
- [ ] All strategies registered
- [ ] Circular dependency detection
- [ ] Singleton lifecycle working
- [ ] Test container helpers created
- [ ] Environment configuration loading
- [ ] Usage examples documented
- [ ] Unit tests passing
- [ ] TypeScript compilation succeeds
