# Bug Report: TreeCanvas next-themes Import Error

## Bug Information

**Bug ID:** QC-2025-02-04-001
**Severity:** CRITICAL
**Priority:** P0 - Blocks all testing and deployment
**Status:** OPEN
**Discovered By:** QC Agent
**Discovered Date:** 2025-02-04

---

## Summary

The `TreeCanvas.tsx` component imports `useTheme` from `next-themes` package, which is not installed in the project. This causes a complete build failure, preventing any testing of the tree detail page UI/UX fixes.

---

## Affected Component

**File:** `src/components/tree/TreeCanvas.tsx`
**Lines:** 20, 42
**Component:** `TreeCanvas`

---

## Steps to Reproduce

1. Run `npm run build`
2. Observe the build error

**Expected:** Build succeeds
**Actual:** Build fails with "Module not found: Can't resolve 'next-themes'"

---

## Error Details

```
Error: Turbopack build failed with 1 errors:
./Project/family-tree/src/components/tree/TreeCanvas.tsx:20:1
Module not found: Can't resolve 'next-themes'

Import traces:
  Client Component Browser:
    ./Project/family-tree/src/components/tree/TreeCanvas.tsx [Client Component Browser]
    ./Project/family-tree/src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx [Client Component Browser]
    ./Project/family-tree/src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx [Server Component]
    ./Project/family-tree/src/app/dashboard/trees/[treeId]/page.tsx [Server Component]
```

---

## Root Cause

The SE agent mistakenly used `next-themes` instead of the project's existing theme system:

1. The project does NOT have `next-themes` in `package.json` dependencies
2. The project has a custom theme system at `src/store/preferencesStore.ts`
3. The project has a `useThemeEffect()` hook in `preferencesStore.ts` for theme management

---

## Current Code

### Line 20 - Import Statement
```typescript
import { useTheme } from 'next-themes';
```

### Line 42 - Usage
```typescript
const { theme } = useTheme();
```

---

## Recommended Fix

### Option 1: Use Existing Theme System (Recommended)

The project already has a complete theme system using Zustand. Use that instead:

```typescript
// In TreeCanvas.tsx

// REMOVE line 20:
import { useTheme } from 'next-themes';

// ADD:
import { useEffect, useState } from 'react';

// In component (replace lines 42-64):
const theme = usePreferencesStore((state) => state.theme);
const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

useEffect(() => {
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    setResolvedTheme(systemTheme);
  } else {
    setResolvedTheme(theme as 'light' | 'dark');
  }
}, [theme]);

// Update the backgroundColor useMemo:
const backgroundColor = useMemo(
  () => (resolvedTheme === 'dark' ? '#2d3a3c' : '#d1d5db'),
  [resolvedTheme]
);
```

### Option 2: Install and Configure next-themes (Alternative)

If you prefer to use `next-themes`:

1. Install the package:
```bash
npm install next-themes
```

2. Create a theme provider at `src/components/providers/ThemeProvider.tsx`:
```typescript
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

3. Update `src/components/providers/Providers.tsx` to include ThemeProvider

4. Update `src/app/layout.tsx` to pass theme props

---

## Impact

- **Build:** FAILS - Cannot build production bundle
- **Development:** FAILS - Cannot run dev server
- **Testing:** BLOCKED - Cannot test any UI/UX fixes
- **Deployment:** BLOCKED - Cannot deploy

---

## Verification Steps

After implementing the fix:

1. Run `npm run build` - Should succeed
2. Run `npm run dev` - Should start successfully
3. Navigate to tree detail page
4. Test light mode - Canvas grid should be visible (#d1d5db)
5. Test dark mode - Canvas grid should be visible (#2d3a3c)
6. Test theme switching - Grid color should update immediately

---

## Related Files

- `src/components/tree/TreeCanvas.tsx` - File with the error
- `src/store/preferencesStore.ts` - Existing theme system
- `src/components/providers/Providers.tsx` - App providers
- `src/app/layout.tsx` - Root layout

---

## Notes

- The static analysis shows that all OTHER components (TreeBoardHeader, FilterPanel, FloatingControls, PersonNode, MiniMap, NodeTooltip, TreeBoardContent) appear to be correctly implemented with semantic Tailwind classes
- The Tailwind v4 setup with `@theme inline` in `globals.css` is correct
- Only the `next-themes` import in `TreeCanvas.tsx` needs fixing

---

## Reporter

**QC Agent:** Claude Code QC
**Report Date:** 2025-02-04
**Bug Report Location:** `.qc-reports/bug-report-tree-canvas-next-themes.md`
