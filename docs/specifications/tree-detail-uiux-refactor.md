# Tree Detail Page UI/UX Refactoring Specification

## Requirement
Review and refactor UI/UX for tree detail page. The UI/UX is inconsistent across light and dark themes, causing visual issues.

## Analysis Summary

After thorough analysis of the tree detail page implementation, the following UI/UX issues have been identified:

### 1. Inconsistent Color System

**Problem:**
- Hardcoded colors mixed with Tailwind classes
- Some components use custom hex colors (`#0d191b`, `#13c8ec`, `#4c8d9a`, `#e7f1f3`) while others use semantic class names
- Inconsistent dark mode border colors: `dark:border-[#1e2f32]` vs `dark:border-white/10`

**Affected Files:**
- `src/components/tree/TreeBoardHeader.tsx:18,42,52`
- `src/components/tree/FilterPanel.tsx:29,41,53,65,75`
- `src/components/tree/FloatingControls.tsx:51,53,56,90,93`
- `src/components/tree/PersonNode.flow.tsx:37,46,61,74`
- `src/components/tree/MiniMap.tsx:10,36`
- `src/components/tree/NodeTooltip.tsx:50,142`
- `src/components/tree/TreeCanvas.tsx:55,72`

### 2. Mixed Background Color Approaches

**Problem:**
- `bg-background-light` and `bg-background-dark` used but not defined in Tailwind config
- Inconsistent background implementations across components
- TreeBoardContent uses `bg-background-light dark:bg-background-dark` for canvas
- TreeCanvas uses `bg-[#f8fafc] dark:bg-[#0f172a]` for the same area

**Affected Files:**
- `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx:122`
- `src/components/tree/TreeCanvas.tsx:55`
- `src/components/tree/FilterPanel.tsx:29,41,45`
- `src/components/tree/FloatingControls.tsx:51,56,66`

### 3. Inconsistent Dark Mode Colors

**Problem:**
- Multiple dark background colors used: `#0a0a0a`, `#0f172a`, `#101f22`, `#1e2f32`, `#2d3a3c`
- No clear hierarchy for dark mode surfaces
- Some borders use `#1e2f32`, others use `#2d3a3c` or `white/10`
- Dark mode background for cards uses `#1e2f32` but some areas use `#0f172a`

**Affected Files:**
- All component files

### 4. Form Elements Missing Dark Mode Styling

**Problem:**
- Checkboxes in FilterPanel use `form-checkbox` but no custom dark mode styling
- Radio buttons use `form-radio` but no custom dark mode styling
- Default browser form elements don't adapt to theme

**Affected Files:**
- `src/components/tree/FilterPanel.tsx:82-111`

### 5. Missing Tailwind Color Definitions

**Problem:**
- Custom colors used in components but not defined in `tailwind.config.ts`
- Colors like `#0d191b`, `#13c8ec`, `#4c8d9a`, `#e7f1f3` used directly
- No centralized color management

### 6. Canvas Grid Background Issues

**Problem:**
- `canvas-grid` class referenced but not defined in CSS
- Background component in TreeCanvas uses fixed color `#d1d5db` for grid

**Affected Files:**
- `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx:122`
- `src/components/tree/TreeCanvas.tsx:71`

### 7. ReactFlow Controls Not Dark Mode Aware

**Problem:**
- ReactFlow Controls and MiniMap have hardcoded white background
- `!bg-white/90` used in minimapClassName overrides dark mode
- Background grid color doesn't change in dark mode

**Affected Files:**
- `src/components/tree/TreeCanvas.tsx:49-77`

## Proposed Solutions

### 1. Centralized Color System

Create a semantic color system in `tailwind.config.ts`:

```javascript
colors: {
  background: {
    DEFAULT: 'var(--background)',
    light: '#f8fafc',
    dark: '#0f172a',
  },
  foreground: {
    DEFAULT: 'var(--foreground)',
    muted: '#64748b',
  },
  primary: {
    DEFAULT: '#13c8ec',
    dark: '#0d191b',
  },
  secondary: '#4c8d9a',
  border: {
    DEFAULT: '#e7f1f3',
    dark: '#2d3a3c',
  },
  surface: {
    DEFAULT: '#ffffff',
    dark: '#1e2f32',
    darker: '#101f22',
  },
}
```

