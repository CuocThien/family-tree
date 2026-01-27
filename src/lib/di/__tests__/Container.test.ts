/**
 * Container Unit Tests
 *
 * Tests for the DI Container implementation including:
 * - Service registration
 * - Dependency resolution
 * - Lifecycle management (singleton vs transient)
 * - Circular dependency detection
 * - Error handling
 */

import { Container } from '../Container';
import type { ServiceDescriptor, IContainer } from '../types';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  afterEach(() => {
    container.clear();
  });

  describe('Service Registration', () => {
    it('should register a service with a symbol identifier', () => {
      const descriptor: ServiceDescriptor<string> = {
        identifier: Symbol.for('TestService'),
        factory: () => 'test',
        lifecycle: 'singleton',
      };

      container.register(descriptor);

      expect(container.has(descriptor.identifier)).toBe(true);
    });

    it('should register a service with a string identifier', () => {
      const descriptor: ServiceDescriptor<string> = {
        identifier: 'TestService',
        factory: () => 'test',
        lifecycle: 'singleton',
      };

      container.register(descriptor);

      expect(container.has(descriptor.identifier)).toBe(true);
    });

    it('should allow overwriting a service registration', () => {
      const identifier = Symbol.for('TestService');
      const descriptor1: ServiceDescriptor<string> = {
        identifier,
        factory: () => 'first',
        lifecycle: 'singleton',
      };
      const descriptor2: ServiceDescriptor<string> = {
        identifier,
        factory: () => 'second',
        lifecycle: 'singleton',
      };

      container.register(descriptor1);
      container.register(descriptor2);

      const result = container.resolve<string>(identifier);
      expect(result).toBe('second');
    });
  });

  describe('Service Resolution', () => {
    it('should resolve a registered service', () => {
      const identifier = Symbol.for('TestService');
      const expectedValue = { name: 'test' };

      container.register({
        identifier,
        factory: () => expectedValue,
        lifecycle: 'singleton',
      });

      const result = container.resolve(identifier);
      expect(result).toBe(expectedValue);
    });

    it('should throw error for unregistered service', () => {
      const identifier = Symbol.for('NonExistentService');

      expect(() => container.resolve(identifier)).toThrow(
        "Service not registered: Symbol(NonExistentService)"
      );
    });

    it('should provide helpful error message for missing services', () => {
      const identifier = Symbol.for('MissingService');

      expect(() => container.resolve(identifier)).toThrow(
        /Did you forget to register it in the container/
      );
    });

    it('should resolve services with constructor injection', () => {
      const DepId = Symbol.for('Dependency');
      const ServiceId = Symbol.for('Service');

      container.register({
        identifier: DepId,
        factory: () => ({ value: 'dependency' }),
        lifecycle: 'singleton',
      });

      container.register({
        identifier: ServiceId,
        factory: (c: IContainer) => ({
          dep: c.resolve(DepId),
        }),
        lifecycle: 'singleton',
      });

      const result = container.resolve(ServiceId);
      expect(result.dep.value).toBe('dependency');
    });
  });

  describe('Singleton Lifecycle', () => {
    it('should return the same instance for singleton services', () => {
      const identifier = Symbol.for('SingletonService');
      let callCount = 0;

      container.register({
        identifier,
        factory: () => ({ count: ++callCount }),
        lifecycle: 'singleton',
      });

      const instance1 = container.resolve(identifier);
      const instance2 = container.resolve(identifier);

      expect(instance1).toBe(instance2);
      expect(instance1.count).toBe(1);
      expect(instance2.count).toBe(1);
    });

    it('should cache singleton instances', () => {
      const identifier = Symbol.for('CachedService');
      let callCount = 0;

      container.register({
        identifier,
        factory: () => ({ count: ++callCount }),
        lifecycle: 'singleton',
      });

      container.resolve(identifier);
      container.resolve(identifier);
      container.resolve(identifier);

      expect(callCount).toBe(1);
    });
  });

  describe('Transient Lifecycle', () => {
    it('should create new instances for transient services', () => {
      const identifier = Symbol.for('TransientService');
      let callCount = 0;

      container.register({
        identifier,
        factory: () => ({ count: ++callCount }),
        lifecycle: 'transient',
      });

      const instance1 = container.resolve(identifier);
      const instance2 = container.resolve(identifier);

      expect(instance1).not.toBe(instance2);
      expect(instance1.count).toBe(1);
      expect(instance2.count).toBe(2);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect direct circular dependencies', () => {
      const ServiceA = Symbol.for('ServiceA');
      const ServiceB = Symbol.for('ServiceB');

      container.register({
        identifier: ServiceA,
        factory: (c) => c.resolve(ServiceB),
        lifecycle: 'singleton',
      });

      container.register({
        identifier: ServiceB,
        factory: (c) => c.resolve(ServiceA),
        lifecycle: 'singleton',
      });

      expect(() => container.resolve(ServiceA)).toThrow(
        /Circular dependency detected/
      );
    });

    it('should detect indirect circular dependencies', () => {
      const ServiceA = Symbol.for('ServiceA');
      const ServiceB = Symbol.for('ServiceB');
      const ServiceC = Symbol.for('ServiceC');

      container.register({
        identifier: ServiceA,
        factory: (c) => c.resolve(ServiceB),
        lifecycle: 'singleton',
      });

      container.register({
        identifier: ServiceB,
        factory: (c) => c.resolve(ServiceC),
        lifecycle: 'singleton',
      });

      container.register({
        identifier: ServiceC,
        factory: (c) => c.resolve(ServiceA),
        lifecycle: 'singleton',
      });

      expect(() => container.resolve(ServiceA)).toThrow(
        /Circular dependency detected/
      );
    });

    it('should provide helpful error message for circular dependencies', () => {
      const ServiceA = Symbol.for('ServiceA');
      const ServiceB = Symbol.for('ServiceB');

      container.register({
        identifier: ServiceA,
        factory: (c) => c.resolve(ServiceB),
        lifecycle: 'singleton',
      });

      container.register({
        identifier: ServiceB,
        factory: (c) => c.resolve(ServiceA),
        lifecycle: 'singleton',
      });

      expect(() => container.resolve(ServiceA)).toThrow(
        /Check your service dependencies/
      );
    });

    it('should allow self-resolving dependencies after circular detection', () => {
      const ServiceA = Symbol.for('ServiceA');
      const ServiceB = Symbol.for('ServiceB');
      const ServiceC = Symbol.for('ServiceC');

      // A -> B -> C (no cycle)
      container.register({
        identifier: ServiceC,
        factory: () => ({ name: 'C' }),
        lifecycle: 'singleton',
      });

      container.register({
        identifier: ServiceB,
        factory: (c) => ({
          name: 'B',
          c: c.resolve(ServiceC),
        }),
        lifecycle: 'singleton',
      });

      container.register({
        identifier: ServiceA,
        factory: (c) => ({
          name: 'A',
          b: c.resolve(ServiceB),
        }),
        lifecycle: 'singleton',
      });

      const result = container.resolve(ServiceA);
      expect(result.b.c.name).toBe('C');
    });
  });

  describe('Container Methods', () => {
    it('should check if a service is registered', () => {
      const identifier = Symbol.for('TestService');

      expect(container.has(identifier)).toBe(false);

      container.register({
        identifier,
        factory: () => ({}),
        lifecycle: 'singleton',
      });

      expect(container.has(identifier)).toBe(true);
    });

    it('should clear all singleton instances', () => {
      const identifier = Symbol.for('TestService');
      let callCount = 0;

      container.register({
        identifier,
        factory: () => ({ count: ++callCount }),
        lifecycle: 'singleton',
      });

      const instance1 = container.resolve(identifier);
      container.clear();
      const instance2 = container.resolve(identifier);

      expect(instance1.count).toBe(1);
      expect(instance2.count).toBe(2);
      expect(instance1).not.toBe(instance2);
    });

    it('should override a registered service', () => {
      const identifier = Symbol.for('TestService');

      container.register({
        identifier,
        factory: () => ({ value: 'original' }),
        lifecycle: 'singleton',
      });

      const instance1 = container.resolve(identifier);
      expect(instance1.value).toBe('original');

      const mockInstance = { value: 'mocked' };
      container.override(identifier, mockInstance);

      const instance2 = container.resolve(identifier);
      expect(instance2).toBe(mockInstance);
      expect(instance2.value).toBe('mocked');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple dependencies', () => {
      const Dep1 = Symbol.for('Dep1');
      const Dep2 = Symbol.for('Dep2');
      const Dep3 = Symbol.for('Dep3');
      const Main = Symbol.for('Main');

      container.register({
        identifier: Dep1,
        factory: () => 'dep1',
        lifecycle: 'singleton',
      });

      container.register({
        identifier: Dep2,
        factory: () => 'dep2',
        lifecycle: 'singleton',
      });

      container.register({
        identifier: Dep3,
        factory: () => 'dep3',
        lifecycle: 'singleton',
      });

      container.register({
        identifier: Main,
        factory: (c) => ({
          d1: c.resolve(Dep1),
          d2: c.resolve(Dep2),
          d3: c.resolve(Dep3),
        }),
        lifecycle: 'singleton',
      });

      const result = container.resolve(Main);
      expect(result.d1).toBe('dep1');
      expect(result.d2).toBe('dep2');
      expect(result.d3).toBe('dep3');
    });

    it('should handle mixed lifecycles', () => {
      const Singleton = Symbol.for('Singleton');
      const Transient = Symbol.for('Transient');
      const Consumer = Symbol.for('Consumer');

      let singletonCount = 0;
      let transientCount = 0;

      container.register({
        identifier: Singleton,
        factory: () => ({ id: ++singletonCount }),
        lifecycle: 'singleton',
      });

      container.register({
        identifier: Transient,
        factory: () => ({ id: ++transientCount }),
        lifecycle: 'transient',
      });

      container.register({
        identifier: Consumer,
        factory: (c) => ({
          s: c.resolve(Singleton),
          t: c.resolve(Transient),
        }),
        lifecycle: 'transient',
      });

      const consumer1 = container.resolve(Consumer);
      const consumer2 = container.resolve(Consumer);

      // Singleton should be the same instance
      expect(consumer1.s).toBe(consumer2.s);
      expect(consumer1.s.id).toBe(1);

      // Transient should be different instances
      expect(consumer1.t).not.toBe(consumer2.t);
      expect(consumer1.t.id).toBe(1);
      expect(consumer2.t.id).toBe(2);
    });
  });
});
