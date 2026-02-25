# Tree Board Detail Page Redesign Specification

## Document Information

- **Created**: 2026-02-25
- **Status**: Draft
- **Design Reference**: `/design/family-tree-board-v2.html`
- **Target Components**: Tree board detail page and related components

---

## 1. Executive Summary

This specification outlines the redesign of the tree board detail page to match the new design specification in `design/family-tree-board-v2.html`. The redesign focuses on modernizing the UI/UX while maintaining the traditional family tree visualization with orthogonal connections.

### Key Changes
- Unified view toggle (Pedigree View / Fan Chart) replacing dual layout modes
- Enhanced left sidebar with Quick Access panels
- Refined color scheme with primary color `#13c8ec`
- Improved node visualization with circular avatars and simplified styling
- Modern floating controls with zoom percentage display
- Enhanced mini-map (Navigator) component

---

## 2. Design Analysis

### 2.1 Design File Analysis (`design/family-tree-board-v2.html`)

#### Color Scheme
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary | `#13c8ec` | `#13c8ec` |
| Background | `#f6f8f8` | `#101f22` |
| Surface | `#ffffff` | `#101f22` |
| Surface Elevated | `#e7f1f3` | `#1e2f32` |
| Border | `#e7f1f3` | `#1e2f32` |
| Secondary Text | `#4c8d9a` | `#4c8d9a` |
| Foreground Text | `#0d191b` | `#ffffff` |
| Grid Dots | `#d1d5db` | `#2d3a3c` |
| Male Border | `#13c8ec` (primary) | `#13c8ec` |
| Female Border | `#f472b6` (pink-400) | `#f472b6` |

#### Layout Structure
```
+------------------------------------------------------------------+
|                        Top Navigation Bar                          |
| [Logo] [Tree Name] [Last Updated] | [Search] | [View Toggle] | ... |
+------------------------------------------------------------------+
|          |                                                          |
|  Left    |                    Main Canvas Area                      |
|  Sidebar |                                                          |
|          |     +-----------------------------------------------+    |
| [Nav]    |     |                                               |    |
| [Filters]|     |           Family Tree Visualization           |    |
| [Gen]    |     |                                               |    |
| [Branch] |     |     Generation 0: Patriarch & Matriarch       |    |
| [Setting]|     |              |                                 |    |
|          |     |     Generation 1: Children & Spouses          |    |
| [Quick   |     |              |                                 |    |
|  Access] |     |     Generation 2: Grandchildren               |    |
|          |     |                                               |    |
|          |     +-----------------------------------------------+    |
|          |                              [Navigator Mini-Map]        |
|          |                                                          |
| [Export] |              [Floating Controls - Bottom]               |
+------------------------------------------------------------------+
```

#### Component Breakdown

##### 2.1.1 Top Navigation Bar
- **Tree Info Block**: Logo icon, tree name ("Gia Pha Họ Nguyễn"), last updated timestamp
- **Search Bar**: Vietnamese placeholder "Tim kiem thanh vien...", rounded-xl design
- **View Toggle**: Segmented buttons for "Pedigree View" and "Fan Chart"
- **Right Actions**: Share button, user avatar with primary border

##### 2.1.2 Left Sidebar
- **Navigation Section**: Filters, Generations, Branches, Settings
- **Quick Access Section**: Dòng nội (Họ Nguyễn), Dòng ngoại (Họ Lê)
- **Export PDF Button**: Primary color with shadow

##### 2.1.3 Main Canvas
- **Grid Background**: Radial gradient dots pattern (40px spacing)
- **Tree Nodes**: Circular avatars with gender-based borders
- **Connection Lines**: Orthogonal (right-angle) lines with junction nodes
- **Node Sizes**:
  - Generation 0 (Root): 56px (size-14)
  - Generation 1: 56px (size-14)
  - Generation 2+: 48px (size-12)

##### 2.1.4 Floating Controls
- **Zoom Controls**: Zoom out, percentage display (85%), zoom in
- **Navigation Controls**: Recenter view, pan tool toggle
- **Quick Add Button**: Primary button with person_add icon

