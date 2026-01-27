# Task 21: Create Family Tree Board Page

**Phase:** 12 - Pages
**Priority:** Critical
**Dependencies:** Task 16 (UI), Task 10 (Visualization Strategies)
**Estimated Complexity:** Very High

---

## Objective

Implement the interactive Family Tree visualization page based on `design/family-tree-board.html`. This is the core feature of the application.

---

## Design Analysis

### Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                       │
│  [Tree Icon] Smith Family Tree    [Search]  [View Toggle]  [Share] [Avatar] │
├──────────────┬─────────────────────────────────────────────┤
│    Side      │              Canvas Area                     │
│    Nav       │     ┌─────┐                                 │
│  [Filters]   │     │Root │──┬──[Parent1]──┬──[GP1]        │
│  [Generations│     │Node │  │             └──[GP2]        │
│  [Branches]  │     └─────┘  └──[Parent2]──┬──[GP3]        │
│  [Settings]  │                            └──[GP4]        │
│              │                                              │
│  [Quick      │                    [Node Tooltip]           │
│   Access]    │                                              │
│              │        ┌──────────────────────────┐         │
│  [Export]    │        │ Floating Control Bar    │         │
│              │        │ [Zoom] [Center] [Pan] [Add]│        │
└──────────────┴────────┴──────────────────────────┴─────────┤
│                              [Mini-map] (top-right)        │
└────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Interactive Canvas**
   - Zoom in/out
   - Pan/drag navigation
   - Click nodes to select
   - Hover for quick info
   - Double-click to expand

2. **View Modes**
   - Pedigree View (horizontal tree)
   - Fan Chart (circular ancestry)

3. **Node Interactions**
   - Click: Show tooltip
   - Double-click: Open profile
   - Right-click: Context menu
   - Drag: Reposition (optional)

4. **Floating Controls**
   - Zoom controls (+/- and slider)
   - Center view button
   - Pan mode toggle
   - Quick Add Person button

---

## Technical Architecture

### Canvas Options

| Option | Pros | Cons |
|--------|------|------|
| SVG | Scalable, accessible | Performance with many nodes |
| Canvas 2D | Fast rendering | No DOM, less accessible |
| React Flow | Rich features, maintained | Bundle size |
| D3.js | Powerful, flexible | Steep learning curve |

**Recommendation:** React Flow for MVP, custom SVG for optimization later.

### State Management

```typescript
interface TreeBoardState {
  // View state
  zoom: number;
  pan: { x: number; y: number };
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  viewMode: 'pedigree' | 'fan';

  // Data
  tree: ITree;
  persons: IPerson[];
  relationships: IRelationship[];

  // UI
  showMinimap: boolean;
  showSidebar: boolean;
  showTooltip: boolean;
  tooltipPosition: { x: number; y: number };

  // Actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  selectNode: (nodeId: string | null) => void;
  // ...
}
```

---

## Implementation Specification

### Page Component

**File:** `src/app/(dashboard)/trees/[id]/page.tsx`

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { TreeBoardContent } from './TreeBoardContent';
import { TreeBoardSkeleton } from './TreeBoardSkeleton';
import { container } from '@/lib/di/container';

interface PageProps {
  params: { id: string };
}

export default async function TreeBoardPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const tree = await container.treeService.getTreeById(params.id, session.user.id);
  if (!tree) notFound();

  return (
    <Suspense fallback={<TreeBoardSkeleton />}>
      <TreeBoardContent treeId={params.id} />
    </Suspense>
  );
}
```

### Canvas Component

**File:** `src/components/tree/TreeCanvas.tsx`

```typescript
'use client';

import { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PersonNode } from './PersonNode';
import { useTreeStore } from '@/store/treeStore';

const nodeTypes = {
  person: PersonNode,
};

interface TreeCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick: (node: Node) => void;
  onNodeDoubleClick: (node: Node) => void;
}

export function TreeCanvas({
  initialNodes,
  initialEdges,
  onNodeClick,
  onNodeDoubleClick,
}: TreeCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { zoom, setZoom } = useTreeStore();

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onNodeClick(node)}
        onNodeDoubleClick={(_, node) => onNodeDoubleClick(node)}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
      >
        <Background gap={40} color="#d1d5db" />
        <MiniMap
          nodeColor={(n) => (n.selected ? '#13c8ec' : '#cbd5e1')}
          className="!bg-white/80 !rounded-xl !border !border-[#e7f1f3]"
        />
      </ReactFlow>
    </div>
  );
}
```

### Person Node Component

**File:** `src/components/tree/PersonNode.tsx`

```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { IPerson } from '@/types/person';

interface PersonNodeData {
  person: IPerson;
  isRoot?: boolean;
  generation?: number;
}

