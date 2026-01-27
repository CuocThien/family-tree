/**
 * Dependency Injection Container Types
 *
 * Provides type definitions for the DI container including service identifiers,
 * lifecycle management, and service descriptors.
 */

/**
 * Service identifier type for dependency resolution.
 * Can be a symbol (preferred for type safety), a string, or a constructor.
 */
export type ServiceIdentifier<T> = symbol | string | (new (...args: unknown[]) => T);

/**
 * Service lifecycle determines how instances are managed.
 * - singleton: One instance shared across the entire application
 * - transient: New instance created on each resolution
 */
export type Lifecycle = 'singleton' | 'transient';

/**
 * Describes how a service should be registered and created in the container.
 */
export interface ServiceDescriptor<T> {
  /** Unique identifier for this service */
  identifier: ServiceIdentifier<T>;
  /** Factory function that creates the service instance */
  factory: (container: IContainer) => T;
  /** Lifecycle management for this service */
  lifecycle: Lifecycle;
}

/**
 * Main container interface for dependency registration and resolution.
 */
export interface IContainer {
  /** Register a service descriptor with the container */
  register<T>(descriptor: ServiceDescriptor<T>): void;
  /** Resolve a service by its identifier */
  resolve<T>(identifier: ServiceIdentifier<T>): T;
  /** Check if a service is registered */
  has(identifier: ServiceIdentifier<unknown>): boolean;
}

/**
 * Service identifiers using symbols for type safety.
 * Symbols are preferred over strings to avoid naming collisions.
 */
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
  EmailService: Symbol.for('EmailService'),

  // Strategies
  VisualizationStrategyRegistry: Symbol.for('VisualizationStrategyRegistry'),
  StorageStrategy: Symbol.for('StorageStrategy'),
  StorageStrategyRegistry: Symbol.for('StorageStrategyRegistry'),

  // Infrastructure
  DatabaseConnection: Symbol.for('DatabaseConnection'),
} as const;

/**
 * Type alias for accessing values from SERVICES constant
 */
export type ServiceSymbol = keyof typeof SERVICES;
