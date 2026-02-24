import { Node, Edge, Position } from 'reactflow';
import { IPerson } from '@/types/person';
import { IRelationship, PARENT_RELATIONSHIP_TYPES } from '@/types/relationship';
import {
  GenerationRow,
  JunctionNode,
  OrthogonalLayoutOptions,
} from '@/types/tree-layout';

const HORIZONTAL_SPACING = 280;
const VERTICAL_SPACING = 200;
const NODE_WIDTH = 160;
const NODE_HEIGHT = 100;

interface InternalFamilyUnit {
  id: string;
  spouse1: IPerson;
  spouse2: IPerson | null;
  children: IPerson[];
  generationLevel: number;
}

/**
 * Calculate orthogonal pedigree layout with traditional Chinese family tree style
 * Features:
 * - Horizontal rows by generation
 * - Orthogonal (right-angle) connection lines
 * - Junction nodes for merging parent-child connections
 * - Generation row labels
 */
export function calculateOrthogonalPedigreeLayout(
  rootPersonId: string,
  persons: IPerson[],
  relationships: IRelationship[],
  options: OrthogonalLayoutOptions = {}
): {
  nodes: Node[];
  edges: Edge[];
  junctionNodes: JunctionNode[];
  generationRows: GenerationRow[];
} {
  const hSpacing = options.horizontalSpacing ?? HORIZONTAL_SPACING;
  const vSpacing = options.verticalSpacing ?? VERTICAL_SPACING;
  const nodeWidth = options.nodeWidth ?? NODE_WIDTH;
  const nodeHeight = options.nodeHeight ?? NODE_HEIGHT;
  const showLabels = options.showGenerationLabels ?? true;

  const personMap = new Map(persons.map((p) => [p._id, p]));
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const junctionNodes: JunctionNode[] = [];
  const generationRows: GenerationRow[] = [];

  // Step 1: Build generation map using BFS from root
  const generationMap = buildGenerationMap(
    rootPersonId,
    persons,
    relationships,
    personMap
  );

  // Step 2: Calculate generation rows
  const rows = calculateGenerationRows(
    generationMap,
    vSpacing,
    nodeHeight,
    showLabels
  );
  generationRows.push(...rows);

  // Step 3: Identify family units
  const familyUnits = identifyFamilyUnits(
    persons,
    relationships,
    personMap,
    generationMap
  );

  // Step 4: Position nodes with orthogonal routing
  const { positionedNodes, positionedJunctions } = positionNodesOrthogonally(
    generationMap,
    familyUnits,
    generationRows,
    personMap,
    hSpacing,
    nodeWidth
  );

  // Convert positioned nodes to ReactFlow nodes
  for (const [personId, pos] of positionedNodes) {
    const person = personMap.get(personId);
    if (person) {
      nodes.push({
        id: personId,
        type: 'traditionalPerson',
        position: pos,
        data: {
          person,
          generation: generationMap.get(personId) ?? 0,
          isRoot: personId === rootPersonId,
        },
      });
    }
  }

  junctionNodes.push(...positionedJunctions);

  // Step 5: Create orthogonal edges
  const allEdges = createOrthogonalEdges(
    positionedNodes,
    positionedJunctions,
    familyUnits,
    generationMap
  );
  edges.push(...allEdges);

  return { nodes, edges, junctionNodes, generationRows };
}

/**
 * Build generation map with BFS traversal
 */
