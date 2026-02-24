# Tree Board UI/UX Improvements Specification

**Document Version:** 1.0
**Date:** 2026-02-24
**Author:** PM/Architect Agent
**Status:** Draft
**Priority:** High
**Reference Image:** `/Users/nguyenhuukhai/Project/family-tree/design/example.png`

---

## Executive Summary

This specification outlines UI/UX improvements for the Family Tree application's tree board detail page based on a traditional Chinese family tree (Jiapu/族谱) design. The example image demonstrates a classic hierarchical layout with clear generation levels, orthogonal connection lines, and traditional Chinese aesthetic elements.

**Key Improvements:**
1. Hierarchical layout with clear generational rows
2. Orthogonal (right-angle) connection lines
3. Enhanced spouse connection visualization
4. Improved node design with traditional styling
5. Better visual hierarchy and readability

---

## 1. Visual Analysis of Example Image

### 1.1 Layout Structure

The example image shows a traditional Chinese family tree with the following characteristics:

```
Generation Level -2 (Great-Grandparents)
┌─────────────────────────────────────────────┐
│  [Ancestor Name]  [Spouse Name]            │
└─────────────────────────────────────────────┘
                    │
                    ║ (orthogonal lines)
                    ║
Generation Level -1 (Grandparents)
┌─────────────────────────────────────────────┐
│  [Grandfather] ═════════ [Grandmother]     │
└─────────────────────────────────────────────┘
                    │
                    ║
                    ║
Generation Level 0 (Root Person + Spouse)
┌─────────────────────────────────────────────┐
│  [Father] ═════════════════ [Mother]       │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ║           ║           ║
Generation Level 1 (Children)
┌─────────────────────────────────────────────┐
│  [Child 1]  [Child 2]  [Child 3]          │
└─────────────────────────────────────────────┘
```

### 1.2 Key Visual Elements

| Element | Description | Current Implementation | Gap |
|---------|-------------|------------------------|-----|
| **Generation Rows** | Clear horizontal rows for each generation | Partial - uses generational positioning | No visual row indicators |
| **Orthogonal Lines** | Right-angle connections (║ ═) | Uses smoothstep curved lines | Not orthogonal |
| **Spouse Connections** | Horizontal dashed line (═══) | Pink dashed line | Correct, but could be enhanced |
| **Parent-Child Lines** | Vertical lines from parents to children | Smoothstep edges | Not merged at midpoint |
| **Node Design** | Rectangular cards with borders | Circular avatars | Different style |
| **Hierarchical Flow** | Top-down or right-to-left | Top-down with ReactFlow | Correct direction |
| **Generation Indicators** | Clear level separation | Implicit through positioning | No explicit visual markers |

### 1.3 Connection Line Patterns

From the example image, the connection patterns are:

**Spouse Connection:**
```
[Person A] ════════════ [Person B]
           (horizontal dashed line)
```

**Parent-Child Connection:**
```
[Parent 1] ════════════ [Parent 2]
     ║             ║
     ╚══════╤════════╝
            ║
            ║
        [Child]
(orthogonal routing with midpoint merge)
```

**Multi-Child Connection:**
```
[Parent 1] ════════════ [Parent 2]
     ║             ║
     ╚══════╤════════╝
            ║
    ┌───────┼───────┐
    ║       ║       ║
[Child 1] [Child 2] [Child 3]
```

---

## 2. Current State Analysis

### 2.1 Current Implementation Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/tree-layout/pedigree.ts` | Layout calculation algorithm | Good foundation, needs enhancement |
| `src/components/tree/TreeCanvas.tsx` | Main canvas component using ReactFlow | Functional, needs edge styling |
| `src/components/tree/PersonNode.flow.tsx` | Individual person node in tree | Circular avatar, different from example |
| `src/components/tree/FamilyEdge.tsx` | Custom edge components | Has spouse and family edges |
| `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` | Page content container | Good structure |

### 2.2 Current Layout Algorithm

**File:** `src/lib/tree-layout/pedigree.ts`

**Current Features:**
- Generates generation map via BFS from root
- Identifies family units (spouse pairs + children)
- Positions nodes by generation in horizontal rows
- Creates edges with proper connections

**Current Spacing:**
```typescript
const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 180;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
```

