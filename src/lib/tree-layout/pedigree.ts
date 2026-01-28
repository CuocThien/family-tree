import { Node, Edge } from 'reactflow';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 150;

interface LayoutNode {
  id: string;
  person: IPerson;
  generation: number;
  x: number;
  y: number;
}

interface LayoutOptions {
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

/**
 * Calculate pedigree layout (horizontal tree layout) for family tree visualization
 */
export function calculatePedigreeLayout(
  rootPersonId: string,
  persons: IPerson[],
  relationships: IRelationship[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const hSpacing = options.horizontalSpacing ?? HORIZONTAL_SPACING;
  const vSpacing = options.verticalSpacing ?? VERTICAL_SPACING;

  const personMap = new Map(persons.map((p) => [p._id, p]));
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Track positions to prevent overlaps
  const positionMap = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  function traverse(personId: string, generation: number, yOffset: number): number {
    if (visited.has(personId)) {
      return yOffset;
    }

    visited.add(personId);
    const person = personMap.get(personId);

    if (!person) {
      return yOffset;
    }

    // Calculate position
    const x = generation * hSpacing;
    const y = yOffset;

    // Store position
    positionMap.set(personId, { x, y });

    // Add node
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

    // Find parents
    const parentRelationships = relationships.filter(
      (r) => r.toPersonId === personId && r.type === 'parent'
    );

    if (parentRelationships.length > 0) {
      const parentSpacing = vSpacing;

      // Calculate Y positions for parents to center them
      const totalHeight = (parentRelationships.length - 1) * parentSpacing;
      const startY = yOffset - totalHeight / 2;

      parentRelationships.forEach((parentRel, index) => {
        const parentId = parentRel.fromPersonId;
        const parentY = startY + index * parentSpacing;

        // Add edge from person to parent (visualizing ancestry)
        edges.push({
          id: `${personId}-${parentId}`,
          source: personId,
          target: parentId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
        });

        // Recursively process parent
        traverse(parentId, generation + 1, parentY);
      });
    }

    // Find children (for forward connections)
    const childRelationships = relationships.filter(
      (r) => r.fromPersonId === personId && r.type === 'parent'
    );

    childRelationships.forEach((childRel) => {
      const childId = childRel.toPersonId;

      // Only add edge if not already visited (avoid duplicates)
      if (!visited.has(childId)) {
        edges.push({
          id: `${personId}-${childId}-child`,
          source: personId,
          target: childId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
        });
      }
    });

    return yOffset;
  }

  // Start traversal from root person
  traverse(rootPersonId, 0, 300);

  // Recalculate positions to prevent overlaps
  recalculatePositions(nodes);

  return { nodes, edges };
}

/**
 * Recalculate node positions to minimize overlaps
 */
function recalculatePositions(nodes: Node[]): void {
  // Group nodes by generation
  const generationMap = new Map<number, Node[]>();

  nodes.forEach((node) => {
    const generation = (node.data as { generation: number }).generation;
    if (!generationMap.has(generation)) {
      generationMap.set(generation, []);
    }
    generationMap.get(generation)!.push(node);
  });

  // For each generation, distribute nodes evenly
  generationMap.forEach((genNodes, generation) => {
    genNodes.sort((a, b) => a.position.y - b.position.y);

    const totalHeight = (genNodes.length - 1) * VERTICAL_SPACING;
    const startY = 300 - totalHeight / 2;

    genNodes.forEach((node, index) => {
      node.position.y = startY + index * VERTICAL_SPACING;
    });
  });
}