##### 2.1.5 Navigator Mini-Map
- **Size**: 192px x 128px (w-48 h-32)
- **Style**: Backdrop blur, rounded corners, grid preview
- **Viewport Indicator**: Primary border rectangle

---

## 3. Current Implementation Analysis

### 3.1 Files to be Modified/Removed

#### Files Requiring Modification
| File Path | Changes Required |
|-----------|-----------------|
| `/src/app/dashboard/trees/[treeId]/page.tsx` | Keep - minimal changes |
| `/src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` | Major refactor - remove dual layout mode |
| `/src/components/tree/TreeBoardHeader.tsx` | Update view toggle to Pedigree/Fan |
| `/src/components/tree/FilterPanel.tsx` | Add Quick Access section |
| `/src/components/tree/FloatingControls.tsx` | Update styling, remove duplicate view toggle |
| `/src/components/tree/MiniMap.tsx` | Complete redesign to match design |
| `/src/components/tree/SearchBar.tsx` | Update placeholder to Vietnamese |
| `/src/components/tree/TreeCanvas.tsx` | Simplify - remove modern layout mode |
| `/src/components/tree/TraditionalPersonNode.tsx` | Redesign to circular avatar style |
| `/src/components/tree/OrthogonalEdge.tsx` | Minor style updates |
| `/src/store/treeBoardStore.ts` | Update ViewMode type |
| `/src/lib/tree-layout/pedigree-orthogonal.ts` | Minor adjustments if needed |

#### Files to be Removed
| File Path | Reason |
|-----------|--------|
| `/src/components/tree/PersonNode.flow.tsx` | Modern layout node - replaced by unified circular node |
| `/src/components/tree/FamilyEdge.tsx` | Legacy edge component |
| `/src/components/tree/GenerationRow.tsx` | May need update or removal based on design |
| `/src/components/tree/NodeTooltip.tsx` | Evaluate if needed in new design |
| `/src/lib/tree-layout/pedigree.ts` | Modern layout algorithm - keep for Fan Chart |

### 3.2 Logic to Remove

1. **Dual Layout Mode Toggle**
   - Remove `layoutMode` state ('modern' | 'traditional')
   - Remove `onLayoutModeChange` prop from TreeBoardHeader
   - Simplify layout calculation to always use orthogonal pedigree

2. **Modern Layout Components**
   - Remove PersonNode component usage (keep TraditionalPersonNode)
   - Remove modern edge types (SpouseEdge, HalfSiblingEdge, FamilyEdge)
   - Remove pedigree.ts layout for modern view (keep for Fan Chart)

3. **View Mode in FloatingControls**
   - Remove duplicate view toggle from FloatingControls
   - Keep only in header as per design

4. **Redundant Filter UI**
   - Simplify FilterPanel to match design (no detailed filter controls shown)
   - Keep filter functionality but update UI

### 3.3 Store Updates Required

```typescript
// Current ViewMode type
export type ViewMode = 'pedigree' | 'fan' | 'timeline' | 'vertical';

// New ViewMode type (simplified)
export type ViewMode = 'pedigree' | 'fan';

// Remove or deprecate:
// - 'timeline' | 'vertical' view modes
// - layoutMode state (use only traditional/orthogonal)
```

---

## 4. Technical Implementation Plan

### 4.1 Phase 1: Store and Type Updates

#### Task 1.1: Update treeBoardStore.ts
- Update `ViewMode` type to only include 'pedigree' | 'fan'
- Remove or mark deprecated: 'timeline' | 'vertical'
- Keep existing viewport, filter, and selection logic

#### Task 1.2: Update types.ts
- Ensure TreeFilters remains compatible
- Add any new types needed for Quick Access panels

### 4.2 Phase 2: Component Refactoring

