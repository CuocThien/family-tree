# Tree Connection Improvements - Technical Specification

## Overview

This specification outlines improvements to the family tree visualization and relationship management system. The changes focus on:

1. Simplifying connection line rendering with a generational layout
2. Implementing bidirectional spouse relationships
3. Splitting parent relationships into Father/Mother with proper child connection logic
4. Creating a unified family unit connection system

---

## Requirements Analysis

### 1. Visual Layout - Generational Rows

**Current State:**
- Nodes are positioned using a pedigree layout in `/src/lib/tree-layout/pedigree.ts`
- Spouses are not grouped together in rows
- Children connect directly to individual parent nodes
- Connection lines use `smoothstep` edge type without merging

**Required Changes:**
- Arrange all nodes by generation level in horizontal rows
- Spouses must be positioned in the same row, adjacent to each other
- Children must be positioned in the row below their parents
- The root person's generation is level 0
- Parents are at negative generations (going up)
- Children are at positive generations (going down)

**Layout Algorithm:**
```
Generation -2: Great-grandparents
Generation -1: Grandparents
Generation  0: Root person + Spouse(s)
Generation  1: Children
Generation  2: Grandchildren
```

### 2. Connection Lines - Family Unit Merging

**Current State:**
- Each relationship creates a separate edge
- No merging of child connections
- Spouse connections shown as dashed pink lines

**Required Changes:**
- Children of the same parents connect to a single horizontal line
- That horizontal line merges into one vertical line
- The vertical line connects to the midpoint between spouses
- Spouse connections remain as horizontal dashed lines between spouses

**Visual Representation:**
```
     [Father] ══════════ [Mother]     <- Spouse row
          ║                ║
          ╚══════╤═════════╝
                 ║
        ┌────────┼────────┐
        ║        ║        ║
     [Child1] [Child2] [Child3]      <- Children row
```

### 3. Spouse Bidirectional Relationship

**Current State:**
- Spouse relationships are stored as single direction: `fromPersonId` -> `toPersonId` with type `spouse`
- When viewing Person A, their spouse Person B is shown
- When viewing Person B, the relationship back to Person A requires a separate query

**Required Changes:**
- When adding a spouse relationship A -> B, automatically create B -> A
- Both relationships should have type `spouse`
- This ensures the relationship is visible from both persons' perspectives
- When deleting a spouse relationship, both directions should be removed

**Implementation:**
- Modify `RelationshipService.createRelationship()` to detect spouse type
- Create reverse relationship in a transaction
- Modify `RelationshipService.deleteRelationship()` to remove both directions

### 4. Parent-Child Relationship with Father/Mother Split

**Current State:**
- Parents are stored with generic type `parent`
- No distinction between Father and Mother
- Children can have up to 2 parents but gender is not considered

**Required Changes:**

#### 4.1 New Relationship Types
Add to `RelationshipType`:
```typescript
type RelationshipType =
  | 'father'      // NEW: Male parent
  | 'mother'      // NEW: Female parent
  | 'parent'      // DEPRECATED: Keep for backward compatibility
  | 'child'
  | 'spouse'
  | 'sibling'
  | ...existing types
```

#### 4.2 Relationship Logic
When adding a parent to person A:
1. Determine parent's gender from the Person record
2. Create relationship with type `father` or `mother` based on gender
3. If person A has a spouse (person B), both A and B should have relationships to the new parent if the parent is the parent of both's children

#### 4.3 Family Unit Detection
A "family unit" consists of:
- Two spouse persons (A and B)
- Their shared children

When rendering connections:
- Identify family units by finding spouse pairs
- Find all children where both parents are in the spouse pair
- Render merged connection from children to the spouse pair midpoint

---

## Technical Design

### Data Model Changes

#### File: `/src/types/relationship.ts`

