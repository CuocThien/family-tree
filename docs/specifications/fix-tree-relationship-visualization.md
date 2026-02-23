# Fix Tree Relationship Visualization

## Overview
Fix the tree board detail page to correctly display node relationships with proper parent-child connection lines and level-based layout.

## Problem Statement

### Issue 1: Parent-Child Lines Not Showing
The parent-child connection lines are not displaying correctly because:
- Edges are created with type `smoothstep` (ReactFlow built-in) instead of `family` (custom edge type)
- The custom `FamilyEdge` component is never used since no edges have `type: 'family'`

### Issue 2: Edge Routing Problems
Current edge creation logic has issues:
- For couples with children, edges connect from spouse2 to children, not from both parents
- Single parent edges are created twice (duplicate logic)
- Junction-based routing is incomplete - junction nodes are never created as actual nodes

### Issue 3: Relationship Display Confusion
- Half-sibling connections may overlap with other edges
- Visual hierarchy is unclear

## Root Cause Analysis

### File: `src/lib/tree-layout/pedigree.ts`

In the `createEdges` function (lines 374-501):

```typescript
// PROBLEM 1: Edge uses 'smoothstep' instead of 'family'
edges.push({
  id: `parent-to-child-${childKey}`,
  source: unit.spouse2 ? unit.spouse2._id : unit.spouse1._id,  // Wrong source
  target: child._id,
  type: 'smoothstep',  // Should be 'family'
  // ...
});
```

### File: `src/components/tree/TreeCanvas.tsx`

The edge types are correctly registered:
```typescript
const edgeTypes: EdgeTypes = {
  spouse: SpouseEdge,
  'half-sibling': HalfSiblingEdge,
  family: FamilyEdge,  // This is never used!
};
```

## Proposed Solution

### Changes to `src/lib/tree-layout/pedigree.ts`

1. **Fix edge type**: Change all parent-child edges from `smoothstep` to `family`
2. **Fix edge source**: Connect from both parents properly
3. **Remove duplicate code**: Consolidate single parent edge creation
4. **Simplify edge routing**: Direct parent-to-child connections

### Edge Creation Strategy

For a family unit with parents and children:
```
    [Parent1] ==== [Parent2]      <- spouse edge (horizontal dashed)
         |            |
         +-----+------+          <- family edge from both parents
               |
        [Child1] [Child2]        <- children in same generation
```

For single parent:
```
    [Parent]
        |
   [Child1] [Child2]
```

## Implementation Plan

### Step 1: Fix Edge Types
- Change `type: 'smoothstep'` to `type: 'family'` for all parent-child edges
- Remove junction-related code that creates incomplete edges

### Step 2: Fix Parent-Child Connections
- For couples: Create individual edges from each parent to each child
- For single parents: Create edges from parent to each child
- Remove duplicate edge creation logic

### Step 3: Improve Visual Hierarchy
- Ensure proper z-index for edges (family edges below spouse edges)
- Consider edge path improvement for clearer parent-to-child flow

### Step 4: Test All Scenarios
- Single parent with children
- Couple with children
- Half-siblings from different parents
- Multi-generational tree

## Acceptance Criteria

- [ ] Parent-child connection lines are visible in the tree view
- [ ] Lines connect from parent(s) to children correctly
- [ ] Spouse connections (horizontal dashed lines) still work
- [ ] Half-sibling indicators are visible and don't overlap
- [ ] Tree layout maintains proper generational levels
- [ ] No duplicate edges are created
- [ ] Build passes without errors
- [ ] All existing tests pass

## Technical Specifications

### Modified Files
1. `src/lib/tree-layout/pedigree.ts` - Main fix location

### Edge Types Reference
| Type | Component | Visual Style | Purpose |
|------|-----------|--------------|---------|
| `spouse` | SpouseEdge | Horizontal dashed pink | Connects spouses |
| `family` | FamilyEdge | Smooth step gray | Connects parent to child |
| `half-sibling` | HalfSiblingEdge | Dashed gray subtle | Connects half-siblings |

### Code Changes Summary

```typescript
// BEFORE: Wrong edge type
edges.push({
  type: 'smoothstep',  // Built-in type, not using custom FamilyEdge
  source: unit.spouse2 ? unit.spouse2._id : unit.spouse1._id,
  // ...
});

// AFTER: Correct edge type with proper connections
// Create edge from parent1 to child
edges.push({
  type: 'family',  // Uses custom FamilyEdge component
  source: unit.spouse1._id,
  target: child._id,
  // ...
});

// If there's a second parent, create edge from parent2 to child
if (unit.spouse2) {
  edges.push({
    type: 'family',
    source: unit.spouse2._id,
    target: child._id,
    // ...
  });
}
```

## Testing Strategy

1. **Unit Tests**: Test edge creation logic in pedigree.ts
2. **Visual Tests**: Manually verify tree renders correctly
3. **Edge Cases**:
   - Tree with only root person (no edges)
   - Single parent with multiple children
   - Complex tree with multiple generations
   - Half-siblings scenarios

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Edge rendering regression | Medium | Visual testing of all edge types |
| Performance with many edges | Low | Monitor edge count in large trees |
| Layout issues | Low | Test with various family structures |

## References
- ReactFlow documentation: https://reactflow.dev/docs/
- Project structure: `.claude/CLAUDE.md`
