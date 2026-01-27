import {
  IVisualizationStrategy,
  PositionedNode,
  PositionedEdge,
  VisualizationResult,
  VisualizationOptions,
} from './IVisualizationStrategy';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

export class VerticalTreeStrategy implements IVisualizationStrategy {
  name = 'vertical';

  private readonly DEFAULT_H_SPACING = 200;
  private readonly DEFAULT_V_SPACING = 150;
  private readonly NODE_WIDTH = 160;
  private readonly NODE_HEIGHT = 100;

  calculate(
    persons: Map<string, IPerson>,
    relationships: IRelationship[],
    options: VisualizationOptions
  ): VisualizationResult {
    const nodes: PositionedNode[] = [];
    const edges: PositionedEdge[] = [];
    const visited = new Set<string>();

    const hSpacing = options.horizontalSpacing || this.DEFAULT_H_SPACING;
    const vSpacing = options.verticalSpacing || this.DEFAULT_V_SPACING;
    const direction = options.direction || 'down';

    // Build adjacency map for efficient traversal
    const childrenMap = this.buildChildrenMap(relationships);
    const parentMap = this.buildParentMap(relationships);

    // Validate root person exists
    if (!persons.has(options.rootPersonId)) {
      throw new Error(`Root person with ID '${options.rootPersonId}' not found`);
    }

    // Calculate subtree widths for proper positioning
    const subtreeWidths = this.calculateSubtreeWidths(
      options.rootPersonId,
      childrenMap,
      hSpacing
    );

    // Position nodes using recursive algorithm
    this.positionNode(
      options.rootPersonId,
      0, // generation
      0, // x offset
      persons,
      childrenMap,
      subtreeWidths,
      nodes,
      edges,
      visited,
      { hSpacing, vSpacing, direction, maxGen: options.maxGenerations || 10 }
    );

    const bounds = this.calculateBounds(nodes);

    return {
      nodes,
      edges,
      bounds,
      centerPoint: {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      },
    };
  }

  private positionNode(
    personId: string,
    generation: number,
    xOffset: number,
    persons: Map<string, IPerson>,
    childrenMap: Map<string, string[]>,
    subtreeWidths: Map<string, number>,
    nodes: PositionedNode[],
    edges: PositionedEdge[],
    visited: Set<string>,
    config: { hSpacing: number; vSpacing: number; direction: string; maxGen: number }
  ): void {
    if (visited.has(personId) || generation > config.maxGen) return;
    visited.add(personId);

    const person = persons.get(personId);
    if (!person) return;

    const y = config.direction === 'down'
      ? generation * config.vSpacing
      : -generation * config.vSpacing;

    nodes.push({
      id: personId,
      type: 'person',
      position: { x: xOffset, y },
      data: {
        person,
        generation,
        isRoot: generation === 0,
      },
    });

    const children = childrenMap.get(personId) || [];
    let childXOffset = xOffset - (subtreeWidths.get(personId) || 0) / 2;

    for (const childId of children) {
      const childWidth = subtreeWidths.get(childId) || config.hSpacing;
      const childX = childXOffset + childWidth / 2;

      edges.push({
        id: `${personId}-${childId}`,
        source: personId,
        target: childId,
        type: 'smoothstep',
      });

      this.positionNode(
        childId,
        generation + 1,
        childX,
        persons,
        childrenMap,
        subtreeWidths,
        nodes,
        edges,
        visited,
        config
      );

      childXOffset += childWidth;
    }
  }

  private calculateSubtreeWidths(
    personId: string,
    childrenMap: Map<string, string[]>,
    hSpacing: number,
    visited = new Set<string>()
  ): Map<string, number> {
    const widths = new Map<string, number>();

    const calculateWidth = (id: string): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const children = childrenMap.get(id) || [];
      if (children.length === 0) {
        widths.set(id, hSpacing);
        return hSpacing;
      }

      const totalWidth = children.reduce(
        (sum, childId) => sum + calculateWidth(childId),
        0
      );

      widths.set(id, totalWidth);
      return totalWidth;
    };

    calculateWidth(personId);
    return widths;
  }

  private buildChildrenMap(relationships: IRelationship[]): Map<string, string[]> {
    const childrenMap = new Map<string, string[]>();

    for (const rel of relationships) {
      if (rel.type === 'child') {
        const children = childrenMap.get(rel.fromPersonId) || [];
        children.push(rel.toPersonId);
        childrenMap.set(rel.fromPersonId, children);
      }
    }

    return childrenMap;
  }

  private buildParentMap(
    relationships: IRelationship[]
  ): Map<string, { father?: string; mother?: string }> {
    const parentMap = new Map<string, { father?: string; mother?: string }>();

    for (const rel of relationships) {
      if (rel.type === 'child') {
        const parents = parentMap.get(rel.toPersonId) || {};
        const fromPerson = rel.fromPersonId;

        if (!parents.father) {
          parents.father = fromPerson;
        } else if (!parents.mother) {
          parents.mother = fromPerson;
        }

        parentMap.set(rel.toPersonId, parents);
      }
    }

    return parentMap;
  }

  private calculateBounds(nodes: PositionedNode[]) {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y);
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
