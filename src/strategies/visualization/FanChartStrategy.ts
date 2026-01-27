import {
  IVisualizationStrategy,
  PositionedNode,
  PositionedEdge,
  VisualizationResult,
  VisualizationOptions,
} from './IVisualizationStrategy';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

export class FanChartStrategy implements IVisualizationStrategy {
  name = 'fan';

  private readonly DEFAULT_RADIUS_INCREMENT = 120;
  private readonly DEFAULT_START_ANGLE = -90; // Top
  private readonly DEFAULT_END_ANGLE = 270;

  calculate(
    persons: Map<string, IPerson>,
    relationships: IRelationship[],
    options: VisualizationOptions
  ): VisualizationResult {
    const nodes: PositionedNode[] = [];
    const edges: PositionedEdge[] = [];
    const maxGen = options.maxGenerations || 5;
    const radiusIncrement = this.DEFAULT_RADIUS_INCREMENT;

    // Validate root person exists
    if (!persons.has(options.rootPersonId)) {
      throw new Error(`Root person with ID '${options.rootPersonId}' not found`);
    }

    const parentMap = this.buildParentMap(relationships);
    const centerX = 0;
    const centerY = 0;

    // Root at center
    const rootPerson = persons.get(options.rootPersonId);
    if (rootPerson) {
      nodes.push({
        id: options.rootPersonId,
        type: 'person',
        position: { x: centerX, y: centerY },
        data: { person: rootPerson, generation: 0, isRoot: true },
      });
    }

    // Position ancestors in concentric arcs
    this.positionFanAncestors(
      options.rootPersonId,
      1,
      this.DEFAULT_START_ANGLE,
      this.DEFAULT_END_ANGLE,
      radiusIncrement,
      persons,
      parentMap,
      nodes,
      edges,
      maxGen,
      { centerX, centerY }
    );

    const bounds = this.calculateBounds(nodes);

    return {
      nodes,
      edges,
      bounds,
      centerPoint: { x: centerX, y: centerY },
    };
  }

  private positionFanAncestors(
    personId: string,
    generation: number,
    startAngle: number,
    endAngle: number,
    radiusIncrement: number,
    persons: Map<string, IPerson>,
    parentMap: Map<string, { father?: string; mother?: string }>,
    nodes: PositionedNode[],
    edges: PositionedEdge[],
    maxGen: number,
    center: { centerX: number; centerY: number }
  ): void {
    if (generation > maxGen) return;

    const parents = parentMap.get(personId);
    if (!parents) return;

    const radius = generation * radiusIncrement;
    const midAngle = (startAngle + endAngle) / 2;

    // Father takes first half of arc
    if (parents.father) {
      const fatherAngle = (startAngle + midAngle) / 2;
      const fatherPos = this.polarToCartesian(
        center.centerX,
        center.centerY,
        radius,
        fatherAngle
      );

      const person = persons.get(parents.father);
      if (person) {
        nodes.push({
          id: parents.father,
          type: 'person',
          position: fatherPos,
          data: { person, generation, isRoot: false },
        });

        edges.push({
          id: `${personId}-${parents.father}`,
          source: personId,
          target: parents.father,
          type: 'bezier',
        });

        this.positionFanAncestors(
          parents.father,
          generation + 1,
          startAngle,
          midAngle,
          radiusIncrement,
          persons,
          parentMap,
          nodes,
          edges,
          maxGen,
          center
        );
      }
    }

    // Mother takes second half of arc
    if (parents.mother) {
      const motherAngle = (midAngle + endAngle) / 2;
      const motherPos = this.polarToCartesian(
        center.centerX,
        center.centerY,
        radius,
        motherAngle
      );

      const person = persons.get(parents.mother);
      if (person) {
        nodes.push({
          id: parents.mother,
          type: 'person',
          position: motherPos,
          data: { person, generation, isRoot: false },
        });

        edges.push({
          id: `${personId}-${parents.mother}`,
          source: personId,
          target: parents.mother,
          type: 'bezier',
        });

        this.positionFanAncestors(
          parents.mother,
          generation + 1,
          midAngle,
          endAngle,
          radiusIncrement,
          persons,
          parentMap,
          nodes,
          edges,
          maxGen,
          center
        );
      }
    }
  }

  private polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ): { x: number; y: number } {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
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
