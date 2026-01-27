import { IStorageStrategy } from './IStorageStrategy';

export class StorageStrategyRegistry {
  private strategies: Map<string, IStorageStrategy> = new Map();
  private defaultStrategy: string = 'local';

  register(strategy: IStorageStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  get(name?: string): IStorageStrategy {
    const strategyName = name || this.defaultStrategy;
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Storage strategy '${strategyName}' not found`);
    }
    return strategy;
  }

  setDefault(name: string): void {
    if (!this.strategies.has(name)) {
      throw new Error(`Cannot set default: strategy '${name}' not registered`);
    }
    this.defaultStrategy = name;
  }

  getAll(): IStorageStrategy[] {
    return Array.from(this.strategies.values());
  }

  has(name: string): boolean {
    return this.strategies.has(name);
  }
}