function buildGenerationMap(
  rootPersonId: string,
  persons: IPerson[],
  relationships: IRelationship[],
  personMap: Map<string, IPerson>
): Map<string, number> {
  const generationMap = new Map<string, number>();
  const queue: Array<{ personId: string; generation: number }> = [
    { personId: rootPersonId, generation: 0 },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { personId, generation } = queue.shift()!;

    if (visited.has(personId)) continue;
    visited.add(personId);

    generationMap.set(personId, generation);

    const personRelationships = relationships.filter(
      (r) => r.fromPersonId === personId || r.toPersonId === personId
    );

    for (const rel of personRelationships) {
      if (rel.type === 'spouse') {
        const spouseId =
          rel.fromPersonId === personId ? rel.toPersonId : rel.fromPersonId;
        if (!visited.has(spouseId)) {
          queue.push({ personId: spouseId, generation });
        }
      } else if (PARENT_RELATIONSHIP_TYPES.includes(rel.type)) {
        if (rel.toPersonId === personId && !visited.has(rel.fromPersonId)) {
          queue.push({ personId: rel.fromPersonId, generation: generation - 1 });
        } else if (
          rel.fromPersonId === personId &&
          !visited.has(rel.toPersonId)
        ) {
          queue.push({ personId: rel.toPersonId, generation: generation + 1 });
        }
      }
    }
  }

  // Handle unvisited persons
  for (const person of persons) {
    if (!generationMap.has(person._id)) {
      generationMap.set(person._id, 0);
    }
  }

  return generationMap;
}

/**
 * Calculate generation row positions
 */
function calculateGenerationRows(
  generationMap: Map<string, number>,
  vSpacing: number,
  nodeHeight: number,
  showLabels: boolean
): GenerationRow[] {
  const generations = new Set<number>(generationMap.values());
  const minGen = Math.min(...generations);
  const maxGen = Math.max(...generations);

  const rows: GenerationRow[] = [];

  for (let level = minGen; level <= maxGen; level++) {
    // Calculate Y position for this generation
    // Offset level to make gen 0 appear in middle
    const adjustedLevel = level - minGen;
    const y = adjustedLevel * vSpacing + 200;

    rows.push({
      level,
      y,
      height: nodeHeight + 40,
      label: getGenerationLabel(level),
      labelVisible: showLabels,
    });
  }

  return rows;
}

/**
 * Get generation label
 */
function getGenerationLabel(level: number): string {
  if (level < 0) {
    return `祖先 ${Math.abs(level)}`; // Ancestor 1, 2, etc.
  } else if (level === 0) {
    return '本人'; // Self/Root
  } else {
    return `后代 ${level}`; // Descendant 1, 2, etc.
  }
}

/**
 * Identify family units
 */
function identifyFamilyUnits(
  persons: IPerson[],
  relationships: IRelationship[],
  personMap: Map<string, IPerson>,
  generationMap: Map<string, number>
): InternalFamilyUnit[] {
  const familyUnits: InternalFamilyUnit[] = [];
  const processedSpouses = new Set<string>();

  const spouseRelationships = relationships.filter((r) => r.type === 'spouse');

  for (const spouseRel of spouseRelationships) {
    const spouse1Id = spouseRel.fromPersonId;
    const spouse2Id = spouseRel.toPersonId;
    const pairKey = [spouse1Id, spouse2Id].sort().join('-');

    if (processedSpouses.has(pairKey)) continue;
    processedSpouses.add(pairKey);

    const spouse1 = personMap.get(spouse1Id);
    const spouse2 = personMap.get(spouse2Id);

    if (!spouse1) continue;

    const children: IPerson[] = [];

    for (const person of persons) {
      const parentRelationships = relationships.filter(
        (r) =>
          r.toPersonId === person._id && PARENT_RELATIONSHIP_TYPES.includes(r.type)
      );

      const parentIds = parentRelationships.map((r) => r.fromPersonId);
      const hasSpouse1AsParent = parentIds.includes(spouse1Id);
      const hasSpouse2AsParent = spouse2
        ? parentIds.includes(spouse2Id)
        : false;

      if (spouse2) {
        if (hasSpouse1AsParent && hasSpouse2AsParent) {
          children.push(person);
        }
      } else {
        if (hasSpouse1AsParent) {
          children.push(person);
        }
      }
    }

    const generationLevel = generationMap.get(spouse1Id) ?? 0;

    familyUnits.push({
      id: pairKey,
      spouse1,
      spouse2: spouse2 || null,
      children,
      generationLevel,
    });
  }

  // Handle single parents
  for (const person of persons) {
    const personSpouseRelationships = spouseRelationships.filter(
      (r) => r.fromPersonId === person._id || r.toPersonId === person._id
    );

    if (personSpouseRelationships.length > 0) continue;

    const childRelationships = relationships.filter(
      (r) =>
        r.fromPersonId === person._id && PARENT_RELATIONSHIP_TYPES.includes(r.type)
    );

    if (childRelationships.length > 0) {
      const children: IPerson[] = [];

      for (const childRel of childRelationships) {
        const child = personMap.get(childRel.toPersonId);
        if (child) {
          children.push(child);
        }
      }

      if (children.length > 0) {
        familyUnits.push({
          id: `single-${person._id}`,
          spouse1: person,
          spouse2: null,
          children,
          generationLevel: generationMap.get(person._id) ?? 0,
        });
      }
    }
  }

  return familyUnits;
}

