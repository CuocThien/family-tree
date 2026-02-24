import { IPerson } from './person';

/**
 * Tree layout types for orthogonal (traditional Chinese family tree) layout
 */

export interface TreeNodeLayout {
  id: string;
  person: IPerson;
  generation: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  familyUnitId?: string;
  isRoot: boolean;
}

export interface JunctionNode {
  id: string;
  type: 'junction';
  position: { x: number; y: number };
  parentIds: [string, string | null];
  childIds: string[];
}

export interface OrthogonalEdge {
  id: string;
  source: string;
  target: string;
  type: 'spouse' | 'parent-child' | 'distribution';
  path: string;
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
}

export interface GenerationRow {
  level: number;
  y: number;
  height: number;
  label: string;
  labelVisible: boolean;
}

export interface OrthogonalLayoutOptions {
  horizontalSpacing?: number;
  verticalSpacing?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  showGenerationLabels?: boolean;
}