```typescript
export type RelationshipType =
  | 'father'      // NEW
  | 'mother'      // NEW
  | 'parent'      // Keep for backward compatibility
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'step-parent'
  | 'step-child'
  | 'adoptive-parent'
  | 'adoptive-child'
  | 'partner';

// NEW: Family Unit type for layout calculations
export interface FamilyUnit {
  id: string;
  spouse1: IPerson;
  spouse2: IPerson | null;  // null for single parent
  children: IPerson[];
  generationLevel: number;
}

// NEW: Node position with generation info
export interface LayoutNode {
  id: string;
  person: IPerson;
  generation: number;
  x: number;
  y: number;
  familyUnitId?: string;
}
```

#### File: `/src/types/dtos/relationship.ts`

Update schema to include new types:
```typescript
const relationshipTypeEnum = z.enum([
  'father',      // NEW
  'mother',      // NEW
  'parent',
  'child',
  'spouse',
  'sibling',
  'step-parent',
  'step-child',
  'adoptive-parent',
  'adoptive-child',
  'partner',
] as const);
```

### Service Layer Changes

#### File: `/src/services/relationship/IRelationshipService.ts`

Add new methods:
```typescript
export interface IRelationshipService {
  // ... existing methods

  // NEW: Create bidirectional spouse relationship
  createSpouseRelationship(
    treeId: string,
    userId: string,
    personAId: string,
    personBId: string,
    data?: { startDate?: Date; endDate?: Date; notes?: string }
  ): Promise<{ relationshipA: IRelationship; relationshipB: IRelationship }>;

  // NEW: Create parent relationship with correct type based on gender
  createParentRelationship(
    treeId: string,
    userId: string,
    parentId: string,
    childId: string
  ): Promise<IRelationship>;

  // NEW: Get family units for a tree
  getFamilyUnits(treeId: string, userId: string): Promise<FamilyUnit[]>;

  // NEW: Delete bidirectional relationship
  deleteBidirectionalRelationship(
    relationshipId: string,
    userId: string
  ): Promise<void>;
}
```

#### File: `/src/services/relationship/RelationshipService.ts`

Key changes:

1. **createRelationship() modification:**
```typescript
async createRelationship(treeId: string, userId: string, data: CreateRelationshipDto): Promise<IRelationship> {
  // ... existing validation

  // For spouse type, create bidirectional
  if (data.type === 'spouse') {
    return this.createSpouseRelationship(treeId, userId, data.fromPersonId, data.toPersonId, data);
  }

  // For parent type, determine father/mother based on gender
  if (data.type === 'parent') {
    return this.createParentRelationship(treeId, userId, data.fromPersonId, data.toPersonId);
  }

  // ... rest of existing logic
}
```

2. **createSpouseRelationship() implementation:**
```typescript
async createSpouseRelationship(
  treeId: string,
  userId: string,
  personAId: string,
  personBId: string,
  data?: { startDate?: Date; endDate?: Date; notes?: string }
): Promise<{ relationshipA: IRelationship; relationshipB: IRelationship }> {
  // 1. Permission check
  // 2. Validate persons exist
  // 3. Check for existing relationship
  // 4. Create both directions in transaction
  // 5. Audit log
  // 6. Return both relationships
}
```

3. **createParentRelationship() implementation:**
```typescript
async createParentRelationship(
  treeId: string,
  userId: string,
  parentId: string,
  childId: string
): Promise<IRelationship> {
  // 1. Get parent's gender
  const parent = await this.personRepository.findById(parentId);

  // 2. Determine relationship type
  const type = parent.gender === 'male' ? 'father' :
               parent.gender === 'female' ? 'mother' : 'parent';

  // 3. Check existing parents count
  // 4. Create relationship with proper type
  // 5. Audit log
}
```

4. **getFamilyUnits() implementation:**
```typescript
async getFamilyUnits(treeId: string, userId: string): Promise<FamilyUnit[]> {
  // 1. Get all persons in tree
  // 2. Get all spouse relationships
  // 3. Get all parent relationships
  // 4. Group children by parent pairs
  // 5. Return family units
}
```

### Layout Algorithm Changes