#### Task 2.1: Redesign TraditionalPersonNode.tsx
- Change from rectangular card to circular avatar
- Implement gender-based border colors:
  - Male: `border-primary` (#13c8ec)
  - Female: `border-pink-400` (#f472b6)
- Adjust sizes per generation:
  - Gen 0/1: size-14 (56px)
  - Gen 2+: size-12 (48px)
- Remove generation badge (not in design)
- Simplify name display (below avatar, bold)
- Keep Handle positions for ReactFlow connections

#### Task 2.2: Update TreeBoardHeader.tsx
- Replace Modern/Traditional toggle with Pedigree View/Fan Chart toggle
- Update styling to match design (rounded-xl, proper colors)
- Update SearchBar placeholder to Vietnamese

#### Task 2.3: Update FilterPanel.tsx
- Restructure to match design layout
- Add Quick Access section with:
  - Dòng nội (Họ Nguyễn) panel
  - Dòng ngoại (Họ Lê) panel
- Remove detailed filter controls from main view
- Keep filter functionality accessible through navigation

#### Task 2.4: Update FloatingControls.tsx
- Remove view toggle (moved to header)
- Update zoom percentage display
- Update styling to match design
- Keep zoom, pan, recenter, quick add functionality

#### Task 2.5: Redesign MiniMap.tsx
- Update to match Navigator design
- Add grid background preview
- Add viewport indicator rectangle
- Update size and styling

#### Task 2.6: Update TreeCanvas.tsx
- Remove modern layout support
- Always use orthogonal/traditional layout
- Update grid background to radial gradient dots
- Remove GenerationRow component usage if not in design

#### Task 2.7: Update TreeBoardContent.tsx
- Remove layoutMode state
- Always use calculateOrthogonalPedigreeLayout
- Simplify node/edge calculation
- Update component composition

### 4.3 Phase 3: Styling Updates

#### Task 3.1: Update Tailwind Configuration (if needed)
- Verify primary color is `#13c8ec`
- Add custom colors if not present:
  - `background-light`: `#f6f8f8`
  - `background-dark`: `#101f22`

#### Task 3.2: Update Canvas Grid Background
- Implement radial gradient dots pattern
- Light mode: `radial-gradient(#d1d5db 1px, transparent 1px)`
- Dark mode: `radial-gradient(#2d3a3c 1px, transparent 1px)`
- Background size: 40px 40px

### 4.4 Phase 4: Cleanup

#### Task 4.1: Remove Deprecated Files
- Remove or archive PersonNode.flow.tsx
- Remove or archive FamilyEdge.tsx
- Remove or archive GenerationRow.tsx (if not used)
- Remove or archive NodeTooltip.tsx (if not used)

#### Task 4.2: Remove Deprecated Code
- Remove modern layout mode logic
- Remove timeline/vertical view modes
- Clean up unused imports

---

## 5. Acceptance Criteria

### 5.1 Visual Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| AC-1 | Page matches design specification visually | High |
| AC-2 | Circular avatars with correct gender borders | High |
| AC-3 | Primary color #13c8ec applied consistently | High |
| AC-4 | Grid background displays correctly in light/dark mode | High |
| AC-5 | View toggle shows Pedigree View/Fan Chart | High |
| AC-6 | Quick Access panels display in sidebar | Medium |
| AC-7 | Floating controls match design | High |
| AC-8 | Navigator mini-map matches design | Medium |
| AC-9 | Vietnamese text displays correctly | Medium |
| AC-10 | Responsive layout works on different screens | Medium |

### 5.2 Functional Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| AC-11 | Zoom in/out works correctly | High |
| AC-12 | Pan and recenter functions work | High |
| AC-13 | Node click opens edit modal | High |
| AC-14 | Node double-click navigates to profile | High |
| AC-15 | Search filters visible nodes | High |
| AC-16 | Export PDF button functions | Medium |
| AC-17 | Share button triggers share functionality | Low |
| AC-18 | Dark mode toggle works | High |
| AC-19 | Tree data loads correctly | High |
| AC-20 | Add person modal works from Quick Add | High |

### 5.3 Technical Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| AC-21 | No TypeScript errors | High |
| AC-22 | No console errors in browser | High |
| AC-23 | All existing tests pass | High |
| AC-24 | New components have proper type definitions | High |
| AC-25 | Code follows project SOLID principles | High |
| AC-26 | No unused code remains | Medium |
| AC-27 | Performance is acceptable (<3s initial load) | Medium |

---

## 6. Edge Cases and Considerations

### 6.1 Data Edge Cases

| Edge Case | Description | Handling |
|-----------|-------------|----------|
| EC-1 | Empty tree (no persons) | Show empty state with "Add First Person" prompt |
| EC-2 | Single person in tree | Display single node with proper centering |
| EC-3 | Very large tree (100+ persons) | Implement virtualization or pagination |
| EC-4 | Person without photo | Show avatar with initials |
| EC-5 | Person with missing data | Display available data, show placeholders |
| EC-6 | Circular relationships | Detect and prevent infinite loops in layout |
| EC-7 | Multiple marriages | Handle multiple spouse connections |
| EC-8 | Adopted children | Distinguish from biological children if needed |

### 6.2 UI/UX Edge Cases

| Edge Case | Description | Handling |
|-----------|-------------|----------|
| EC-9 | Very long names | Truncate with ellipsis, show full on hover |
| EC-10 | Very deep generations (8+) | Implement scrolling or zoom controls |
| EC-11 | Wide tree (many siblings) | Implement horizontal scrolling |
| EC-12 | Touch/mobile devices | Ensure touch gestures work |
| EC-13 | Screen readers | Maintain ARIA labels and accessibility |
| EC-14 | High contrast mode | Ensure visibility in accessibility modes |
| EC-15 | Slow network | Show loading states, skeleton components |

### 6.3 Technical Edge Cases

| Edge Case | Description | Handling |
|-----------|-------------|----------|
| EC-16 | API failure | Show error message, retry option |
| EC-17 | WebSocket disconnection | Graceful degradation, reconnection |
| EC-18 | Concurrent edits | Optimistic updates, conflict resolution |
| EC-19 | Browser storage full | Clear old data, notify user |
| EC-20 | Memory pressure | Cleanup on unmount, lazy loading |

### 6.4 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest 2 versions | Full support |
| Firefox | Latest 2 versions | Full support |
| Safari | Latest 2 versions | Full support |
| Edge | Latest 2 versions | Full support |
| Mobile Chrome | Latest | Full support |
| Mobile Safari | Latest | Full support |

---

## 7. Architecture Compliance

### 7.1 SOLID Principles Checklist

#### Single Responsibility Principle (SRP)
- [ ] Each component handles one concern
- [ ] Store manages state, components manage UI
- [ ] Layout algorithms are separate from rendering

#### Open/Closed Principle (OCP)
- [ ] New view modes can be added without modifying existing code
- [ ] Node types are extensible through nodeTypes registry
- [ ] Edge types are extensible through edgeTypes registry

#### Liskov Substitution Principle (LSP)
- [ ] Node components can be substituted with different implementations
- [ ] Layout strategies are interchangeable

#### Interface Segregation Principle (ISP)
- [ ] Component props are minimal and focused
- [ ] Store selectors are specific

#### Dependency Inversion Principle (DIP)
- [ ] Components depend on abstractions (types/interfaces)
- [ ] Services are injected, not hardcoded

### 7.2 Layered Architecture Compliance

```
Presentation Layer (Components)
    |
    v
Business Logic Layer (Services, Hooks)
    |
    v
Data Access Layer (Repositories, API)
    |
    v
Database (MongoDB)
```

- **Components**: UI-only, no business logic
- **Hooks**: Data fetching and state management
- **Services**: Business rules (if any new logic added)
- **Repositories**: Data access (existing)

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Component | Test Coverage Required |
|-----------|----------------------|
| TraditionalPersonNode | Rendering, props, click handlers |
| TreeBoardHeader | Toggle functionality, search |
| FilterPanel | Navigation, quick access |
| FloatingControls | Zoom, pan, add functionality |
| MiniMap | Rendering, viewport indicator |
| treeBoardStore | State changes, selectors |

### 8.2 Integration Tests

| Scenario | Description |
|----------|-------------|
| Tree Loading | Full tree data loads and renders |
| Node Interaction | Click, double-click, hover |
| View Toggle | Switching between Pedigree/Fan |
| Search | Filter nodes by name |
| Add Person | Create new person from Quick Add |

### 8.3 E2E Tests

| Test Case | Description |
|-----------|-------------|
| Full Tree Navigation | User can navigate entire tree |
| CRUD Operations | Create, read, update, delete persons |
| Export PDF | Generate PDF export |
| Responsive Design | Test on mobile/tablet viewports |

---

## 9. Migration Strategy

### 9.1 Backward Compatibility

- Keep existing API endpoints unchanged
- Maintain data structure compatibility
- Existing tree data should render correctly

### 9.2 Feature Flags (Optional)

Consider implementing feature flags for:
- New node design (circular vs rectangular)
- New sidebar layout
- New floating controls

### 9.3 Rollback Plan

1. Keep old components in archive folder
2. Document all changes in changelog
3. Maintain git tags for easy rollback
4. Have database migration rollback scripts ready (if needed)

---

## 10. Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|---------------|
| Phase 1 | Store and Type Updates | 2-4 hours |
| Phase 2 | Component Refactoring | 8-12 hours |
| Phase 3 | Styling Updates | 2-4 hours |
| Phase 4 | Cleanup | 2-4 hours |
| Testing | Unit/Integration Tests | 4-6 hours |
| **Total** | | **18-30 hours** |

---

## 11. Dependencies

### 11.1 Existing Dependencies (No Changes Required)
- reactflow
- zustand
- @tanstack/react-query
- next-auth
- tailwindcss

### 11.2 Potential New Dependencies
- None required for this redesign

---

## 12. Documentation Updates Required

| Document | Update Required |
|----------|----------------|
| README.md | Update screenshots if applicable |
| API.md | No changes needed |
| Component Storybook | Update component stories |
| CLAUDE.md | No changes needed |

---

## 13. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Reviewer | | | |
| Product Owner | | | |

---

## Appendix A: Design File Reference

Full design specification available at: `/design/family-tree-board-v2.html`

Key design elements:
- Tailwind CSS with custom configuration
- Material Symbols Outlined icons
- Work Sans font family
- Dark mode support
- Responsive design patterns

---

## Appendix B: File Structure After Redesign

```
src/
├── app/
│   └── dashboard/
│       └── trees/
│           └── [treeId]/
│               ├── page.tsx                    # Minimal changes
│               └── TreeBoardContent.tsx        # Major refactor
├── components/
│   └── tree/
│       ├── TreeBoardHeader.tsx                 # Update view toggle
│       ├── FilterPanel.tsx                     # Add Quick Access
│       ├── TreeCanvas.tsx                      # Simplify
│       ├── TraditionalPersonNode.tsx           # Redesign
│       ├── FloatingControls.tsx                # Update styling
│       ├── MiniMap.tsx                         # Redesign
│       ├── SearchBar.tsx                       # Update placeholder
│       ├── OrthogonalEdge.tsx                  # Minor updates
│       ├── index.ts                            # Update exports
│       └── types.ts                            # Update types
│       # Removed:
│       # - PersonNode.flow.tsx
│       # - FamilyEdge.tsx
│       # - GenerationRow.tsx (evaluate)
│       # - NodeTooltip.tsx (evaluate)
├── lib/
│   └── tree-layout/
│       └── pedigree-orthogonal.ts              # Keep
│       # - pedigree.ts (keep for Fan Chart)
├── store/
│   └── treeBoardStore.ts                       # Update ViewMode
└── types/
    └── tree-layout.ts                          # Keep
```

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| Pedigree View | Traditional family tree layout showing ancestors and descendants |
| Fan Chart | Circular chart showing ancestors spreading outward |
| Orthogonal | Right-angle connection lines between nodes |
| Junction Node | Invisible node where parent lines merge before connecting to children |
| Quick Access | Sidebar section for quick navigation to family branches |
| Navigator | Mini-map showing overview of entire tree |