/**
 * Position nodes with orthogonal routing
 */
function positionNodesOrthogonally(
  generationMap: Map<string, number>,
  familyUnits: InternalFamilyUnit[],
  generationRows: GenerationRow[],
  personMap: Map<string, IPerson>,
  hSpacing: number,
  nodeWidth: number
): {
  positionedNodes: Map<string, { x: number; y: number }>;
  positionedJunctions: JunctionNode[];
} {
  const positionedNodes = new Map<string, { x: number; y: number }>();
  const positionedJunctions: JunctionNode[] = [];
  const positioned = new Set<string>();

  // Group persons by generation
  const generationGroups = new Map<number, string[]>();
  for (const [personId, gen] of generationMap) {
    if (!generationGroups.has(gen)) {
      generationGroups.set(gen, []);
    }
    generationGroups.get(gen)!.push(personId);
  }

  // Position family units within each generation
  for (const [gen, personIds] of generationGroups) {
    const row = generationRows.find((r) => r.level === gen);
    const y = row?.y ?? gen * 200 + 200;
    let currentX = 0;

    const unitsInGen = familyUnits.filter(
      (u) => generationMap.get(u.spouse1._id) === gen
    );

    unitsInGen.sort((a, b) => {
      const nameA = `${a.spouse1.lastName} ${a.spouse1.firstName}`;
      const nameB = `${b.spouse1.lastName} ${b.spouse1.firstName}`;
      return nameA.localeCompare(nameB);
    });

    for (const unit of unitsInGen) {
      // Position spouse1
      if (!positioned.has(unit.spouse1._id)) {
        positionedNodes.set(unit.spouse1._id, { x: currentX, y });
        positioned.add(unit.spouse1._id);
        currentX += nodeWidth + 20;
      }

      // Position spouse2
      const spouse1Pos = positionedNodes.get(unit.spouse1._id);
      if (unit.spouse2 && !positioned.has(unit.spouse2._id) && spouse1Pos) {
        positionedNodes.set(unit.spouse2._id, {
          x: spouse1Pos.x + nodeWidth + 40,
          y,
        });
        positioned.add(unit.spouse2._id);
        currentX += nodeWidth + 60;

        // Create junction node below spouse pair if they have children
        if (unit.children.length > 0) {
          const junctionX = spouse1Pos.x + nodeWidth + 20;
          const junctionY = y + 140;

          const junction: JunctionNode = {
            id: `junction-${unit.id}`,
            type: 'junction',
            position: { x: junctionX, y: junctionY },
            parentIds: [unit.spouse1._id, unit.spouse2._id],
            childIds: unit.children.map((c) => c._id),
          };
          positionedJunctions.push(junction);
        }
      }

      // Position children
      if (unit.children.length > 0) {
        const parentCenterX = unit.spouse2
          ? (positionedNodes.get(unit.spouse1._id)!.x +
              positionedNodes.get(unit.spouse2._id)!.x) /
            2
          : positionedNodes.get(unit.spouse1._id)!.x;

        const childRow = generationRows.find((r) => r.level === gen + 1);
        const childY = childRow?.y ?? (gen + 1) * 200 + 200;

        // For single parent, create junction
        if (!unit.spouse2) {
          const junctionX = parentCenterX + nodeWidth / 2;
          const junctionY = y + 140;

          const junction: JunctionNode = {
            id: `junction-${unit.id}`,
            type: 'junction',
            position: { x: junctionX, y: junctionY },
            parentIds: [unit.spouse1._id, null],
            childIds: unit.children.map((c) => c._id),
          };
          positionedJunctions.push(junction);
        }

        const totalChildrenWidth = unit.children.length * (nodeWidth + 20) - 20;
        let childStartX = parentCenterX - totalChildrenWidth / 2 + nodeWidth / 2;

        unit.children.sort((a, b) => {
          if (a.dateOfBirth && b.dateOfBirth) {
            return (
              new Date(a.dateOfBirth).getTime() -
              new Date(b.dateOfBirth).getTime()
            );
          }
          const nameA = `${a.lastName} ${a.firstName}`;
          const nameB = `${b.lastName} ${b.firstName}`;
          return nameA.localeCompare(nameB);
        });

        for (const child of unit.children) {
          if (!positioned.has(child._id)) {
            positionedNodes.set(child._id, { x: childStartX, y: childY });
            positioned.add(child._id);
            childStartX += nodeWidth + 20;
          }
        }
      }
    }

    // Position remaining persons
    for (const personId of personIds) {
      if (!positioned.has(personId)) {
        positionedNodes.set(personId, { x: currentX, y });
        positioned.add(personId);
        currentX += nodeWidth + 20;
      }
    }
  }

  return { positionedNodes, positionedJunctions };
}