**Gap Analysis:**
- No orthogonal line routing (uses smoothstep)
- No explicit generation row visual indicators
- Connection lines not merged at spouse midpoint correctly
- No traditional Chinese aesthetic elements

### 2.3 Current Edge Types

**File:** `src/components/tree/FamilyEdge.tsx`

**Current Edge Types:**
1. `SpouseEdge` - Pink dashed horizontal line (correct)
2. `HalfSiblingEdge` - Gray dashed line for half-siblings
3. `FamilyEdge` - Gray solid line for parent-child

**Gap Analysis:**
- Lines use `getSmoothStepPath` with border radius (curved)
- Should use orthogonal paths with 90-degree angles
- No junction node for merging child connections

### 2.4 Current Node Design

**File:** `src/components/tree/PersonNode.flow.tsx`

**Current Design:**
- Circular avatar with photo
- Name label below in rounded container
- Handles on left/right for ReactFlow connections
- Size variations based on generation

**Gap Analysis:**
- Circular design vs. rectangular in example
- Missing traditional Chinese borders/decorations
- No generation level indicator badge

---

## 3. Detailed UI/UX Requirements

### 3.1 Layout Requirements

#### 3.1.1 Generational Row Structure

**Requirement:** Each generation must be visually distinct with horizontal row layout.

**Implementation:**
```typescript
interface GenerationRow {
  level: number;
  y: number;
  height: number;
  label: string; // e.g., "第1代" (1st Generation), "第二代" (2nd Generation)
  persons: IPerson[];
}
```

**Visual Specification:**
- Background row separator with subtle color
- Generation label on the left side (optional, can be toggled)
- Consistent vertical spacing between rows
- Row height adjusts based on content

#### 3.1.2 Node Positioning Algorithm

**Algorithm Enhancements:**

1. **Center-align children below parents:**
```typescript
// For each family unit:
const parentCenterX = (spouse1.x + spouse2.x) / 2;
const totalChildrenWidth = children.length * (NODE_WIDTH + SPACING);
const childStartX = parentCenterX - totalChildrenWidth / 2;

// Position children centered below parents
children.forEach((child, index) => {
  child.x = childStartX + index * (NODE_WIDTH + SPACING);
});
```

2. **Prevent node overlap:**
```typescript
// After initial positioning, detect and resolve overlaps
const resolveOverlaps = (nodes: Node[]): Node[] => {
  // Group by generation
  // For each generation, check for overlaps
  // Shift nodes horizontally to resolve
};
```

### 3.2 Connection Line Requirements

#### 3.2.1 Orthogonal Line Routing

**Requirement:** All connection lines must use orthogonal (right-angle) paths.

**Visual Specification:**
```
Parent (x1, y1) ───────┐
                      │
                      │ (vertical segment)
                      │
Child  (x2, y2) ───────┘
```

**Implementation:**
```typescript
function getOrthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position
): string {
  const midY = (sourceY + targetY) / 2;

  return `M ${sourceX} ${sourceY}
          L ${sourceX} ${midY}
          L ${targetX} ${midY}
          L ${targetX} ${targetY}`;
}
```

#### 3.2.2 Spouse Connection Lines

**Requirement:** Horizontal dashed line between spouses.

**Visual Specification:**
- Color: Pink (`#f472b6`) or traditional red (`#dc2626`)
- Style: Dashed (`strokeDasharray: '5,5'`)
- Width: 2px
- Optional: Heart or marriage symbol at midpoint

**Current State:** Already implemented in `SpouseEdge`
**Enhancement:** Add traditional Chinese marriage symbol (囍) at midpoint

#### 3.2.3 Parent-Child Connection Lines

**Requirement:** Orthogonal lines from parent midpoint to child, with merged junction for multiple children.

**Visual Specification:**
```
[Father] ════════════ [Mother]
    │             │
    └──────┬──────┘
           │ (junction point)
           │
    ┌──────┼──────┐
    │      │      │
[Child1][Child2][Child3]
```

**Implementation Strategy:**
1. Create invisible "junction node" below spouse pair
2. Connect both parents to junction node
3. Create horizontal distribution line
4. Connect each child to distribution line