### 2. Update globals.css with Extended Theme Variables

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --surface: #ffffff;
  --surface-elevated: #f8fafc;
  --border: #e7f1f3;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --surface: #1e2f32;
    --surface-elevated: #101f22;
    --border: #2d3a3c;
  }
}
```

### 3. Fix All Component Styling

**Files to Modify:**

1. **TreeBoardHeader.tsx** (Line 18, 42)
   - Replace hardcoded borders with semantic classes
   - Fix: `border-border dark:border-border`

2. **FilterPanel.tsx** (Lines 29, 41, 53, 65, 75, 82-111)
   - Replace `bg-background-light` with `bg-surface-elevated dark:bg-surface-elevated`
   - Fix form element dark mode styling
   - Replace hardcoded borders

3. **FloatingControls.tsx** (Lines 51, 53, 56, 90, 93)
   - Fix background class for dark mode
   - Replace hardcoded borders

4. **PersonNode.flow.tsx** (Lines 37, 46, 61, 74)
   - Fix handle borders for dark mode
   - Fix name label background

5. **TreeCanvas.tsx** (Lines 49-77)
   - Make Controls and MiniMap dark mode aware
   - Update background grid color for dark mode

6. **MiniMap.tsx** (Line 10, 36)
   - Fix background and border classes

7. **NodeTooltip.tsx** (Lines 50, 142)
   - Fix arrow color to match tooltip background

8. **TreeBoardContent.tsx** (Line 122)
   - Remove undefined `canvas-grid` class

## Implementation Plan

### Phase 1: Foundation
1. Update `tailwind.config.ts` with semantic color system
2. Update `globals.css` with CSS variables for dark mode

### Phase 2: Component Updates
1. Fix TreeBoardHeader.tsx
2. Fix FilterPanel.tsx
3. Fix FloatingControls.tsx
4. Fix PersonNode.flow.tsx
5. Fix TreeCanvas.tsx
6. Fix MiniMap.tsx
7. Fix NodeTooltip.tsx
8. Fix TreeBoardContent.tsx

### Phase 3: Testing
1. Test in light mode
2. Test in dark mode
3. Test theme switching
4. Verify all components render correctly

## Acceptance Criteria

- [ ] All hardcoded colors replaced with semantic Tailwind classes
- [ ] Consistent color system across all components
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] Theme switching works smoothly
- [ ] Form elements (checkboxes, radio buttons) work in both themes
- [ ] ReactFlow Controls and MiniMap adapt to theme
- [ ] No undefined CSS classes
- [ ] Canvas background grid visible in both themes

## Technical Notes

- Use Tailwind's `dark:` prefix for all dark mode styles
- Ensure `useThemeEffect()` hook is called in app layout
- Test both manual theme selection and system preference
- Verify contrast ratios meet accessibility standards (WCAG AA)

## Files to Modify

1. `src/app/globals.css` - Add CSS variables
2. `tailwind.config.ts` - Add semantic colors
3. `src/components/tree/TreeBoardHeader.tsx` - Fix borders and backgrounds
4. `src/components/tree/FilterPanel.tsx` - Fix backgrounds and form elements
5. `src/components/tree/FloatingControls.tsx` - Fix backgrounds
6. `src/components/tree/PersonNode.flow.tsx` - Fix handle and label styling
7. `src/components/tree/TreeCanvas.tsx` - Fix ReactFlow components for dark mode
8. `src/components/tree/MiniMap.tsx` - Fix backgrounds and borders
9. `src/components/tree/NodeTooltip.tsx` - Fix arrow color
10. `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` - Remove undefined class

## Risk Assessment

**Low Risk:**
- Changes are mostly CSS/class name updates
- No business logic changes
- No data structure changes

**Mitigation:**
- Test thoroughly in both light and dark modes
- Ensure theme switching doesn't cause visual glitches
