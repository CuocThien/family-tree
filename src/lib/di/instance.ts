/**
 * Global Container Instance
 *
 * Provides a singleton container instance for the application.
 * This is the main entry point for accessing services through the DI container.
 */

import { configureContainer } from './containerConfig';
import { Container } from './Container';
import { SERVICES } from './types';

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
  get emailService() {
    return getContainer().resolve(SERVICES.EmailService);
  },
  get visualizationStrategies() {
    return getContainer().resolve(SERVICES.VisualizationStrategyRegistry);
  },
  get storageStrategy() {
    return getContainer().resolve(SERVICES.StorageStrategy);
  },
  get storageRegistry() {
    return getContainer().resolve(SERVICES.StorageStrategyRegistry);
  },
};