**Code Structure:**
```typescript
interface JunctionNode {
  id: string;
  x: number;
  y: number;
  type: 'junction';
  parentIds: [string, string | null];
  childIds: string[];
}
```

### 3.3 Node Design Requirements

#### 3.3.1 Traditional Chinese Node Style

**Design Specification:**

```
┌──────────────────────────┐
│                          │
│   [Photo/Avatar]         │
│                          │
├──────────────────────────┤
│   Name: 张三             │
│   Dates: 1950-2020       │
│   Generation: 3          │
└──────────────────────────┘
```

**Visual Elements:**
- Rectangular card with rounded corners
- Traditional Chinese border pattern (optional)
- Gender-based accent colors
- Generation badge
- Life dates (birth-death)

**Color Scheme:**
- Male: Blue border/accent (`#3b82f6`)
- Female: Pink border/accent (`#ec4899`)
- Background: White/light gray in light mode, dark gray in dark mode
- Border: 2px solid with accent color

#### 3.3.2 Node Size Variations

```typescript
const NODE_SIZES = {
  root: { width: 180, height: 120, avatar: 80 },
  generation: { width: 150, height: 100, avatar: 60 },
  descendant: { width: 120, height: 80, avatar: 50 },
};
```

### 3.4 Generation Indicators

**Requirement:** Clear visual indication of generation levels.

**Implementation Options:**

1. **Row Labels** (left side):
```
│ 第一代 │  [Person] [Person] [Person]
│ 第二代 │  [Person] [Person]
│ 第三代 │  [Person] [Person] [Person] [Person]
```

2. **Generation Badges** (on nodes):
```
┌──────────┐
│  [Photo] │  [3]
│  Name    │
└──────────┘
```

3. **Background Row Shading** (alternating):
```
Generation 0: Light gray background
Generation 1: White background
Generation 2: Light gray background
```

**Recommended:** Combination of row labels (toggleable) and generation badges.

### 3.5 Interactive Elements

#### 3.5.1 Hover States

**Hover on Node:**
- Scale: 1.05
- Shadow: Increased
- Border: Thicker with accent color
- Show quick actions (edit, delete, add child)

**Hover on Connection:**
- Highlight path
- Show relationship type tooltip
- Highlight connected nodes

#### 3.5.2 Selection States

**Selected Node:**
- Blue ring around node
- Connected relationships highlighted
- Dim other nodes
- Show detailed info panel

#### 3.5.3 Zoom and Pan

**Requirements:**
- Smooth zoom (0.1x to 3x)
- Pan with drag
- Fit to tree button
- Zoom to selection
- Minimap for navigation

---

## 4. Technical Architecture

### 4.1 Component Structure

```
TreeBoardContent
├── TreeBoardHeader
├── FilterPanel
├── TreeCanvas
│   ├── ReactFlow
│   │   ├── CustomNodeTypes
│   │   │   ├── PersonNode (traditional style)
│   │   │   ├── JunctionNode (invisible)
│   │   │   └── GenerationLabel (optional)
│   │   └── CustomEdgeTypes
│   │       ├── SpouseEdge (horizontal dashed)
│   │       ├── ParentChildEdge (orthogonal)
│   │       └── DistributionEdge (horizontal merge)
│   ├── Background
│   │   └── Grid (traditional pattern)
│   └── Controls
│       ├── Zoom controls
│       ├── Fit view
│       └── Layout toggle
├── MiniMap
├── NodeTooltip
└── FloatingControls
```

### 4.2 Data Flow

```
API Request
    ↓
useTreeData Hook
    ↓
setTreeData (Zustand Store)
    ↓
calculatePedigreeLayout (with orthogonal paths)
    ↓
    ├── Nodes (positioned by generation)
    ├── Edges (orthogonal routing)
    └── JunctionNodes (invisible)
    ↓
ReactFlow Render
    ↓
User Interaction
    ↓
Update Store / API
```

### 4.3 New Type Definitions

```typescript
// src/types/tree-layout.ts

export interface TreeNodeLayout {
  id: string;
  person: IPerson;
  generation: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  familyUnitId?: string;
  isRoot: boolean;
}

export interface JunctionNode {
  id: string;
  type: 'junction';
  position: { x: number; y: number };
  parentIds: [string, string | null];
  childIds: string[];
}

export interface OrthogonalEdge {
  id: string;
  source: string;
  target: string;
  type: 'spouse' | 'parent-child' | 'distribution';
  path: string; // SVG path for orthogonal routing
  style: EdgeStyle;
}

export interface GenerationRow {
  level: number;
  y: number;
  height: number;
  label: string;
  labelVisible: boolean;
}
```