#### File: `/src/lib/tree-layout/pedigree.ts`

Complete rewrite of the layout algorithm:

```typescript
export function calculatePedigreeLayout(
  rootPersonId: string,
  persons: IPerson[],
  relationships: IRelationship[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {

  // Step 1: Build generation map
  const generationMap = buildGenerationMap(rootPersonId, persons, relationships);

  // Step 2: Identify family units (spouse pairs + children)
  const familyUnits = identifyFamilyUnits(persons, relationships);

  // Step 3: Position nodes by generation
  const nodes = positionNodesByGeneration(generationMap, familyUnits, options);

  // Step 4: Create edges
  const edges = createEdges(nodes, familyUnits, relationships);

  return { nodes, edges };
}

function buildGenerationMap(
  rootPersonId: string,
  persons: IPerson[],
  relationships: IRelationship[]
): Map<string, number> {
  // BFS from root to assign generation levels
  // Parents = current - 1
  // Children = current + 1
  // Spouses = same generation
}

function identifyFamilyUnits(
  persons: IPerson[],
  relationships: IRelationship[]
): FamilyUnit[] {
  // Find all spouse pairs
  // For each pair, find their shared children
  // Also handle single-parent families
}

function positionNodesByGeneration(
  generationMap: Map<string, number>,
  familyUnits: FamilyUnit[],
  options: LayoutOptions
): Node[] {
  // Group nodes by generation
  // Position family units together
  // Center children below parents
}

function createEdges(
  nodes: Node[],
  familyUnits: FamilyUnit[],
  relationships: IRelationship[]
): Edge[] {
  const edges: Edge[] = [];

  for (const unit of familyUnits) {
    // 1. Create spouse edge (horizontal)
    if (unit.spouse2) {
      edges.push(createSpouseEdge(unit.spouse1, unit.spouse2));
    }

    // 2. Create merged children edges
    if (unit.children.length > 0) {
      edges.push(...createMergedChildrenEdges(unit));
    }
  }

  return edges;
}

function createMergedChildrenEdges(unit: FamilyUnit): Edge[] {
  const edges: Edge[] = [];

  // Calculate midpoint between spouses (or single parent position)
  const parentMidpoint = unit.spouse2
    ? getMidpoint(unit.spouse1, unit.spouse2)
    : getPosition(unit.spouse1);

  // Create a "junction node" at the midpoint below parents
  const junctionY = parentMidpoint.y + VERTICAL_SPACING / 2;
  const junctionId = `junction-${unit.id}`;

  // Edge from parent(s) to junction
  edges.push({
    id: `${unit.id}-to-junction`,
    source: unit.spouse1._id,
    target: junctionId,
    type: 'smoothstep',
    style: { stroke: '#cbd5e1', strokeWidth: 2 },
  });

  // If two parents, add second edge to junction
  if (unit.spouse2) {
    edges.push({
      id: `${unit.id}-spouse2-to-junction`,
      source: unit.spouse2._id,
      target: junctionId,
      type: 'smoothstep',
      style: { stroke: '#cbd5e1', strokeWidth: 2 },
    });
  }

  // Edges from junction to each child (horizontal line first, then vertical)
  const childrenY = junctionY + VERTICAL_SPACING / 2;

  // Create horizontal distribution line
  edges.push({
    id: `${unit.id}-distribution`,
    source: junctionId,
    target: `distribution-${unit.id}`,
    type: 'smoothstep',
    style: { stroke: '#cbd5e1', strokeWidth: 2 },
  });

  // Individual child edges from distribution line
  for (const child of unit.children) {
    edges.push({
      id: `${unit.id}-to-${child._id}`,
      source: `distribution-${unit.id}`,
      target: child._id,
      type: 'smoothstep',
      style: { stroke: '#cbd5e1', strokeWidth: 2 },
    });
  }

  return edges;
}
```

### Custom Edge Component

#### New File: `/src/components/tree/FamilyEdge.tsx`

Create custom edge component for merged family connections:

