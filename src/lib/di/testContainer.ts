/**
 * Test Container Helpers
 *
 * Provides utility functions for creating containers configured for testing.
 * Includes helpers for creating mock repositories and services.
 */

import { Container } from './Container';
import { configureContainer } from './containerConfig';
import { SERVICES } from './types';
import type { IContainer } from './types';

/**
 * Create a container with all services replaced with mocks.
 * This is useful for integration tests where you want to control all dependencies.
 */
export function createTestContainer(): Container {
  const container = new Container();

  // Register mock repositories with no-op implementations
  container.register({
    identifier: SERVICES.PersonRepository,
    factory: () => createMockPersonRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.TreeRepository,
    factory: () => createMockTreeRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.RelationshipRepository,
    factory: () => createMockRelationshipRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.MediaRepository,
    factory: () => createMockMediaRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.UserRepository,
    factory: () => createMockUserRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.AuditLogRepository,
    factory: () => createMockAuditLogRepository(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.EmailService,
    factory: () => createMockEmailService(),
    lifecycle: 'singleton',
  });

  // Register strategies with minimal implementations
  container.register({
    identifier: SERVICES.VisualizationStrategyRegistry,
    factory: () => createMockVisualizationRegistry(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.StorageStrategyRegistry,
    factory: () => createMockStorageRegistry(),
    lifecycle: 'singleton',
  });

  container.register({
    identifier: SERVICES.StorageStrategy,
    factory: () => createMockStorageStrategy(),
    lifecycle: 'singleton',
  });

  return container;
}

/**
 * Create a container with specific service overrides.
 * Starts with the full production container and replaces specified services.
 *
 * @param mocks - Partial record of service identifiers to mock instances
 * @returns A container with the specified services mocked
 *
 * @example
 * ```ts
 * const mockPersonRepo = {
 *   findById: jest.fn().mockResolvedValue(mockPerson),
 *   // ... other methods
 * };
 *
 * const container = createContainerWithMocks({
 *   PersonRepository: mockPersonRepo,
 * });
 *
 * const personService = container.resolve(SERVICES.PersonService);
 * ```
 */
export function createContainerWithMocks(
  mocks: Partial<Record<keyof typeof SERVICES, unknown>>
): Container {
  const container = configureContainer();

  for (const [key, mock] of Object.entries(mocks)) {
    const identifier = SERVICES[key as keyof typeof SERVICES];
    if (identifier && mock !== undefined) {
      container.override(identifier, mock);
    }
  }

  return container;
}

/**
 * Create a container that only includes specific services.
 * Useful for unit tests where you want to test a single service in isolation.
 */
export function createMinimalContainer(
  services: Array<{
    identifier: symbol;
    factory: (container: IContainer) => unknown;
  }>
): Container {
  const container = new Container();

  for (const service of services) {
    container.register({
      identifier: service.identifier,
      factory: service.factory,
      lifecycle: 'singleton',
    });
  }

  return container;
}

// ==================
// Mock Factory Functions
// ==================

function createMockPersonRepository() {
  return {
    findById: jest.fn(),
    findByTreeId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
    countByTreeId: jest.fn(),
    findByIds: jest.fn(),
    exists: jest.fn(),
    existsInTree: jest.fn(),
    deleteByTreeId: jest.fn(),
  };
}

function createMockTreeRepository() {
  return {
    findById: jest.fn(),
    findByOwnerId: jest.fn(),
    findByCollaboratorId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    isOwner: jest.fn(),
  };
}

function createMockRelationshipRepository() {
  return {
    findById: jest.fn(),
    findByTreeId: jest.fn(),
    findByPersonId: jest.fn(),
    findBetweenPersons: jest.fn(),
    findParents: jest.fn(),
    findChildren: jest.fn(),
    findSpouses: jest.fn(),
    findSiblings: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteByTreeId: jest.fn(),
  };
}

function createMockMediaRepository() {
  return {
    findById: jest.fn(),
    findByTreeId: jest.fn(),
    findByPersonId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteByTreeId: jest.fn(),
  };
}

function createMockUserRepository() {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function createMockAuditLogRepository() {
  return {
    create: jest.fn(),
    findByTreeId: jest.fn(),
    findByUserId: jest.fn(),
    findByEntityId: jest.fn(),
  };
}

function createMockEmailService() {
  return {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };
}

function createMockVisualizationRegistry() {
  return {
    register: jest.fn(),
    get: jest.fn(),
    setDefault: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
  };
}

function createMockStorageRegistry() {
  return {
    register: jest.fn(),
    get: jest.fn(),
    setDefault: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
  };
}

function createMockStorageStrategy() {
  return {
    name: 'mock',
    upload: jest.fn(),
    download: jest.fn(),
    delete: jest.fn(),
    getPublicUrl: jest.fn(),
    getSignedUrl: jest.fn(),
    generateThumbnail: jest.fn(),
    exists: jest.fn(),
    getMetadata: jest.fn(),
  };
}
