import { IVisualizationStrategy } from './IVisualizationStrategy';
import { VerticalTreeStrategy } from './VerticalTreeStrategy';
import { HorizontalTreeStrategy } from './HorizontalTreeStrategy';
import { FanChartStrategy } from './FanChartStrategy';
import { TimelineStrategy } from './TimelineStrategy';

export class VisualizationStrategyRegistry {
  private strategies: Map<string, IVisualizationStrategy> = new Map();

  constructor() {
    this.register(new VerticalTreeStrategy());
    this.register(new HorizontalTreeStrategy());
    this.register(new FanChartStrategy());
    this.register(new TimelineStrategy());
  }

  register(strategy: IVisualizationStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  get(name: string): IVisualizationStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Visualization strategy '${name}' not found`);
    }
    return strategy;
  }

  getAll(): IVisualizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  getNames(): string[] {
    return Array.from(this.strategies.keys());
  }
}
