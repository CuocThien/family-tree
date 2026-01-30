# Task 28: Dashboard Page Fix and Implementation

**Status:** Pending
**Priority:** High
**Link:** [Full Implementation Plan](../2026-01-30-dashboard-page-fix.md)

## Problem Statement

- Accessing `http://localhost:3000/dashboard` returns 404 error
- Dashboard UI needs to match design in `design/dashboard.html`
- Need to ensure register → sign in → dashboard flow works correctly

## Root Cause

Dashboard is currently implemented in `src/app/(dashboard)/page.tsx` which maps to `/` (root) due to Next.js route group naming, but the application expects it at `/dashboard`:
- Register page redirects to `/dashboard` after registration
- Middleware redirects authenticated users to `/dashboard`
- Navbar links point to `/dashboard`

## Solution Overview

Move dashboard from route group `(dashboard)` to explicit `/dashboard` route and implement full dashboard UI matching the design.

## Implementation Plan

See [Full Implementation Plan](../2026-01-30-dashboard-page-fix.md) for detailed step-by-step instructions.

## Tasks Breakdown

1. **Move Dashboard to `/dashboard` Route** - Fix 404 error
2. **Create Dashboard Navbar Component** - Implement responsive navbar
3. **Update Dashboard Content Layout** - Add navbar and greeting
4. **Update Tree Card Design** - Match design mockup
5. **Update API Response** - Include required fields (coverImage, isMain)
6. **Test Complete Auth Flow** - Verify register/login → dashboard
7. **Verify Design Match** - Compare against design/dashboard.html
8. **Fix Mobile Bottom Navigation** - Correct icons
9. **Final Integration Test** - Comprehensive testing

## Acceptance Criteria

- [ ] `/dashboard` loads without 404 error
- [ ] Unauthenticated users redirected to `/login`
- [ ] Registration redirects to `/dashboard` successfully
- [ ] Login redirects to `/dashboard` successfully
- [ ] Navbar displays correctly with logo and navigation
- [ ] Tree grid displays trees with cover images and stats
- [ ] Mobile bottom navigation works on small screens
- [ ] All tests pass (unit, integration, E2E)
- [ ] Design matches `design/dashboard.html`

## Related Files

- `src/app/(dashboard)/page.tsx` → `src/app/dashboard/page.tsx`
- `src/app/(dashboard)/DashboardContent.tsx` → `src/app/dashboard/DashboardContent.tsx`
- `src/components/dashboard/DashboardNavbar.tsx` (new)
- `src/components/dashboard/TreeCard.tsx` (new)
- `src/app/api/dashboard/route.ts`
- `src/middleware.ts`
- `design/dashboard.html`
