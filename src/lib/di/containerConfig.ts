/**
 * Container Configuration
 *
 * Configures the DI container with all service, repository, and strategy registrations.
 * This is where the dependency graph is wired together.
 */

import { Container } from './Container';
import { SERVICES } from './types';

// ==================
// Repositories
// ==================
import { PersonRepository } from '@/repositories/mongodb/PersonRepository';
import { TreeRepository } from '@/repositories/mongodb/TreeRepository';
import { RelationshipRepository } from '@/repositories/mongodb/RelationshipRepository';
import { MediaRepository } from '@/repositories/mongodb/MediaRepository';
import { UserRepository } from '@/repositories/mongodb/UserRepository';
import { AuditRepository } from '@/repositories/mongodb/AuditRepository';

// ==================
// Services
// ==================
import { PersonService } from '@/services/person/PersonService';
import { TreeService } from '@/services/tree/TreeService';
import { RelationshipService } from '@/services/relationship/RelationshipService';
import { AuthService } from '@/services/auth/AuthService';
import { MediaService } from '@/services/media/MediaService';
import { PermissionService } from '@/services/permission/PermissionService';
import { EmailService } from '@/services/email/EmailService';

// ==================
// Strategies
// ==================
import { VisualizationStrategyRegistry } from '@/strategies/visualization/VisualizationStrategyRegistry';
import { StorageStrategyRegistry } from '@/strategies/storage/StorageStrategyRegistry';
import { LocalStorageStrategy } from '@/strategies/storage/LocalStorageStrategy';
import { CloudinaryStorageStrategy } from '@/strategies/storage/CloudinaryStorageStrategy';
import { RoleBasedPermissionStrategy } from '@/strategies/permission/RoleBasedPermissionStrategy';
import { AttributeBasedPermissionStrategy } from '@/strategies/permission/AttributeBasedPermissionStrategy';
import { OwnerOnlyPermissionStrategy } from '@/strategies/permission/OwnerOnlyPermissionStrategy';

// ==================
// Infrastructure
// ==================
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * Configure and return a fully wired DI container.
 * This function sets up all service registrations and their dependencies.
 */
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

  container.register({
    identifier: SERVICES.EmailService,
    factory: () => new EmailService(),
    lifecycle: 'singleton',
  });

  // ==================
  // Repositories
  // ==================
  container.register({
    identifier: SERVICES.PersonRepository,
    factory: () => new PersonRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.TreeRepository,
    factory: () => new TreeRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.RelationshipRepository,
    factory: () => new RelationshipRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.MediaRepository,
    factory: () => new MediaRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.UserRepository,
    factory: () => new UserRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.AuditLogRepository,
    factory: () => new AuditRepository(),
    lifecycle: 'singleton',
  });

  // ==================
  // Strategies - Visualization
  // ==================
  container.register({
    identifier: SERVICES.VisualizationStrategyRegistry,
    factory: () => new VisualizationStrategyRegistry(),
    lifecycle: 'singleton',
  });

  // ==================
  // Strategies - Storage
  // ==================
  container.register({
    identifier: SERVICES.StorageStrategyRegistry,
    factory: () => {
      const registry = new StorageStrategyRegistry();

      // Register local storage strategy (always available)
      registry.register(new LocalStorageStrategy());

      // Register cloudinary if configured
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
      const registry = c.resolve(SERVICES.StorageStrategyRegistry) as StorageStrategyRegistry;
      return registry.get(); // Returns default strategy
    },
    lifecycle: 'singleton',
  });

  // ==================
  // Services - Permission
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

  // ==================
  // Services - Core
  // ==================
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
      c.resolve(SERVICES.PermissionService),
      c.resolve(SERVICES.AuditLogRepository)
    ),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.MediaService,
    factory: (c) => new MediaService(
      c.resolve(SERVICES.MediaRepository),
      c.resolve(SERVICES.StorageStrategy),
      c.resolve(SERVICES.PermissionService),
      c.resolve(SERVICES.AuditLogRepository)
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

  return container;
}
