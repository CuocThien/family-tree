/**
 * Dependency Injection Container Implementation
 *
 * A lightweight, type-safe DI container that supports:
 * - Singleton and transient lifecycles
 * - Circular dependency detection
 * - Lazy dependency resolution
 * - Test-friendly overrides
 */

import type { ServiceIdentifier, ServiceDescriptor, Lifecycle, IContainer } from './types';

export class Container implements IContainer {
  /** Registered service descriptors */
  private descriptors: Map<ServiceIdentifier<unknown>, ServiceDescriptor<unknown>> = new Map();

  /** Cached singleton instances */
  private singletons: Map<ServiceIdentifier<unknown>, unknown> = new Map();

  /** Currently resolving services (for circular dependency detection) */
  private resolving: Set<ServiceIdentifier<unknown>> = new Set();

  /**
   * Register a service descriptor with the container.
   * @param descriptor - The service descriptor to register
   */
  register<T>(descriptor: ServiceDescriptor<T>): void {
    this.descriptors.set(descriptor.identifier, descriptor as ServiceDescriptor<unknown>);
  }

  /**
   * Resolve a service by its identifier.
   * @param identifier - The service identifier to resolve
   * @returns The service instance
   * @throws Error if service is not registered or circular dependency is detected
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    // Check for cached singleton instance
    if (this.singletons.has(identifier)) {
      return this.singletons.get(identifier) as T;
    }

    // Get the service descriptor
    const descriptor = this.descriptors.get(identifier);
    if (!descriptor) {
      const identifierStr = this.identifierToString(identifier);
      throw new Error(
        `Service not registered: ${identifierStr}. ` +
        `Did you forget to register it in the container?`
      );
    }

    // Circular dependency detection
    if (this.resolving.has(identifier)) {
      const identifierStr = this.identifierToString(identifier);
      throw new Error(
        `Circular dependency detected while resolving: ${identifierStr}. ` +
        `Check your service dependencies.`
      );
    }

    // Resolve the service
    this.resolving.add(identifier);
    try {
      const instance = descriptor.factory(this) as T;

      // Cache singleton instances
      if (descriptor.lifecycle === 'singleton') {
        this.singletons.set(identifier, instance);
      }

      return instance;
    } finally {
      this.resolving.delete(identifier);
    }
  }

  /**
   * Check if a service is registered.
   * @param identifier - The service identifier to check
   * @returns True if the service is registered
   */
  has(identifier: ServiceIdentifier<unknown>): boolean {
    return this.descriptors.has(identifier);
  }

  /**
   * Clear all cached singleton instances.
   * Useful for testing or when resetting the container state.
   */
  clear(): void {
    this.singletons.clear();
  }

  /**
   * Override a registered service with a specific instance.
   * This is primarily useful for testing where you want to inject mocks.
   * @param identifier - The service identifier to override
   * @param instance - The instance to use for this service
   */
  override<T>(identifier: ServiceIdentifier<T>, instance: T): void {
    this.singletons.set(identifier, instance);
  }

  /**
   * Get a string representation of a service identifier for error messages.
   */
  private identifierToString(identifier: ServiceIdentifier<unknown>): string {
    if (typeof identifier === 'symbol') {
      return identifier.toString();
    }
    if (typeof identifier === 'string') {
      return identifier;
    }
    if (typeof identifier === 'function') {
      return identifier.name;
    }
    return String(identifier);
  }
}
