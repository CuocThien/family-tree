import { describe, it, expect } from '@jest/globals';
import { VisualizationStrategyRegistry } from '../VisualizationStrategyRegistry';
import { VerticalTreeStrategy } from '../VerticalTreeStrategy';
import { HorizontalTreeStrategy } from '../HorizontalTreeStrategy';
import { FanChartStrategy } from '../FanChartStrategy';
import { TimelineStrategy } from '../TimelineStrategy';

describe('VisualizationStrategyRegistry', () => {
  it('should register all default strategies', () => {
    const registry = new VisualizationStrategyRegistry();
    const names = registry.getNames();

    expect(names).toContain('vertical');
    expect(names).toContain('horizontal');
    expect(names).toContain('fan');
    expect(names).toContain('timeline');
    expect(names).toHaveLength(4);
  });

  it('should return strategy by name', () => {
    const registry = new VisualizationStrategyRegistry();
    const strategy = registry.get('vertical');

    expect(strategy).toBeInstanceOf(VerticalTreeStrategy);
    expect(strategy.name).toBe('vertical');
  });

  it('should throw error for unknown strategy', () => {
    const registry = new VisualizationStrategyRegistry();

    expect(() => registry.get('unknown')).toThrow(
      "Visualization strategy 'unknown' not found"
    );
  });

  it('should return all strategies', () => {
    const registry = new VisualizationStrategyRegistry();
    const strategies = registry.getAll();

    expect(strategies).toHaveLength(4);
    expect(strategies[0]).toHaveProperty('name');
    expect(strategies[0]).toHaveProperty('calculate');
  });

  it('should allow registering custom strategies', () => {
    const registry = new VisualizationStrategyRegistry();
    const customStrategy = new VerticalTreeStrategy();
    customStrategy.name = 'custom';

    registry.register(customStrategy);

    expect(registry.getNames()).toContain('custom');
    expect(registry.get('custom')).toBe(customStrategy);
  });
});