### 4.4 Enhanced Layout Algorithm

**File:** `src/lib/tree-layout/pedigree-orthogonal.ts`

```typescript
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
  // 1. Build generation map
  const generationMap = buildGenerationMap(rootPersonId, persons, relationships);

  // 2. Identify family units
  const familyUnits = identifyFamilyUnits(persons, relationships, generationMap);

  // 3. Calculate generation rows
  const generationRows = calculateGenerationRows(generationMap, options);

  // 4. Position nodes with orthogonal routing
  const { nodes, junctionNodes } = positionNodesOrthogonally(
    generationMap,
    familyUnits,
    generationRows,
    options
  );

  // 5. Create orthogonal edges
  const edges = createOrthogonalEdges(
    nodes,
    junctionNodes,
    familyUnits,
    options
  );

  return { nodes, edges, junctionNodes, generationRows };
}

function positionNodesOrthogonally(
  generationMap: Map<string, number>,
  familyUnits: InternalFamilyUnit[],
  generationRows: GenerationRow[],
  options: OrthogonalLayoutOptions
): { nodes: Node[]; junctionNodes: JunctionNode[] } {
  // Implementation details...
}

function createOrthogonalEdges(
  nodes: Node[],
  junctionNodes: JunctionNode[],
  familyUnits: InternalFamilyUnit[],
  options: OrthogonalLayoutOptions
): Edge[] {
  // Implementation details...
}

function getOrthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  const midY = (sourceY + targetY) / 2;
  return `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
}
```

---

## 5. Component Specifications

### 5.1 TraditionalPersonNode Component

**New File:** `src/components/tree/TraditionalPersonNode.tsx`

```typescript
interface TraditionalPersonNodeProps extends NodeProps<PersonNodeData> {
  showGenerationBadge?: boolean;
  variant?: 'traditional' | 'modern';
}

export function TraditionalPersonNode({
  data,
  selected,
  showGenerationBadge = true,
  variant = 'traditional',
}: TraditionalPersonNodeProps) {
  const { person, generation } = data;

  return (
    <div className={cn(
      'traditional-person-node',
      variant === 'traditional' && 'chinese-style-border',
      selected && 'selected-ring'
    )}>
      {/* Avatar */}
      <Avatar src={person.photos?.[0]} fullName={getFullName(person)} />

      {/* Generation Badge */}
      {showGenerationBadge && (
        <GenerationBadge level={generation} />
      )}

      {/* Name */}
      <NameLabel person={person} />

      {/* Dates */}
      <DateSpan person={person} />
    </div>
  );
}
```

**Styling (CSS):**
```css
.traditional-person-node {
  background: white;
  border: 2px solid;
  border-radius: 8px;
  padding: 12px;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.traditional-person-node.male {
  border-color: #3b82f6;
}

.traditional-person-node.female {
  border-color: #ec4899;
}

.traditional-person-node.chinese-style-border {
  border-image: url('/patterns/chinese-border.svg') 10 round;
}

.traditional-person-node:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.traditional-person-node.selected {
  ring: 4px;
  ring-color: #3b82f6;
}

.generation-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}
```

### 5.2 OrthogonalEdge Component

**Enhanced File:** `src/components/tree/OrthogonalEdge.tsx`

```typescript
interface OrthogonalEdgeProps extends EdgeProps {
  sourcePosition: Position;
  targetPosition: Position;
}

