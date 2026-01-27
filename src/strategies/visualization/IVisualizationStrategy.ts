import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

export interface PositionedNode {
  id: string;
  type: 'person';
  position: { x: number; y: number };
  data: {
    person: IPerson;
    generation: number;
    isRoot: boolean;
    isSelected?: boolean;
  };
}

export interface PositionedEdge {
  id: string;
  source: string;
  target: string;
  type: 'smoothstep' | 'straight' | 'bezier';
  animated?: boolean;
  style?: Record<string, string>;
}

export interface VisualizationResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
  centerPoint: { x: number; y: number };
}

export interface VisualizationOptions {
  rootPersonId: string;
  maxGenerations?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export interface IVisualizationStrategy {
  name: string;
  calculate(
    persons: Map<string, IPerson>,
    relationships: IRelationship[],
    options: VisualizationOptions
  ): VisualizationResult;
}
