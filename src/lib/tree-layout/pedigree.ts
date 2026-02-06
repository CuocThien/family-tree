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
  const spousePairs = new Map<string, string>(); // Track spouse relationships

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

    // Find spouses
    const spouseRelationships = relationships.filter(
      (r) => (r.fromPersonId === personId || r.toPersonId === personId) && r.type === 'spouse'
    );

    spouseRelationships.forEach((spouseRel) => {
      const spouseId = spouseRel.fromPersonId === personId ? spouseRel.toPersonId : spouseRel.fromPersonId;

      // Track this spouse relationship for edge creation later
      if (!spousePairs.has(personId) || !spousePairs.has(spouseId)) {
        spousePairs.set(personId, spouseId);
      }
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

    // Find children (for forward connections and descendant traversal)
    const childRelationships = relationships.filter(
      (r) => r.fromPersonId === personId && r.type === 'parent'
    );

    if (childRelationships.length > 0) {
      const childSpacing = vSpacing;

      // Calculate Y positions for children to center them below the parent
      const totalHeight = (childRelationships.length - 1) * childSpacing;
      const startY = yOffset + totalHeight / 2;

      childRelationships.forEach((childRel, index) => {
        const childId = childRel.toPersonId;
        const childY = startY + index * childSpacing;

        // Add edge from parent to child (visualizing descendants)
        edges.push({
          id: `${personId}-${childId}`,
          source: personId,
          target: childId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
        });

        // Recursively process child (descendants go to negative generations)
        if (!visited.has(childId)) {
          traverse(childId, generation - 1, childY);
        }
      });
    }

    return yOffset;
  }

  // Start traversal from root person
  traverse(rootPersonId, 0, 300);

  // Add all unvisited persons (those not connected via parent relationships)
  persons.forEach((person) => {
    if (!visited.has(person._id)) {
      visited.add(person._id);

      // Add unconnected node at generation 0 with offset
      const unconnectedCount = nodes.filter(n =>
        (n.data as { generation: number }).generation === 0 &&
        !positionMap.has(n.id)
      ).length;

      const x = 0;
      const y = 300 + (unconnectedCount + 1) * vSpacing;

      positionMap.set(person._id, { x, y });

      nodes.push({
        id: person._id,
        type: 'person',
        position: { x, y },
        data: {
          person,
          generation: 0,
          isRoot: person._id === rootPersonId,
        },
      });
    }
  });

  // Add spouse edges after all nodes are positioned
  spousePairs.forEach((spouseId, personId) => {
    // Both nodes should exist in the nodes array (either from traversal or unconnected)
    const personNode = nodes.find(n => n.id === personId);
    const spouseNode = nodes.find(n => n.id === spouseId);

    if (personNode && spouseNode) {
      // Check if edge already exists
      const edgeExists = edges.some(
        e =>
          (e.source === personId && e.target === spouseId) ||
          (e.source === spouseId && e.target === personId)
      );

      if (!edgeExists) {
        edges.push({
          id: `${personId}-${spouseId}-spouse`,
          source: personId,
          target: spouseId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#f472b6',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          data: {
            relationshipType: 'spouse',
          },
        });
      }
    }
  });

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