export function OrthogonalParentChildEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: OrthogonalEdgeProps) {
  // Calculate orthogonal path with two 90-degree turns
  const midY = (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY}
               L ${sourceX} ${midY}
               L ${targetX} ${midY}
               L ${targetX} ${targetY}`;

  return (
    <g>
      <path
        id={id}
        d={path}
        fill="none"
        stroke={style?.stroke || '#cbd5e1'}
        strokeWidth={style?.strokeWidth || 2}
        strokeDasharray={style?.strokeDasharray || 'none'}
      />
      {/* Optional: Add arrow at target */}
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={style?.stroke || '#cbd5e1'} />
        </marker>
      </defs>
    </g>
  );
}
```

### 5.3 GenerationRow Component

**New File:** `src/components/tree/GenerationRow.tsx`

```typescript
interface GenerationRowProps {
  row: GenerationRow;
  visible: boolean;
}

export function GenerationRow({ row, visible }: GenerationRowProps) {
  if (!visible) return null;

  return (
    <div
      className="generation-row"
      style={{
        position: 'absolute',
        top: row.y,
        left: 0,
        right: 0,
        height: row.height,
        backgroundColor: row.level % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
      }}
    >
      <div className="generation-label">
        {row.label}
      </div>
    </div>
  );
}
```

### 5.4 SpouseEdge Enhancement

**Enhanced File:** `src/components/tree/SpouseEdge.tsx`

```typescript
export function EnhancedSpouseEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      {/* Horizontal connection line */}
      <line
        x1={sourceX}
        y1={sourceY}
        x2={targetX}
        y2={targetY}
        stroke={style?.stroke || '#f472b6'}
        strokeWidth={style?.strokeWidth || 2}
        strokeDasharray={style?.strokeDasharray || '5,5'}
      />

      {/* Traditional Chinese marriage symbol (optional) */}
      <foreignObject x={midX - 12} y={midY - 12} width={24} height={24}>
        <div className="marriage-symbol">
          <span className="text-xl">囍</span>
        </div>
      </foreignObject>
    </>
  );
}
```

---

## 6. Acceptance Criteria

### 6.1 Layout Acceptance Criteria

- [ ] Nodes are arranged in horizontal rows by generation level
- [ ] Spouses are positioned adjacent to each other in the same row
- [ ] Children are centered below their parent(s)
- [ ] No nodes overlap within the same generation
- [ ] Generational rows have visual separation (background or label)
- [ ] Root person is clearly highlighted
- [ ] Large trees (50+ persons) render without performance issues

### 6.2 Connection Line Acceptance Criteria

- [ ] All parent-child connections use orthogonal paths (90-degree angles)
- [ ] Spouse connections are horizontal dashed lines
- [ ] Multiple children connect through a merged junction
- [ ] Connection lines are clearly visible against background
- [ ] Lines adapt to dark/light theme
- [ ] Hovering on a connection highlights the path
- [ ] Connection lines don't cross unnecessarily

### 6.3 Node Design Acceptance Criteria

- [ ] Nodes use rectangular card design (not circular)
- [ ] Gender is visually indicated (border/accent color)
- [ ] Generation badge is visible on each node
- [ ] Name and dates are clearly readable
- [ ] Avatar/photo is displayed prominently
- [ ] Selected state has clear visual indicator
- [ ] Hover state provides feedback
- [ ] Deceased persons are visually distinguished

### 6.4 Interactive Acceptance Criteria

- [ ] Clicking a node selects it and shows details
- [ ] Double-clicking navigates to person profile
- [ ] Zoom controls work smoothly (0.1x to 3x)
- [ ] Pan functionality works with drag
- [ ] Fit-to-tree button centers the entire tree
- [ ] Mini-map shows current viewport position
- [ ] Keyboard navigation works (arrow keys, tab)

### 6.5 Accessibility Acceptance Criteria

- [ ] All nodes have proper ARIA labels
- [ ] Focus states are visible for keyboard navigation
- [ ] Tree structure is announced to screen readers
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are minimum 44x44px
- [ ] Reduced motion is respected

### 6.6 Theme Acceptance Criteria

- [ ] Light mode renders correctly with proper contrast
- [ ] Dark mode renders correctly with proper contrast
- [ ] Theme switching doesn't break layout
- [ ] Connection lines adapt to theme
- [ ] Generation row backgrounds adapt to theme

---

## 7. Implementation Phases

### Phase 1: Layout Algorithm Enhancement (3-4 days)

**Tasks:**
1. Create new orthogonal layout algorithm file
2. Implement generation row calculation
3. Add node positioning with overlap detection
4. Create junction node generation logic
5. Write unit tests for layout algorithm

**Files:**
- `src/lib/tree-layout/pedigree-orthogonal.ts` (new)
- `src/lib/tree-layout/__tests__/pedigree-orthogonal.test.ts` (new)

### Phase 2: Orthogonal Edge Components (2-3 days)

**Tasks:**
1. Create `OrthogonalParentChildEdge` component
2. Enhance `SpouseEdge` with traditional symbols
3. Create `JunctionNode` component (invisible)
4. Update `FamilyEdge` to use orthogonal paths
5. Write component tests

**Files:**
- `src/components/tree/OrthogonalEdge.tsx` (new)
- `src/components/tree/SpouseEdge.tsx` (enhance)
- `src/components/tree/JunctionNode.tsx` (new)

### Phase 3: Traditional Node Design (2-3 days)

**Tasks:**
1. Create `TraditionalPersonNode` component
2. Implement gender-based styling
3. Add generation badge component
4. Create CSS styles for traditional look
5. Add hover and selection states
6. Write component tests

**Files:**
- `src/components/tree/TraditionalPersonNode.tsx` (new)
- `src/components/tree/GenerationBadge.tsx` (new)
- `src/components/tree/styles/traditional-node.css` (new)

### Phase 4: Generation Row Visualization (1-2 days)

**Tasks:**
1. Create `GenerationRow` component
2. Add toggle for generation labels
3. Implement alternating row backgrounds
4. Integrate with TreeCanvas
5. Write tests

**Files:**
- `src/components/tree/GenerationRow.tsx` (new)
- `src/components/tree/TreeCanvas.tsx` (update)

### Phase 5: Integration and Polish (2-3 days)

**Tasks:**
1. Update TreeCanvas to use new components
2. Add layout toggle (traditional/modern)
3. Update TreeBoardContent with generation rows
4. Test with large trees
5. Performance optimization
6. Accessibility audit
7. Cross-browser testing

**Files:**
- `src/components/tree/TreeCanvas.tsx` (update)
- `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` (update)
- `src/store/treeBoardStore.ts` (add layout preference)

### Phase 6: Documentation and Testing (1-2 days)

**Tasks:**
1. Update component documentation
2. Write integration tests
3. Create visual regression tests
4. Update user guide
5. Create demo data

**Files:**
- `docs/components/tree-board.md` (new)
- `tests/integration/tree-visualization.test.ts` (new)
- `tests/e2e/tree-board-traditional.spec.ts` (new)

---

## 8. Edge Cases and Considerations

### 8.1 Complex Family Structures

**Multiple Spouses:**
- Scenario: Person has had multiple spouses (sequential)
- Handling: Show all spouses in same generation, use different line styles for current vs. previous

**Half-Siblings:**
- Scenario: Children share one parent but not both
- Handling: Use dashed connection line, show shared parent connection

**Adopted Children:**
- Scenario: Child has biological and adoptive parents
- Handling: Use different line styles (solid for biological, dashed for adoptive)

**Same-Sex Couples:**
- Scenario: Two parents of same gender
- Handling: No special handling needed, algorithm supports any gender combination

### 8.2 Large Trees

**Performance:**
- Scenario: 100+ persons in tree
- Handling: Implement virtualization, lazy loading, canvas rendering

**Viewport:**
- Scenario: Tree wider than viewport
- Handling: Fit-to-view, minimap, zoom controls

**Mobile:**
- Scenario: Viewing on small screen
- Handling: Responsive layout, touch gestures, simplified view

### 8.3 Data Issues

**Missing Dates:**
- Scenario: Person has no birth/death dates
- Handling: Display "Unknown" or omit dates section

**Missing Photos:**
- Scenario: Person has no photo
- Handling: Use initials or default avatar

**Circular References:**
- Scenario: Data has relationship cycles
- Handling: Detect and prevent, show error message

**Disconnected Nodes:**
- Scenario: Person has no relationships
- Handling: Position in available row, show as orphan

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Layout Algorithm:**
```typescript
describe('calculateOrthogonalPedigreeLayout', () => {
  it('positions nodes in generational rows');
  it('centers children below parents');
  it('prevents node overlap');
  it('handles multiple spouses');
  it('handles half-siblings');
  it('creates correct junction nodes');
  it('generates orthogonal edge paths');
});
```

**Edge Components:**
```typescript
describe('OrthogonalParentChildEdge', () => {
  it('renders orthogonal path');
  it('calculates correct midY point');
  it('adapts to dark theme');
  it('shows arrow marker');
});
```

### 9.2 Integration Tests

```typescript
describe('Tree Board Visualization', () => {
  it('loads and displays complete tree');
  it('shows all generations correctly');
  it('renders orthogonal connections');
  it('handles user interactions');
  it('switches between layouts');
});
```

### 9.3 E2E Tests

```typescript
test('displays traditional Chinese family tree', async ({ page }) => {
  await page.goto('/trees/test-tree-id');
  await expect(page.locator('.traditional-person-node')).toHaveCount(expectedCount);
  await expect(page.locator('.orthogonal-edge')).toBeVisible();
  await expect(page.locator('.generation-row')).toBeVisible();
});
```

### 9.4 Visual Regression Tests

- Capture screenshots of sample trees
- Compare across commits
- Test light/dark themes
- Test various family structures

---

## 10. Performance Considerations

### 10.1 Rendering Performance

**Optimization Strategies:**
1. Use React.memo for node components
2. Virtualize off-screen nodes
3. Debounce zoom/pan events
4. Use canvas for large numbers of edges
5. Lazy load tree data by generation

### 10.2 Memory Management

**Strategies:**
1. Dispose unused ReactFlow instances
2. Clear cache on tree switch
3. Limit undo/redo history
4. Use weak references for large objects

### 10.3 Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial render time | < 2s | 100 person tree |
| Zoom response | < 100ms | Frame time |
| Pan response | < 100ms | Frame time |
| Memory usage | < 100MB | 100 person tree |

---

## 11. Accessibility Requirements

### 11.1 Screen Reader Support

```html
<div
  role="treeitem"
  aria-level={generation}
  aria-label={`${person.name}, Generation ${generation}`}
  aria-setsize={totalInGeneration}
  aria-posinset={positionInGeneration}
>
  <!-- Node content -->
</div>
```

### 11.2 Keyboard Navigation

- Tab: Navigate between nodes
- Arrow keys: Navigate tree structure
- Enter: Select node
- Space: Toggle details
- +/-: Expand/collapse branches

### 11.3 Color Contrast

- Text: Minimum 4.5:1 contrast ratio
- Borders: Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

---

## 12. Design System Integration

### 12.1 Color Palette

```css
:root {
  --color-male-border: #3b82f6;
  --color-female-border: #ec4899;
  --color-spouse-line: #f472b6;
  --color-parent-line: #cbd5e1;
  --color-generation-bg-odd: rgba(0, 0, 0, 0.02);
  --color-generation-bg-even: transparent;
  --color-selected-ring: #13c8ec;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-male-border: #60a5fa;
    --color-female-border: #f472b6;
    --color-spouse-line: #f472b6;
    --color-parent-line: #64748b;
    --color-generation-bg-odd: rgba(255, 255, 255, 0.02);
    --color-generation-bg-even: transparent;
    --color-selected-ring: #13c8ec;
  }
}
```

### 12.2 Typography

```css
.traditional-person-node .name {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
}

.traditional-person-node .dates {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: var(--color-text-muted);
}

.generation-badge {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 700;
  font-size: 12px;
}
```

---

## 13. Migration Strategy

### 13.1 Backward Compatibility

- Keep existing `calculatePedigreeLayout` function
- Add new `calculateOrthogonalPedigreeLayout` function
- Add user preference for layout style
- Default to traditional layout for new users

### 13.2 Data Migration

- No data migration needed
- Layout is purely presentational
- Existing relationships work with new layout

### 13.3 Rollback Plan

- Feature flag for new layout
- Can disable if issues arise
- User preference saved in localStorage

---

## 14. Definition of Done

A task is complete when:
- [ ] Code implemented and reviewed
- [ ] All unit tests pass (≥ 80% coverage)
- [ ] All integration tests pass
- [ ] E2E tests pass in CI/CD
- [ ] Visual regression tests pass
- [ ] Accessibility audit passes
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] User guide updated
- [ ] Manual testing completed
- [ ] No regression bugs

