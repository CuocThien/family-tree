/**
 * Global Container Instance
 *
 * Provides a singleton container instance for the application.
 * This is the main entry point for accessing services through the DI container.
 */

import { configureContainer } from './containerConfig';
import { Container } from './Container';
import { SERVICES } from './types';
import type { IPersonService } from '@/services/person/IPersonService';
import type { ITreeService } from '@/services/tree/ITreeService';
import type { IRelationshipService } from '@/services/relationship/IRelationshipService';
import type { IAuthService } from '@/services/auth/IAuthService';
import type { IMediaService } from '@/services/media/IMediaService';
import type { IPermissionService } from '@/services/permission/IPermissionService';
import type { IEmailService } from '@/services/email/IEmailService';
import type { ICollaborationService } from '@/services/collaboration/ICollaborationService';
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository';
import type { IAuditLogRepository } from '@/repositories/interfaces/IAuditLogRepository';
import type { VisualizationStrategyRegistry } from '@/strategies/visualization/VisualizationStrategyRegistry';
import type { IStorageStrategy } from '@/strategies/storage/IStorageStrategy';
import type { StorageStrategyRegistry } from '@/strategies/storage/StorageStrategyRegistry';

/**
 * Singleton container instance.
 * Lazily initialized on first access.
 */
let containerInstance: Container | null = null;

/**
 * Get the global container instance.
 * Creates and configures the container on first call.
 */
export function getContainer(): Container {
  if (!containerInstance) {
    containerInstance = configureContainer();
  }
  return containerInstance;
}

/**
 * Reset the global container instance.
 * Clears all cached singletons and allows re-creation.
 * Primarily useful for testing.
 */
export function resetContainer(): void {
  containerInstance?.clear();
  containerInstance = null;
}

/**
 * Convenience object for accessing common services.
 * Provides property-based access to frequently used services.
 */
export const container = {
  get personService(): IPersonService {
    return getContainer().resolve(SERVICES.PersonService) as IPersonService;
  },
  get treeService(): ITreeService {
    return getContainer().resolve(SERVICES.TreeService) as ITreeService;
  },
  get relationshipService(): IRelationshipService {
    return getContainer().resolve(SERVICES.RelationshipService) as IRelationshipService;
  },
  get authService(): IAuthService {
    return getContainer().resolve(SERVICES.AuthService) as IAuthService;
  },
  get mediaService(): IMediaService {
    return getContainer().resolve(SERVICES.MediaService) as IMediaService;
  },
  get permissionService(): IPermissionService {
    return getContainer().resolve(SERVICES.PermissionService) as IPermissionService;
  },
  get emailService(): IEmailService {
    return getContainer().resolve(SERVICES.EmailService) as IEmailService;
  },
  get userRepository(): IUserRepository {
    return getContainer().resolve(SERVICES.UserRepository) as IUserRepository;
  },
  get auditLogService(): IAuditLogRepository {
    return getContainer().resolve(SERVICES.AuditLogRepository) as IAuditLogRepository;
  },
  get collaborationService(): ICollaborationService {
    return getContainer().resolve(SERVICES.CollaborationService) as ICollaborationService;
  },
  get visualizationStrategies(): VisualizationStrategyRegistry {
    return getContainer().resolve(SERVICES.VisualizationStrategyRegistry) as VisualizationStrategyRegistry;
  },
  get storageStrategy(): IStorageStrategy {
    return getContainer().resolve(SERVICES.StorageStrategy) as IStorageStrategy;
  },
  get storageRegistry(): StorageStrategyRegistry {
    return getContainer().resolve(SERVICES.StorageStrategyRegistry) as StorageStrategyRegistry;
  },
};
