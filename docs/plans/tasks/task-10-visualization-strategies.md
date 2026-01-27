# Task 10: Create Visualization Strategies

**Phase:** 5 - Strategy Pattern (Visualization)
**Priority:** High
**Dependencies:** Task 08 (Service Interfaces)
**Estimated Complexity:** High

---

## Objective

Implement visualization strategies for rendering family trees in different formats (Vertical, Horizontal, Fan Chart, Timeline). Use Strategy Pattern for runtime algorithm switching.

---

## Requirements

### Functional Requirements

1. Define IVisualizationStrategy interface
2. Implement 4 visualization strategies:
   - VerticalTreeStrategy (traditional top-down)
   - HorizontalTreeStrategy (left-to-right, pedigree view)
   - FanChartStrategy (circular ancestry chart)
   - TimelineStrategy (chronological view)
3. Each strategy returns positioned nodes and edges
4. Support for zoom levels and viewport calculations

### Non-Functional Requirements

1. Strategies must be stateless
2. Calculations optimized for large trees (1000+ nodes)
3. Support responsive breakpoints
4. Return data compatible with React Flow

---

## Interface Definition

**File:** `src/strategies/visualization/IVisualizationStrategy.ts`

```typescript
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
```

---

## Strategy Implementations

### 1. VerticalTreeStrategy

**File:** `src/strategies/visualization/VerticalTreeStrategy.ts`

```typescript
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
}
```

### 2. HorizontalTreeStrategy (Pedigree View)

**File:** `src/strategies/visualization/HorizontalTreeStrategy.ts`

```typescript
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
        parents.father, generation + 1, nextX, fatherY, nextYSpacing,
        persons, parentMap, nodes, edges, maxGen, hSpacing
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
        parents.mother, generation + 1, nextX, motherY, nextYSpacing,
        persons, parentMap, nodes, edges, maxGen, hSpacing
      );
    }
  }
}
```

### 3. FanChartStrategy

**File:** `src/strategies/visualization/FanChartStrategy.ts`

```typescript
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
      const fatherPos = this.polarToCartesian(center.centerX, center.centerY, radius, fatherAngle);

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
          parents.father, generation + 1, startAngle, midAngle,
          radiusIncrement, persons, parentMap, nodes, edges, maxGen, center
        );
      }
    }

    // Mother takes second half of arc
    if (parents.mother) {
      const motherAngle = (midAngle + endAngle) / 2;
      const motherPos = this.polarToCartesian(center.centerX, center.centerY, radius, motherAngle);

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
          parents.mother, generation + 1, midAngle, endAngle,
          radiusIncrement, persons, parentMap, nodes, edges, maxGen, center
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
}
```

### 4. TimelineStrategy

**File:** `src/strategies/visualization/TimelineStrategy.ts`

```typescript
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

    // Sort persons by birth year
    const sortedPersons = Array.from(persons.values())
      .filter(p => p.birthDate)
      .sort((a, b) => {
        const dateA = new Date(a.birthDate!).getTime();
        const dateB = new Date(b.birthDate!).getTime();
        return dateA - dateB;
      });

    if (sortedPersons.length === 0) {
      return { nodes, edges, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }, centerPoint: { x: 0, y: 0 } };
    }

    const minYear = new Date(sortedPersons[0].birthDate!).getFullYear();
    const maxYear = Math.max(
      ...sortedPersons.map(p => {
        if (p.deathDate) return new Date(p.deathDate).getFullYear();
        if (p.isLiving) return new Date().getFullYear();
        return new Date(p.birthDate!).getFullYear() + 80; // Estimate
      })
    );

    // Assign rows to avoid overlap
    const rowAssignments = this.assignRows(sortedPersons);

    sortedPersons.forEach((person, index) => {
      const birthYear = new Date(person.birthDate!).getFullYear();
      const x = (birthYear - minYear) * this.YEAR_WIDTH;
      const y = rowAssignments.get(person._id) || index * this.ROW_HEIGHT;

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
      const birthYear = new Date(person.birthDate!).getFullYear();
      const endYear = person.deathDate
        ? new Date(person.deathDate).getFullYear()
        : new Date().getFullYear();

      // Find first row where this person fits
      let assignedRow = rowEndYears.findIndex(endYear => endYear < birthYear - 5);

      if (assignedRow === -1) {
        assignedRow = rowEndYears.length;
        rowEndYears.push(endYear);
      } else {
        rowEndYears[assignedRow] = endYear;
      }

      rowAssignments.set(person._id, assignedRow * this.ROW_HEIGHT);
    }

    return rowAssignments;
  }
}
```

---

## Strategy Registry

**File:** `src/strategies/visualization/VisualizationStrategyRegistry.ts`

```typescript
import { IVisualizationStrategy } from './IVisualizationStrategy';
import { VerticalTreeStrategy } from './VerticalTreeStrategy';
import { HorizontalTreeStrategy } from './HorizontalTreeStrategy';
import { FanChartStrategy } from './FanChartStrategy';
import { TimelineStrategy } from './TimelineStrategy';

export class VisualizationStrategyRegistry {
  private strategies: Map<string, IVisualizationStrategy> = new Map();

  constructor() {
    this.register(new VerticalTreeStrategy());
    this.register(new HorizontalTreeStrategy());
    this.register(new FanChartStrategy());
    this.register(new TimelineStrategy());
  }

  register(strategy: IVisualizationStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  get(name: string): IVisualizationStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Visualization strategy '${name}' not found`);
    }
    return strategy;
  }

  getAll(): IVisualizationStrategy[] {
    return Array.from(this.strategies.values());
  }
}
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Empty tree | Return empty result with zero bounds |
| Single person | Place at origin, no edges |
| Missing root person | Throw descriptive error |
| Circular relationships | Use visited set to prevent infinite loops |
| Very deep trees | Respect maxGenerations limit |
| Overlapping nodes | Adjust spacing dynamically |
| Missing birth dates | Exclude from timeline, include in others |
| Large trees (1000+ nodes) | Use virtualization hints in result |

---

## Performance Optimization

| Technique | Implementation |
|-----------|----------------|
| Memoization | Cache subtree width calculations |
| Early termination | Stop at maxGenerations |
| Lazy calculation | Only calculate visible viewport |
| Web Workers | Offload heavy calculations |
| Incremental updates | Recalculate only changed subtrees |

---

## Acceptance Criteria

- [ ] IVisualizationStrategy interface defined
- [ ] VerticalTreeStrategy implemented
- [ ] HorizontalTreeStrategy implemented
- [ ] FanChartStrategy implemented
- [ ] TimelineStrategy implemented
- [ ] VisualizationStrategyRegistry created
- [ ] Unit tests for each strategy
- [ ] Edge cases handled
- [ ] TypeScript compilation succeeds
- [ ] Results compatible with React Flow