```typescript
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';

export function FamilyEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      path={edgePath}
      style={{
        ...style,
        strokeWidth: 2,
        stroke: '#cbd5e1',
      }}
    />
  );
}

export function SpouseEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps) {
  // Horizontal straight line with heart or link icon in middle
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      <BaseEdge
        path={`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
        style={{
          stroke: '#f472b6',
          strokeWidth: 2,
          strokeDasharray: '5,5',
        }}
      />
      {/* Optional: Add heart icon at midpoint */}
    </>
  );
}
```

### Component Changes

#### File: `/src/components/tree/TreeCanvas.tsx`

Register custom edge types:
```typescript
import { FamilyEdge, SpouseEdge } from './FamilyEdge';

const edgeTypes = {
  family: FamilyEdge,
  spouse: SpouseEdge,
};

// In ReactFlow component:
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  // ...
/>
```

### API Changes

#### File: `/src/app/api/relationships/route.ts`

Update to handle bidirectional spouse creation:
```typescript
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  // ... existing validation

  // For spouse relationships, the service will handle bidirectional creation
  const result = await container.relationshipService.createRelationship(
    validation.data.treeId,
    request.user.id,
    validation.data
  );

  // Return both relationships if spouse type
  if (validation.data.type === 'spouse') {
    return successResponse(result, undefined, 201);
  }

  return successResponse(result, undefined, 201);
});
```

---

## Acceptance Criteria

### Visual Layout
- [ ] Nodes are arranged in horizontal rows by generation level
- [ ] Spouses are positioned adjacent to each other in the same row
- [ ] Children are positioned in the row directly below their parents
- [ ] Single parents are positioned alone with children below

### Connection Lines
- [ ] Children of the same parents connect to a single merged line
- [ ] The merged line connects to the midpoint between spouses
- [ ] Spouse connections are shown as horizontal dashed pink lines
- [ ] Parent-child connections are shown as solid gray lines
- [ ] Connection lines do not overlap or cross unnecessarily

### Spouse Bidirectional Relationship
- [ ] Adding A as spouse of B automatically creates B as spouse of A
- [ ] Both relationships are visible from either person's profile
- [ ] Deleting one spouse relationship removes both directions
- [ ] Spouse relationships are stored with type `spouse` in both directions

### Father/Mother Split
- [ ] Parent relationships use `father` type for male parents
- [ ] Parent relationships use `mother` type for female parents
- [ ] Legacy `parent` type still works for backward compatibility
- [ ] Gender is automatically determined from the Person record

### Edge Cases Handling
- [ ] Multiple spouses (polygamy/serial monogamy) are handled correctly
- [ ] Divorced parents show as previous spouses with ended date
- [ ] Half-siblings connect to appropriate parent(s)
- [ ] Single-parent families show single parent above children
- [ ] Empty tree displays appropriate empty state
- [ ] Large trees (100+ persons) render without performance issues
- [ ] Persons without relationships are positioned appropriately

---

## Edge Cases

### 1. Multiple Spouses
**Scenario:** Person A has spouses B, C, and D (either concurrent or sequential)

**Handling:**
- All spouses appear in the same generation row
- Current spouse (no end date) shows with solid connection
- Previous spouses (with end date) show with faded/different connection
- Children are grouped by which spouse they share

### 2. Divorced Parents
**Scenario:** Parents A and B are divorced, both may have new spouses

**Handling:**
- Spouse relationship has `endDate` set
- Children still connect to both parents
- New spouses of A and B appear in different family units
- Visual indicator (faded line) for ended relationships

### 3. Half-Siblings
**Scenario:** A and B have child C, B and D have child E

**Handling:**
- C appears in family unit (A, B) with children [C]
- E appears in family unit (B, D) with children [E]
- Both C and E connect to B
- No direct connection between C and E unless explicitly defined as siblings

### 4. Single Parents
**Scenario:** Person A has children B, C without a spouse

**Handling:**
- A appears in family unit with spouse2 = null
- Children connect directly to A (no midpoint)
- Single vertical line from A splits to children

### 5. Empty Tree
**Scenario:** New tree with no persons

**Handling:**
- Display empty state with "Add First Person" button
- No edges or nodes to render

### 6. Large Trees (100+ persons)
**Scenario:** Complex family tree with many generations and branches

**Handling:**
- Implement virtualization for nodes
- Lazy load branches as user navigates
- Consider "collapse branch" feature
- Limit initial render depth

### 7. Unknown Gender Parent
**Scenario:** Adding a parent with gender = 'unknown' or 'other'

**Handling:**
- Use generic `parent` type
- Render with neutral color/indicator
- Allow manual override in UI

### 8. Circular Reference Prevention
**Scenario:** User tries to add a parent relationship that would create a cycle

**Handling:**
- `checkForCycles()` method validates before creation
- Return clear error message
- Block the relationship creation

### 9. Adoption and Step-Relationships
**Scenario:** Child has biological parents and adoptive/step-parents

**Handling:**
- Use `adoptive-parent`, `step-parent` types
- Visual distinction (dashed/different color lines)
- All parent types can have children connections

---

## Dependencies

### Internal Dependencies
- ReactFlow library (already installed)
- Existing relationship service and repository
- Existing person service and repository

### External Dependencies
None - all changes use existing libraries

### Migration Requirements
1. Data migration script to update existing `parent` relationships to `father`/`mother` based on gender
2. Backward compatibility for legacy `parent` type
3. Optional: Create reverse spouse relationships for existing data

---

## Implementation Phases

### Phase 1: Bidirectional Spouse Relationships (Estimated: 2 days)
- Update RelationshipService with createSpouseRelationship
- Update deleteRelationship to handle bidirectional deletion
- Add API endpoint support
- Write unit tests

### Phase 2: Father/Mother Relationship Types (Estimated: 1 day)
- Update RelationshipType enum
- Update DTOs and validation schemas
- Implement createParentRelationship
- Write migration script for existing data

### Phase 3: Family Unit Detection (Estimated: 2 days)
- Implement getFamilyUnits method
- Update layout algorithm
- Create custom edge components
- Update TreeCanvas to use new edges

### Phase 4: Merged Connection Lines (Estimated: 3 days)
- Rewrite calculatePedigreeLayout
- Implement generational positioning
- Create junction/distribution nodes
- Test with complex family structures

### Phase 5: Edge Cases and Polish (Estimated: 2 days)
- Handle multiple spouses
- Handle divorced parents
- Handle half-siblings
- Performance optimization for large trees
- UI polish and visual refinements

---

## Testing Strategy

### Unit Tests
- RelationshipService.createSpouseRelationship
- RelationshipService.createParentRelationship
- RelationshipService.getFamilyUnits
- buildGenerationMap function
- identifyFamilyUnits function
- positionNodesByGeneration function
- createMergedChildrenEdges function

### Integration Tests
- Create spouse relationship via API
- Verify both directions created
- Create parent relationship with gender detection
- Delete spouse relationship removes both directions

### E2E Tests
- Add person with spouse relationship
- Verify tree visualization shows merged connections
- Add child to spouse pair
- Verify connection merges correctly
- Edit existing relationship
- Handle edge case scenarios

---

## Questions for Clarification

1. **Multiple Current Spouses:** Should the system allow multiple active (no end date) spouse relationships, or should there be a constraint?

2. **Half-Sibling Visualization:** Should there be a visual indicator connecting half-siblings through their shared parent?

3. **Adoption Priority:** When a child has both biological and adoptive parents, which should be shown as primary in the visualization?

4. **Collapsing Branches:** Should users be able to collapse/expand family branches in large trees?

5. **Gender Change Handling:** If a person's gender is changed after relationships are created, should their parent relationships automatically update from father/mother?

6. **Deceased Spouse:** Should deceased spouses (spouse has dateOfDeath) be visually distinguished from living spouses?

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-23 | PM Agent | Initial specification |
