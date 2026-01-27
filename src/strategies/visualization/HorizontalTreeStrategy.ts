import {
  IVisualizationStrategy,
  PositionedNode,
  PositionedEdge,
  VisualizationResult,
  VisualizationOptions,
} from './IVisualizationStrategy';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

export class HorizontalTreeStrategy implements IVisualizationStrategy {
  name = 'horizontal';

  private readonly DEFAULT_H_SPACING = 250;
  private readonly DEFAULT_V_SPACING = 120;

  calculate(
    persons: Map<string, IPerson>,
    relationships: IRelationship[],
    options: VisualizationOptions
  ): VisualizationResult {
    const nodes: PositionedNode[] = [];
    const edges: PositionedEdge[] = [];

    const hSpacing = options.horizontalSpacing || this.DEFAULT_H_SPACING;
    const vSpacing = options.verticalSpacing || this.DEFAULT_V_SPACING;
    const maxGen = options.maxGenerations || 5;

    // Validate root person exists
    if (!persons.has(options.rootPersonId)) {
      throw new Error(`Root person with ID '${options.rootPersonId}' not found`);
    }

    // Build parent map for ancestor traversal
    const parentMap = this.buildParentMap(relationships);

    // Position root at center-left
    const rootY = Math.pow(2, maxGen) * vSpacing / 2;

    this.positionAncestors(
      options.rootPersonId,
      0,
      0,
      rootY,
      vSpacing * Math.pow(2, maxGen - 1),
      persons,
      parentMap,
      nodes,
      edges,
      maxGen,
      hSpacing
    );

    const bounds = this.calculateBounds(nodes);

    return {
      nodes,
      edges,
      bounds,
      centerPoint: { x: bounds.width / 4, y: rootY },
    };
  }

  private positionAncestors(
    personId: string,
    generation: number,
    x: number,
    y: number,
    ySpacing: number,
    persons: Map<string, IPerson>,
    parentMap: Map<string, { father?: string; mother?: string }>,
    nodes: PositionedNode[],
    edges: PositionedEdge[],
    maxGen: number,
    hSpacing: number
  ): void {
    const person = persons.get(personId);
    if (!person || generation > maxGen) return;

    nodes.push({
      id: personId,
      type: 'person',
      position: { x, y },
      data: {
        person,
        generation,
        isRoot: generation === 0,
      },
    });

    const parents = parentMap.get(personId);
    if (!parents || generation >= maxGen) return;

    const nextX = x + hSpacing;
    const nextYSpacing = ySpacing / 2;

    // Father (top)
    if (parents.father) {
      const fatherY = y - ySpacing / 2;
      edges.push({
        id: `${personId}-${parents.father}`,
        source: personId,
        target: parents.father,
        type: 'smoothstep',
      });
      this.positionAncestors(
        parents.father,
        generation + 1,
        nextX,
        fatherY,
        nextYSpacing,
        persons,
        parentMap,
        nodes,
        edges,
        maxGen,
        hSpacing
      );
    }

    // Mother (bottom)
    if (parents.mother) {
      const motherY = y + ySpacing / 2;
      edges.push({
        id: `${personId}-${parents.mother}`,
        source: personId,
        target: parents.mother,
        type: 'smoothstep',
      });
      this.positionAncestors(
        parents.mother,
        generation + 1,
        nextX,
        motherY,
        nextYSpacing,
        persons,
        parentMap,
        nodes,
        edges,
        maxGen,
        hSpacing
      );
    }
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