---

## 15. Related Documents

- `docs/specifications/tree-connection-improvements.md` - Connection line specifications
- `docs/specifications/tree-detail-uiux-refactor.md` - Theme and color specifications
- `docs/specifications/tree-board-visualization-fix.md` - Bug fixes
- `docs/specifications/ui-ux-improvements.md` - General UI improvements

---

## 16. Open Questions

1. **Generation Labels:** Should generation labels be in Chinese (第一代, 第二代) or English (1st Generation, 2nd Generation)?
   - **Recommendation:** Support both via localization

2. **Layout Direction:** Should the tree support right-to-left layout (traditional Chinese) or only top-down?
   - **Recommendation:** Support both as user preference

3. **Marriage Symbol:** Should the traditional 囍 symbol be used for spouse connections?
   - **Recommendation:** Make it optional/accessible

4. **Node Size:** Should node sizes be fixed or adjustable?
   - **Recommendation:** Fixed sizes with zoom control

5. **Maximum Generations:** Is there a limit to the number of generations displayed?
   - **Recommendation:** No hard limit, but implement virtualization for 10+ generations

---

## 17. Appendix: ASCII Art Reference

### Traditional Chinese Family Tree Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         第一代 (1st Generation)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐         ┌──────────────────┐            │
│   │   [爷爷]         │═════════│   [奶奶]         │            │
│   │   Grandfather   │         │   Grandmother   │            │
│   │   1920-1995     │         │   1925-2000     │            │
│   └──────────────────┘         └──────────────────┘            │
│             │                            │                      │
│             └────────┬───────────────────┘                      │
│                      │                                          │
│                      ║ (orthogonal lines)                      │
│                      ║                                          │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                    第二代 (2nd Generation)                │ │
│   ├──────────────────────────────────────────────────────────┤ │
│   │                                                          │ │
│   │   ┌──────────────┐       ┌──────────────┐              │ │
│   │   │  [父亲]      │═══════│  [母亲]      │              │ │
│   │   │  Father     │       │  Mother     │              │ │
│   │   │  1950-2020  │       │  1955-2022  │              │ │
│   │   └──────────────┘       └──────────────┘              │ │
│   │        │                       │                        │ │
│   │        └──────────┬────────────┘                        │ │
│   │                   │                                     │ │
│   │        ┌──────────┼──────────┐                          │ │
│   │        ║          ║          ║                          │ │
│   └────────┼──────────┼──────────┼──────────────────────────┘ │
│            ║          ║          ║                            │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │                    第三代 (3rd Generation)               │ │
│   ├─────────────────────────────────────────────────────────┤ │
│   │                                                         │ │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐               │ │
│   │   │ [我]    │  │ [兄弟]  │  │ [姐妹]  │               │ │
│   │   │ Me      │  │ Brother │  │ Sister  │               │ │
│   │   │ 1985-   │  │ 1990-   │  │ 1992-   │               │ │
│   │   └─────────┘  └─────────┘  └─────────┘               │ │
│   │                                                         │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Legend:
════  : Spouse connection (dashed pink line)
║     : Parent-child connection (orthogonal gray line)
├───── : Generation row separator
```

---

**Document Status:** Ready for Engineering Team Review
**Next Steps:**
1. Review and approve specification
2. Create implementation tasks
3. Begin Phase 1 implementation

---

## Summary of Key Files Referenced

| File Path | Purpose |
|-----------|---------|
| `/Users/nguyenhuukhai/Project/family-tree/design/example.png` | Reference image for traditional Chinese family tree design |
| `/Users/nguyenhuukhai/Project/family-tree/src/lib/tree-layout/pedigree.ts` | Current layout algorithm |
| `/Users/nguyenhuukhai/Project/family-tree/src/components/tree/TreeCanvas.tsx` | Main canvas component |
| `/Users/nguyenhuukhai/Project/family-tree/src/components/tree/PersonNode.flow.tsx` | Current node component |
| `/Users/nguyenhuukhai/Project/family-tree/src/components/tree/FamilyEdge.tsx` | Current edge components |
| `/Users/nguyenhuukhai/Project/family-tree/src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` | Page content container |

This specification document provides a comprehensive roadmap for implementing traditional Chinese family tree (Jiapu) style visualization in the Family Tree application. The implementation maintains backward compatibility while introducing enhanced visual elements based on the example image.
