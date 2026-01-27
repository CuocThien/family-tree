import {
  IVisualizationStrategy,
  PositionedNode,
  PositionedEdge,
  VisualizationResult,
  VisualizationOptions,
} from './IVisualizationStrategy';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

export class TimelineStrategy implements IVisualizationStrategy {
  name = 'timeline';

  private readonly YEAR_WIDTH = 20; // pixels per year
  private readonly ROW_HEIGHT = 100;

  calculate(
    persons: Map<string, IPerson>,
    relationships: IRelationship[],
    options: VisualizationOptions
  ): VisualizationResult {
    const nodes: PositionedNode[] = [];
    const edges: PositionedEdge[] = [];

    // Validate root person exists
    if (!persons.has(options.rootPersonId)) {
      throw new Error(`Root person with ID '${options.rootPersonId}' not found`);
    }

    // Sort persons by birth year
    const sortedPersons = Array.from(persons.values())
      .filter(p => p.dateOfBirth)
      .sort((a, b) => {
        const dateA = new Date(a.dateOfBirth!).getTime();
        const dateB = new Date(b.dateOfBirth!).getTime();
        return dateA - dateB;
      });

    if (sortedPersons.length === 0) {
      return {
        nodes,
        edges,
        bounds: {
          minX: 0,
          maxX: 0,
          minY: 0,
          maxY: 0,
          width: 0,
          height: 0,
        },
        centerPoint: { x: 0, y: 0 },
      };
    }

    const minYear = new Date(sortedPersons[0].dateOfBirth!).getFullYear();
    const maxYear = Math.max(
      ...sortedPersons.map(p => {
        if (p.dateOfDeath) return new Date(p.dateOfDeath).getFullYear();
        return new Date(p.dateOfBirth!).getFullYear() + 80; // Estimate
      })
    );

    // Assign rows to avoid overlap
    const rowAssignments = this.assignRows(sortedPersons);

    sortedPersons.forEach((person, index) => {
      const birthYear = new Date(person.dateOfBirth!).getFullYear();
      const x = (birthYear - minYear) * this.YEAR_WIDTH;
      const y = rowAssignments.get(person._id) ?? index * this.ROW_HEIGHT;

      nodes.push({
        id: person._id,
        type: 'person',
        position: { x, y },
        data: {
          person,
          generation: 0, // Not applicable for timeline
          isRoot: person._id === options.rootPersonId,
        },
      });
    });

    // Create relationship edges
    relationships.forEach(rel => {
      const fromNode = nodes.find(n => n.id === rel.fromPersonId);
      const toNode = nodes.find(n => n.id === rel.toPersonId);

      if (fromNode && toNode) {
        edges.push({
          id: `${rel.fromPersonId}-${rel.toPersonId}`,
          source: rel.fromPersonId,
          target: rel.toPersonId,
          type: 'bezier',
          animated: rel.type === 'spouse',
        });
      }
    });

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

  private assignRows(persons: IPerson[]): Map<string, number> {
    const rowAssignments = new Map<string, number>();
    const rowEndYears: number[] = [];

    for (const person of persons) {
      if (!person.dateOfBirth) continue;

      const birthYear = new Date(person.dateOfBirth).getFullYear();
      const endYear = person.dateOfDeath
        ? new Date(person.dateOfDeath).getFullYear()
        : new Date().getFullYear();

      // Find first row where this person fits
      const assignedRow = rowEndYears.findIndex(endYear => endYear < birthYear - 5);

      if (assignedRow === -1) {
        rowEndYears.push(endYear);
        rowAssignments.set(person._id, (rowEndYears.length - 1) * this.ROW_HEIGHT);
      } else {
        rowEndYears[assignedRow] = endYear;
        rowAssignments.set(person._id, assignedRow * this.ROW_HEIGHT);
      }
    }

    return rowAssignments;
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