/**
 * Create orthogonal edges
 */
function createOrthogonalEdges(
  positionedNodes: Map<string, { x: number; y: number }>,
  junctionNodes: JunctionNode[],
  familyUnits: InternalFamilyUnit[],
  generationMap: Map<string, number>
): Edge[] {
  const edges: Edge[] = [];
  const processedSpouses = new Set<string>();

  for (const unit of familyUnits) {
    // Spouse edge
    if (unit.spouse2) {
      const pairKey = [unit.spouse1._id, unit.spouse2._id].sort().join('-');
      if (!processedSpouses.has(pairKey)) {
        edges.push({
          id: `spouse-${pairKey}`,
          source: unit.spouse1._id,
          target: unit.spouse2._id,
          type: 'spouse',
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
        processedSpouses.add(pairKey);
      }
    }

    // Parent-child edges via junction
    const junction = junctionNodes.find((j) =>
      j.parentIds.includes(unit.spouse1._id)
    );
    if (junction) {
      // Edge from spouse1 to junction
      const spouse1Pos = positionedNodes.get(unit.spouse1._id);
      if (spouse1Pos) {
        edges.push({
          id: `edge-${unit.spouse1._id}-${junction.id}`,
          source: unit.spouse1._id,
          target: junction.id,
          type: 'orthogonal',
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
          data: { isJunctionEdge: true },
        });
      }

      // Edge from spouse2 to junction (if exists)
      if (unit.spouse2) {
        edges.push({
          id: `edge-${unit.spouse2._id}-${junction.id}`,
          source: unit.spouse2._id,
          target: junction.id,
          type: 'orthogonal',
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
          data: { isJunctionEdge: true },
        });
      }

      // Edges from junction to children
      for (const child of unit.children) {
        edges.push({
          id: `edge-${junction.id}-${child._id}`,
          source: junction.id,
          target: child._id,
          type: 'orthogonal',
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
          data: { isJunctionEdge: true },
        });
      }
    }
  }

  return edges;
}

/**
 * Get orthogonal path between two points
 */
export function getOrthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  const midY = (sourceY + targetY) / 2;
  return `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
}

// Export constants
export {
  HORIZONTAL_SPACING,
  VERTICAL_SPACING,
  NODE_WIDTH,
  NODE_HEIGHT,
};
