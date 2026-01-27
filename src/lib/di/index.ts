/**
 * Dependency Injection Container
 *
 * A lightweight, type-safe DI container for the Family Tree application.
 * Provides dependency registration, resolution, and lifecycle management.
 *
 * @example
 * ```ts
 * import { container, getContainer, SERVICES } from '@/lib/di';
 *
 * // Using the convenience object
 * const personService = container.personService;
 *
 * // Using getContainer directly
 * const container = getContainer();
 * const treeService = container.resolve(SERVICES.TreeService);
 * ```
 */

// Core types
export type { ServiceIdentifier, ServiceDescriptor, Lifecycle, IContainer } from './types';
export { SERVICES } from './types';

// Container implementation
export { Container } from './Container';

// Container configuration
export { configureContainer } from './containerConfig';

// Global instance
export { getContainer, resetContainer, container } from './instance';

// Test helpers
export {
  createTestContainer,
  createContainerWithMocks,
  createMinimalContainer,
} from './testContainer';

// Environment configuration
export {
  loadEnvConfig,
  validateEnvConfig,
  isDevelopment,
  isProduction,
  isTest,
  getEnvironment,
} from './envConfig';
export type { EnvConfig } from './envConfig';