export const PersonNode = memo(function PersonNode({
  data,
  selected,
}: NodeProps<PersonNodeData>) {
  const { person, isRoot, generation } = data;

  const nodeSize = isRoot ? 'size-20' : generation === 1 ? 'size-16' : 'size-12';
  const borderStyle = isRoot
    ? 'border-4 border-primary'
    : selected
    ? 'border-2 border-primary'
    : 'border-2 border-[#cbd5e1] dark:border-[#2d3a3c]';

  return (
    <div className="flex flex-col items-center group cursor-pointer">
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="!bg-primary" />

      {/* Avatar */}
      <div
        className={`${nodeSize} rounded-full ${borderStyle} bg-white dark:bg-[#1e2f32] p-1 shadow-lg group-hover:scale-110 transition-transform`}
      >
        <div
          className="w-full h-full rounded-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${person.profilePhoto || '/default-avatar.png'})`,
          }}
        />
      </div>

      {/* Name label */}
      <div className="mt-2 text-center bg-white/90 dark:bg-[#1e2f32]/90 backdrop-blur px-3 py-1 rounded-lg">
        <p className={`font-bold ${isRoot ? 'text-sm' : 'text-xs'}`}>
          {person.firstName} {person.lastName}
        </p>
        <p className="text-[9px] text-[#4c8d9a]">
          {formatLifespan(person.birthDate, person.deathDate)}
        </p>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
});
```

### Node Tooltip Component

**File:** `src/components/tree/NodeTooltip.tsx`

```typescript
interface NodeTooltipProps {
  person: IPerson;
  position: { x: number; y: number };
  onClose: () => void;
  onViewProfile: () => void;
  onEditFacts: () => void;
}

export function NodeTooltip({
  person,
  position,
  onClose,
  onViewProfile,
  onEditFacts,
}: NodeTooltipProps) {
  return (
    <div
      className="absolute z-50 w-64 bg-white dark:bg-[#1e2f32] rounded-xl shadow-2xl border border-primary/20 p-4"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex justify-between items-start mb-3">
        <Avatar src={person.profilePhoto} size="md" />
        <button onClick={onClose} className="text-[#4c8d9a] hover:text-primary">
          <X size={16} />
        </button>
      </div>
      <h3 className="text-sm font-bold">{person.firstName} {person.lastName}</h3>
      <p className="text-xs text-[#4c8d9a] mb-3 line-clamp-2">
        {person.biography || 'No biography available.'}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onViewProfile}>
          View Profile
        </Button>
        <Button size="sm" variant="outline" onClick={onEditFacts}>
          Edit Facts
        </Button>
      </div>

      {/* Tooltip arrow */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#1e2f32] rotate-45 border-r border-b border-primary/10" />
    </div>
  );
}
```

---

## Tree Layout Algorithm

### Pedigree View (Horizontal)

```typescript
function calculatePedigreeLayout(
  rootPersonId: string,
  persons: Map<string, IPerson>,
  relationships: IRelationship[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 150;

  function traverse(personId: string, generation: number, yOffset: number) {
    const person = persons.get(personId);
    if (!person) return;

    // Add node
    nodes.push({
      id: personId,
      type: 'person',
      position: { x: generation * HORIZONTAL_SPACING, y: yOffset },
      data: { person, generation, isRoot: generation === 0 },
    });

    // Find parents
    const parents = relationships.filter(
      (r) => r.toPersonId === personId && r.type === 'parent'
    );

    if (parents.length > 0) {
      const parentSpacing = VERTICAL_SPACING / Math.pow(2, generation);

      parents.forEach((parentRel, index) => {
        const parentY = yOffset + (index === 0 ? -parentSpacing : parentSpacing);

        // Add edge
        edges.push({
          id: `${parentRel.fromPersonId}-${personId}`,
          source: personId,
          target: parentRel.fromPersonId,
          type: 'smoothstep',
        });

        // Recurse
        traverse(parentRel.fromPersonId, generation + 1, parentY);
      });
    }
  }

  traverse(rootPersonId, 0, 300);

  return { nodes, edges };
}
```

---

## UX Improvements

| Original Design | Improvement | Rationale |
|-----------------|-------------|-----------|
| Static lines | Animated connection drawing | Engagement |
| No breadcrumb | "Root > Parent > Current" path | Navigation |
| Fixed zoom | Zoom to fit on load | Best initial view |
| No undo | Undo last action | Error recovery |
| No keyboard | Arrow keys to navigate | Accessibility |
| No touch | Pinch zoom, swipe pan | Mobile |

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Empty tree | Show "Add first person" state |
| Single person | Show single node, prompt to add |
| Very large tree | Virtualization, progressive load |
| Complex relationships | Handle multiple parents (adoption) |
| Circular reference | Prevent, show warning |
| Missing photos | Default avatar by gender |
| Long names | Truncate with tooltip |
| Zoom boundaries | Min 10%, Max 200% |
| Node overlap | Auto-layout algorithm |

---

## Performance Optimization

| Technique | Implementation |
|-----------|----------------|
| Virtualization | Only render visible nodes |
| Memoization | React.memo on PersonNode |
| Debouncing | Debounce zoom/pan events |
| Web Workers | Layout calculation off main thread |
| Lazy loading | Load ancestors on demand |
| Canvas rendering | Switch to Canvas for 1000+ nodes |

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard nav | Arrow keys move selection |
| Screen reader | ARIA tree role, live regions |
| Focus indicators | Visible focus ring on nodes |
| Zoom controls | Accessible +/- buttons |
| High contrast | Support high contrast mode |
| Motion reduced | Disable animations if preferred |

---

## Acceptance Criteria

- [ ] Tree visualization renders correctly
- [ ] Nodes are clickable with tooltip
- [ ] Double-click opens person profile
- [ ] Zoom in/out works
- [ ] Pan/drag works
- [ ] Mini-map shows overview
- [ ] View toggle (Pedigree/Fan) works
- [ ] Quick Add button opens form
- [ ] Sidebar filters work
- [ ] Search within tree works
- [ ] Export PDF works
- [ ] Mobile touch gestures work
- [ ] Performance acceptable (100+ nodes)
- [ ] Accessibility requirements met
