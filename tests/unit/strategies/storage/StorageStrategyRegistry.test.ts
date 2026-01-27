import { describe, it, expect, beforeEach } from '@jest/globals';
import { StorageStrategyRegistry } from '../../../../src/strategies/storage/StorageStrategyRegistry';
import { IStorageStrategy } from '../../../../src/strategies/storage/IStorageStrategy';

class MockStorageStrategy implements IStorageStrategy {
  name = 'mock';

  async upload(): Promise<any> {
    return { id: 'mock-id', url: 'mock-url', size: 0, mimeType: 'text/plain' };
  }

  async download(): Promise<any> {
    return { stream: null, size: 0, mimeType: 'text/plain' };
  }

  async delete(): Promise<void> {}

  getPublicUrl(fileId: string): string {
    return `/mock/${fileId}`;
  }

  async getSignedUrl(): Promise<string> {
    return '/mock/signed';
  }

  async generateThumbnail(): Promise<any> {
    return { id: 'thumb-id', url: 'thumb-url', size: 0, mimeType: 'image/jpeg' };
  }

  async exists(): Promise<boolean> {
    return true;
  }

  async getMetadata(): Promise<Record<string, unknown>> {
    return {};
  }
}

describe('StorageStrategyRegistry', () => {
  let registry: StorageStrategyRegistry;
  let mockStrategy: MockStorageStrategy;

  beforeEach(() => {
    registry = new StorageStrategyRegistry();
    mockStrategy = new MockStorageStrategy();
  });

  describe('register', () => {
    it('should register a storage strategy', () => {
      registry.register(mockStrategy);
      expect(registry.has('mock')).toBe(true);
    });

    it('should allow registering multiple strategies', () => {
      const strategy1 = new MockStorageStrategy();
      strategy1.name = 'strategy1';
      const strategy2 = new MockStorageStrategy();
      strategy2.name = 'strategy2';

      registry.register(strategy1);
      registry.register(strategy2);

      expect(registry.getAll()).toHaveLength(2);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      registry.register(mockStrategy);
    });

    it('should return registered strategy by name', () => {
      const strategy = registry.get('mock');
      expect(strategy).toBe(mockStrategy);
    });

    it('should return default strategy when no name provided', () => {
      registry.setDefault('mock');
      const strategy = registry.get();
      expect(strategy.name).toBe('mock');
    });

    it('should throw error for non-existent strategy', () => {
      expect(() => registry.get('non-existent')).toThrow("Storage strategy 'non-existent' not found");
    });

    it('should throw error when default strategy not set and no name provided', () => {
      const newRegistry = new StorageStrategyRegistry();
      expect(() => newRegistry.get()).toThrow("Storage strategy 'local' not found");
    });
  });

  describe('setDefault', () => {
    beforeEach(() => {
      registry.register(mockStrategy);
    });

    it('should set default strategy', () => {
      registry.setDefault('mock');
      const strategy = registry.get();
      expect(strategy.name).toBe('mock');
    });

    it('should throw error when setting non-existent strategy as default', () => {
      expect(() => registry.setDefault('non-existent')).toThrow("Cannot set default: strategy 'non-existent' not registered");
    });
  });

  describe('getAll', () => {
    it('should return all registered strategies', () => {
      const strategy1 = new MockStorageStrategy();
      strategy1.name = 'strategy1';
      const strategy2 = new MockStorageStrategy();
      strategy2.name = 'strategy2';

      registry.register(strategy1);
      registry.register(strategy2);

      const strategies = registry.getAll();
      expect(strategies).toHaveLength(2);
      expect(strategies).toContain(strategy1);
      expect(strategies).toContain(strategy2);
    });

    it('should return empty array when no strategies registered', () => {
      const strategies = registry.getAll();
      expect(strategies).toEqual([]);
    });
  });

  describe('has', () => {
    beforeEach(() => {
      registry.register(mockStrategy);
    });

    it('should return true for registered strategy', () => {
      expect(registry.has('mock')).toBe(true);
    });

    it('should return false for non-existent strategy', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });
});
