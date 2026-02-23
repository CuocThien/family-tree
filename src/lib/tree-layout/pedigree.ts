import { Node, Edge } from 'reactflow';
import { IPerson } from '@/types/person';
import { IRelationship, FamilyUnit, PARENT_RELATIONSHIP_TYPES } from '@/types/relationship';

const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 180;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

interface LayoutOptions {
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

interface InternalFamilyUnit {
  id: string;
  spouse1: IPerson;
  spouse2: IPerson | null;
  children: IPerson[];
  generationLevel: number;
}

/**
 * Calculate pedigree layout with generational rows and merged children connections
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

  // Step 1: Build generation map using BFS from root
  const generationMap = buildGenerationMap(rootPersonId, persons, relationships, personMap);

  // Step 2: Identify family units (spouse pairs + children)
  const familyUnits = identifyFamilyUnits(persons, relationships, personMap, generationMap);

  // Step 3: Position nodes by generation in rows
  const positionMap = positionNodesByGeneration(
    generationMap,
    familyUnits,
    personMap,
    hSpacing,
    vSpacing
  );

  // Step 4: Create nodes
  for (const [personId, position] of positionMap) {
    const person = personMap.get(personId);
    if (person) {
      nodes.push({
        id: personId,
        type: 'person',
        position,
        data: {
          person,
          generation: generationMap.get(personId) ?? 0,
          isRoot: personId === rootPersonId,
        },
      });
    }
  }

  // Step 5: Create edges with merged children connections
  const allEdges = createEdges(nodes, familyUnits, positionMap, personMap, relationships);

  return { nodes, edges: allEdges };
}

/**
 * Build a map of person IDs to their generation level
 * Root person is generation 0, parents are negative, children are positive
 */
function buildGenerationMap(
  rootPersonId: string,
  persons: IPerson[],
  relationships: IRelationship[],
  personMap: Map<string, IPerson>
): Map<string, number> {
  const generationMap = new Map<string, number>();
  const queue: Array<{ personId: string; generation: number }> = [{ personId: rootPersonId, generation: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { personId, generation } = queue.shift()!;

    if (visited.has(personId)) continue;
    visited.add(personId);

    generationMap.set(personId, generation);

    // Get all relationships for this person
    const personRelationships = relationships.filter(
      (r) => r.fromPersonId === personId || r.toPersonId === personId
    );

    for (const rel of personRelationships) {
      // Spouse - same generation
      if (rel.type === 'spouse') {
        const spouseId = rel.fromPersonId === personId ? rel.toPersonId : rel.fromPersonId;
        if (!visited.has(spouseId)) {
          queue.push({ personId: spouseId, generation });
        }
      }
      // Parent relationships - person is child
      else if (PARENT_RELATIONSHIP_TYPES.includes(rel.type)) {
        if (rel.toPersonId === personId && !visited.has(rel.fromPersonId)) {
          // Parent is one generation up (negative)
          queue.push({ personId: rel.fromPersonId, generation: generation - 1 });
        }
        else if (rel.fromPersonId === personId && !visited.has(rel.toPersonId)) {
          // Child is one generation down (positive)
          queue.push({ personId: rel.toPersonId, generation: generation + 1 });
        }
      }
    }
  }

  // Handle any unvisited persons (isolated nodes)
  for (const person of persons) {
    if (!generationMap.has(person._id)) {
      generationMap.set(person._id, 0);
    }
  }

  return generationMap;
}

/**
 * Identify family units - spouse pairs and their shared children
 */
function identifyFamilyUnits(
  persons: IPerson[],
  relationships: IRelationship[],
  personMap: Map<string, IPerson>,
  generationMap: Map<string, number>
): InternalFamilyUnit[] {
  const familyUnits: InternalFamilyUnit[] = [];
  const processedSpouses = new Set<string>();

  // Find all spouse relationships
  const spouseRelationships = relationships.filter((r) => r.type === 'spouse');

  // Build family units from spouse pairs
  for (const spouseRel of spouseRelationships) {
    const spouse1Id = spouseRel.fromPersonId;
    const spouse2Id = spouseRel.toPersonId;

    // Create unique key for this spouse pair
    const pairKey = [spouse1Id, spouse2Id].sort().join('-');

    if (processedSpouses.has(pairKey)) continue;
    processedSpouses.add(pairKey);

    const spouse1 = personMap.get(spouse1Id);
    const spouse2 = personMap.get(spouse2Id);

    if (!spouse1) continue;

    // Find children who have both spouses as parents
    const children: IPerson[] = [];

    for (const person of persons) {
      const parentRelationships = relationships.filter(
        (r) => r.toPersonId === person._id && PARENT_RELATIONSHIP_TYPES.includes(r.type)
      );

      const parentIds = parentRelationships.map((r) => r.fromPersonId);
      const hasSpouse1AsParent = parentIds.includes(spouse1Id);
      const hasSpouse2AsParent = spouse2 ? parentIds.includes(spouse2Id) : false;

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

  // Handle single parents (persons with children but no spouse)
  for (const person of persons) {
    const personSpouseRelationships = spouseRelationships.filter(
      (r) => r.fromPersonId === person._id || r.toPersonId === person._id
    );

    if (personSpouseRelationships.length > 0) continue;

    // Find children
    const childRelationships = relationships.filter(
      (r) => r.fromPersonId === person._id && PARENT_RELATIONSHIP_TYPES.includes(r.type)
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
 * Position nodes in horizontal rows by generation
 * Spouses are positioned adjacent to each other
 */
function positionNodesByGeneration(
  generationMap: Map<string, number>,
  familyUnits: InternalFamilyUnit[],
  personMap: Map<string, IPerson>,
  hSpacing: number,
  vSpacing: number
): Map<string, { x: number; y: number }> {
  const positionMap = new Map<string, { x: number; y: number }>();
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
    const y = gen * vSpacing + 300; // Offset to keep tree centered vertically
    let currentX = 0;

    // Find family units for this generation
    const unitsInGen = familyUnits.filter(
      (u) => generationMap.get(u.spouse1._id) === gen
    );

    // Sort units by first spouse's name for consistency
    unitsInGen.sort((a, b) => {
      const nameA = `${a.spouse1.lastName} ${a.spouse1.firstName}`;
      const nameB = `${b.spouse1.lastName} ${b.spouse1.firstName}`;
      return nameA.localeCompare(nameB);
    });

    for (const unit of unitsInGen) {
      // Position spouse1
      if (!positioned.has(unit.spouse1._id)) {
        positionMap.set(unit.spouse1._id, { x: currentX, y });
        positioned.add(unit.spouse1._id);
        currentX += NODE_WIDTH + 20;
      }

      // Position spouse2 next to spouse1
      if (unit.spouse2 && !positioned.has(unit.spouse2._id)) {
        const spouse1Pos = positionMap.get(unit.spouse1._id);
        if (spouse1Pos) {
          positionMap.set(unit.spouse2._id, { x: spouse1Pos.x + NODE_WIDTH + 40, y });
          positioned.add(unit.spouse2._id);
          currentX += NODE_WIDTH + 60;
        }
      }

      // Position children below parents (in next generation)
      if (unit.children.length > 0) {
        const parentCenterX = unit.spouse2
          ? (positionMap.get(unit.spouse1._id)!.x + positionMap.get(unit.spouse2._id)!.x) / 2
          : positionMap.get(unit.spouse1._id)!.x;

        const childY = (gen + 1) * vSpacing + 300;
        const totalChildrenWidth = unit.children.length * (NODE_WIDTH + 40) - 40;
        let childStartX = parentCenterX - totalChildrenWidth / 2;

        // Sort children by birth date if available, otherwise by name
        unit.children.sort((a, b) => {
          if (a.dateOfBirth && b.dateOfBirth) {
            return new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime();
          }
          const nameA = `${a.lastName} ${a.firstName}`;
          const nameB = `${b.lastName} ${b.firstName}`;
          return nameA.localeCompare(nameB);
        });

        for (const child of unit.children) {
          if (!positioned.has(child._id)) {
            positionMap.set(child._id, { x: childStartX, y: childY });
            positioned.add(child._id);
            childStartX += NODE_WIDTH + 40;
          }
        }
      }
    }

    // Position any remaining persons in this generation who aren't in family units
    for (const personId of personIds) {
      if (!positioned.has(personId)) {
        positionMap.set(personId, { x: currentX, y });
        positioned.add(personId);
        currentX += NODE_WIDTH + 40;
      }
    }
  }

  // Handle half-siblings - ensure they're positioned correctly
  positionHalfSiblings(familyUnits, positionMap, personMap, vSpacing);

  return positionMap;
}

/**
 * Adjust positions for half-siblings to show connection through shared parent
 * This function ensures half-siblings are positioned in a way that visually
 * indicates their shared parent connection.
 *
 * Note: The actual visual connection is created via createHalfSiblingEdges().
 * This function is reserved for any future position adjustments needed for
 * half-sibling visualization.
 */
function positionHalfSiblings(
  familyUnits: InternalFamilyUnit[],
  positionMap: Map<string, { x: number; y: number }>,
  personMap: Map<string, IPerson>,
  vSpacing: number
): void {
  // Half-sibling positions are already handled by the main positioning logic
  // in positionNodesByGeneration(). The visual connection is created by
  // createHalfSiblingEdges() which draws a dashed line between half-siblings.
  //
  // This function is intentionally minimal. If in the future we need to
  // adjust half-sibling positions (e.g., group them closer together or
  // add visual spacing), that logic would go here.
  //
  // Current behavior: Half-siblings are positioned based on their respective
  // family units, and the createHalfSiblingEdges() function creates a visual
  // indicator connecting them through the shared parent.
}

/**
 * Create edges with proper parent-child connections
 * Uses 'family' edge type which renders with FamilyEdge component
 */
function createEdges(
  nodes: Node[],
  familyUnits: InternalFamilyUnit[],
  positionMap: Map<string, { x: number; y: number }>,
  personMap: Map<string, IPerson>,
  relationships: IRelationship[]
): Edge[] {
  const edges: Edge[] = [];
  const processedSpouses = new Set<string>();
  const processedParentChild = new Set<string>();

  for (const unit of familyUnits) {
    // 1. Create spouse edge (horizontal dashed line)
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

    // 2. Create parent-to-child edges using 'family' edge type
    if (unit.children.length > 0) {
      for (const child of unit.children) {
        const childPos = positionMap.get(child._id);
        if (!childPos) continue;

        // Create edge from parent1 to child
        const parent1ChildKey = `${unit.spouse1._id}-${child._id}`;
        if (!processedParentChild.has(parent1ChildKey)) {
          edges.push({
            id: `family-${parent1ChildKey}`,
            source: unit.spouse1._id,
            target: child._id,
            type: 'family',
            animated: false,
            style: { stroke: '#cbd5e1', strokeWidth: 2 },
            data: {
              isParentToChild: true,
            },
          });
          processedParentChild.add(parent1ChildKey);
        }

        // Create edge from parent2 to child (if exists)
        if (unit.spouse2) {
          const parent2ChildKey = `${unit.spouse2._id}-${child._id}`;
          if (!processedParentChild.has(parent2ChildKey)) {
            edges.push({
              id: `family-${parent2ChildKey}`,
              source: unit.spouse2._id,
              target: child._id,
              type: 'family',
              animated: false,
              style: { stroke: '#cbd5e1', strokeWidth: 2 },
              data: {
                isParentToChild: true,
              },
            });
            processedParentChild.add(parent2ChildKey);
          }
        }
      }
    }
  }

  // Handle half-sibling connections - add visual indicator
  const halfSiblingEdges = createHalfSiblingEdges(familyUnits, positionMap, personMap);
  edges.push(...halfSiblingEdges);

  return edges;
}

/**
 * Create edges to visually connect half-siblings through shared parent
 */
function createHalfSiblingEdges(
  familyUnits: InternalFamilyUnit[],
  positionMap: Map<string, { x: number; y: number }>,
  personMap: Map<string, IPerson>
): Edge[] {
  const edges: Edge[] = [];

  // Find shared parents across family units
  const parentToUnits = new Map<string, InternalFamilyUnit[]>();

  for (const unit of familyUnits) {
    // Check spouse1
    if (!parentToUnits.has(unit.spouse1._id)) {
      parentToUnits.set(unit.spouse1._id, []);
    }
    parentToUnits.get(unit.spouse1._id)!.push(unit);

    // Check spouse2
    if (unit.spouse2) {
      if (!parentToUnits.has(unit.spouse2._id)) {
        parentToUnits.set(unit.spouse2._id, []);
      }
      parentToUnits.get(unit.spouse2._id)!.push(unit);
    }
  }

  // For parents with multiple family units, their children are half-siblings
  for (const [parentId, units] of parentToUnits) {
    if (units.length > 1) {
      const parentPos = positionMap.get(parentId);
      if (!parentPos) continue;

      // Get all children from all units for this parent
      const allChildren: IPerson[] = [];
      for (const unit of units) {
        for (const child of unit.children) {
          if (!allChildren.find(c => c._id === child._id)) {
            allChildren.push(child);
          }
        }
      }

      // If there are multiple children from different units, they're half-siblings
      if (allChildren.length > 1) {
        // Sort children by x position for consistent edge routing
        const childrenWithPos = allChildren
          .map(child => ({ child, pos: positionMap.get(child._id) }))
          .filter(item => item.pos)
          .sort((a, b) => a.pos!.x - b.pos!.x);

        // Create a subtle indicator edge connecting half-siblings
        // This creates a horizontal line at a level just above the children
        if (childrenWithPos.length >= 2) {
          const firstChild = childrenWithPos[0];
          const lastChild = childrenWithPos[childrenWithPos.length - 1];

          edges.push({
            id: `half-siblings-${parentId}`,
            source: firstChild.child._id,
            target: lastChild.child._id,
            type: 'half-sibling',
            animated: false,
            style: {
              stroke: '#94a3b8',
              strokeWidth: 1,
              strokeDasharray: '3,3',
            },
            data: {
              isHalfSiblingConnection: true,
              sharedParentId: parentId,
            },
          });
        }
      }
    }
  }

  return edges;
}

// Export for use in other modules
export { HORIZONTAL_SPACING, VERTICAL_SPACING, NODE_WIDTH, NODE_HEIGHT };
