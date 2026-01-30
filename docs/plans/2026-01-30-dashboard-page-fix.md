# Dashboard Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the dashboard 404 error and implement the full dashboard UI matching the design in `design/dashboard.html`, ensuring the register → sign in → dashboard flow works correctly.

**Architecture:** Move dashboard from route group `(dashboard)` to explicit `/dashboard` route, implement responsive dashboard with navbar, tree grid, sidebar widgets, and mobile navigation following existing component patterns.

**Tech Stack:** Next.js 16 App Router, React 19, React Query, Tailwind CSS v4, NextAuth v5

---

## Prerequisites

**Files to Read First:**
- `src/app/(dashboard)/page.tsx` - Current dashboard server component
- `src/app/(dashboard)/DashboardContent.tsx` - Current dashboard client component
- `src/components/dashboard/index.ts` - Existing dashboard components
- `design/dashboard.html` - Design reference (already read)
- `src/middleware.ts` - Auth middleware configuration
- `src/app/(auth)/register/page.tsx` - See how it redirects to dashboard

**Design Reference:** `design/dashboard.html` - Complete UI mockup with:
- Top navbar with logo, navigation, search, notifications, profile
- Main content area with greeting, "Create New Tree" button
- Tree grid with cards showing tree preview, name, member count, last updated
- DNA insights banner
- Right sidebar with invitations and activity timeline
- Mobile bottom navigation

---

## Task 1: Move Dashboard to `/dashboard` Route

**Problem:** Dashboard currently at `src/app/(dashboard)/page.tsx` maps to `/`, but register and middleware redirect to `/dashboard` causing 404.

**Files:**
- Move: `src/app/(dashboard)/page.tsx` → `src/app/dashboard/page.tsx`
- Move: `src/app/(dashboard)/DashboardContent.tsx` → `src/app/dashboard/DashboardContent.tsx`
- Modify: `src/app/dashboard/layout.tsx` - Create layout for dashboard section
- Delete: `src/app/(dashboard)/` directory after move

**Step 1: Create dashboard directory structure**

```bash
mkdir -p src/app/dashboard
```

Run: `ls -la src/app/`
Expected: `dashboard/` directory created

**Step 2: Move dashboard page**

Move from `src/app/(dashboard)/page.tsx` to `src/app/dashboard/page.tsx`.

**Step 3: Move DashboardContent component**

Move from `src/app/(dashboard)/DashboardContent.tsx` to `src/app/dashboard/DashboardContent.tsx`.

**Step 4: Create dashboard layout**

Create: `src/app/dashboard/layout.tsx`

```typescript
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
```

**Step 5: Update import in DashboardContent**

Update import path in `src/app/dashboard/DashboardContent.tsx`:

```typescript
// Change from:
import { TreeGrid, InvitationsWidget, ActivityTimeline, DNAInsightsBanner } from '@/components/dashboard';
// To (if needed, verify path is correct):
import { TreeGrid, InvitationsWidget, ActivityTimeline, DNAInsightsBanner } from '@/components/dashboard';
```

**Step 6: Test the route**

Run: `npm run dev`

Visit: `http://localhost:3000/dashboard`
Expected: Dashboard loads (or shows error if data issue, but no 404)

**Step 7: Clean up old directory**

```bash
rm -rf src/app/\(dashboard\)/
```

Run: `ls src/app/`
Expected: No `(dashboard)` directory

**Step 8: Commit**

```bash
git add src/app/
git add -A src/app/\(dashboard\)/ src/app/dashboard/
git commit -m "fix: move dashboard from route group to /dashboard route

- Move page.tsx and DashboardContent.tsx to /dashboard route
- Create dashboard layout
- Fix 404 error when accessing /dashboard
- Align with register and middleware redirect expectations"
```

---

## Task 2: Create Dashboard Navbar Component

**Files:**
- Create: `src/components/dashboard/DashboardNavbar.tsx`
- Modify: `src/app/dashboard/DashboardContent.tsx` - Add navbar to layout

**Step 1: Write the navbar component test**

```typescript
// src/components/dashboard/__tests__/DashboardNavbar.test.tsx
import { render, screen } from '@testing-library/react';
import { DashboardNavbar } from '../DashboardNavbar';

describe('DashboardNavbar', () => {
  it('renders logo and navigation links', () => {
    render(<DashboardNavbar userName="Sarah" />);
    expect(screen.getByText('AncestryHub')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Trees')).toBeInTheDocument();
  });

  it('renders user greeting', () => {
    render(<DashboardNavbar userName="Sarah" />);
    expect(screen.getByText('Welcome back, Sarah!')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- DashboardNavbar.test.tsx`
Expected: FAIL with "Cannot find module '../DashboardNavbar'"

**Step 3: Create navbar component**

Create: `src/components/dashboard/DashboardNavbar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { Plus, Search, Bell, Settings, Menu, Home, AccountTree, Person } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardNavbarProps {
  userName?: string;
}

export function DashboardNavbar({ userName }: DashboardNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Trees', href: '/trees', icon: AccountTree },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'DNA', href: '/dna', icon: null },
    { name: 'Help', href: '/help', icon: null },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-[#e7f1f3] dark:border-white/10">
      <div className="px-4 md:px-10 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 text-primary">
              <div className="w-8 h-8">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight text-[#0d191b] dark:text-white">
                AncestryHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    link.name === 'Dashboard'
                      ? 'text-primary border-b-2 border-primary pb-1'
                      : 'text-[#4c8d9a] hover:text-primary'
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search (desktop) */}
            <div className="hidden md:flex items-center bg-[#e7f1f3] dark:bg-white/10 rounded-xl h-10 px-3 min-w-[160px] max-w-[260px]">
              <Search className="w-5 h-5 text-[#4c8d9a]" />
              <input
                type="text"
                placeholder="Find ancestor..."
                className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a]"
              />
            </div>

            {/* Icon Buttons */}
            <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10 text-[#0d191b] dark:text-white hover:bg-primary/20">
              <Bell className="w-5 h-5" />
            </button>
            <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10 text-[#0d191b] dark:text-white hover:bg-primary/20">
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 ring-2 ring-primary/20" />

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#e7f1f3] dark:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#4c8d9a] hover:bg-[#e7f1f3] dark:hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon && <link.icon className="w-5 h-5" />}
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- DashboardNavbar.test.tsx`
Expected: PASS

**Step 5: Add to component exports**

Modify: `src/components/dashboard/index.ts`

```typescript
export { DashboardNavbar } from './DashboardNavbar';
// Keep existing exports...
```

**Step 6: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add dashboard navbar component

- Create responsive navbar with logo, navigation, search
- Support desktop and mobile views
- Match design from design/dashboard.html"
```

---

## Task 3: Update Dashboard Content Layout with Navbar and Greeting

**Files:**
- Modify: `src/app/dashboard/DashboardContent.tsx`

**Step 1: Read current DashboardContent**

Read: `src/app/dashboard/DashboardContent.tsx`
Note: Current structure and how it renders

**Step 2: Update DashboardContent to include navbar and greeting**

Modify: `src/app/dashboard/DashboardContent.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardNavbar } from '@/components/dashboard';
import { TreeGrid, InvitationsWidget, ActivityTimeline, DNAInsightsBanner, DashboardSkeleton } from '@/components/dashboard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';

interface DashboardContentProps {
  userId: string;
  userName?: string | null;
}

export function DashboardContent({ userId, userName }: DashboardContentProps) {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalMembers = dashboard?.trees?.reduce((sum: number, tree: any) => sum + (tree.memberCount || 0), 0) || 0;
  const treeCount = dashboard?.trees?.length || 0;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <DashboardNavbar userName={userName || undefined} />

      <main className="px-4 md:px-10 lg:px-40 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Section */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Greeting Section */}
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <h1 className="text-4xl font-black text-[#0d191b] dark:text-white tracking-tight">
                  Welcome back, {userName || 'User'}!
                </h1>
                <p className="text-base text-[#4c8d9a] mt-1">
                  You have {totalMembers.toLocaleString()} members across {treeCount} family trees.
                </p>
              </div>
              <Button className="bg-primary text-white shadow-lg shadow-primary/25">
                <Plus className="w-5 h-5" />
                Create New Tree
              </Button>
            </div>

            {/* Tree Grid */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-[#e7f1f3] dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[22px] font-bold text-[#0d191b] dark:text-white">
                  My Family Trees
                </h2>
                <button className="text-primary text-sm font-semibold hover:underline">
                  View All
                </button>
              </div>
              <TreeGrid trees={dashboard?.trees || []} limit={3} />
            </div>

            {/* DNA Insights Banner */}
            <DNAInsightsBanner />
          </div>

          {/* Right Section - Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <InvitationsWidget invitations={dashboard?.invitations || []} />
            <ActivityTimeline activities={dashboard?.recentActivity || []} />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-[#e7f1f3] dark:border-white/10 px-4 py-2 flex justify-around items-center z-50">
        <button className="flex flex-col items-center gap-1 text-primary">
          <Plus className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#4c8d9a]">
          <Plus className="w-6 h-6" />
          <span className="text-[10px] font-medium">Trees</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#4c8d9a]">
          <Plus className="w-6 h-6" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#4c8d9a]">
          <Plus className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Test in browser**

Run: `npm run dev`
Visit: `http://localhost:3000/dashboard`
Expected: See navbar with greeting, tree grid, sidebar

**Step 4: Commit**

```bash
git add src/app/dashboard/DashboardContent.tsx
git commit -m "feat: update dashboard layout with navbar and greeting

- Add DashboardNavbar component
- Add user greeting with member/tree count
- Update layout to match design dashboard.html
- Add mobile bottom navigation placeholder"
```

---

## Task 4: Update Tree Card Design to Match Mockup

**Files:**
- Modify: `src/components/dashboard/TreeGrid.tsx`
- Create: `src/components/dashboard/TreeCard.tsx` (new component)

**Step 1: Read current TreeGrid implementation**

Read: `src/components/dashboard/TreeGrid.tsx`
Note: Current tree card rendering

**Step 2: Write test for new TreeCard component**

```typescript
// src/components/dashboard/__tests__/TreeCard.test.tsx
import { render, screen } from '@testing-library/react';
import { TreeCard } from '../TreeCard';

describe('TreeCard', () => {
  const mockTree = {
    id: '1',
    name: 'The Miller Family',
    memberCount: 1420,
    lastModified: new Date('2024-01-15T10:00:00Z'),
    coverImage: 'https://example.com/image.jpg',
    isMain: true,
  };

  it('renders tree name and member count', () => {
    render(<TreeCard tree={mockTree} />);
    expect(screen.getByText('The Miller Family')).toBeInTheDocument();
    expect(screen.getByText(/1,420 members/)).toBeInTheDocument();
  });

  it('renders main badge when isMain is true', () => {
    render(<TreeCard tree={mockTree} />);
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('does not render main badge when isMain is false', () => {
    render(<TreeCard tree={{ ...mockTree, isMain: false }} />);
    expect(screen.queryByText('Main')).not.toBeInTheDocument();
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npm test -- TreeCard.test.tsx`
Expected: FAIL with "Cannot find module '../TreeCard'"

**Step 4: Create TreeCard component**

Create: `src/components/dashboard/TreeCard.tsx`

```typescript
'use client';

import Link from 'next/link';
import { Users, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeCardProps {
  tree: {
    id: string;
    name: string;
    memberCount: number;
    lastModified: Date;
    coverImage?: string;
    isMain?: boolean;
  };
}

export function TreeCard({ tree }: TreeCardProps) {
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `Yesterday`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Link href={`/trees/${tree.id}`} className="flex flex-col gap-3 group cursor-pointer">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-[1.02] bg-gradient-to-br from-primary/20 to-blue-500/20">
        {tree.coverImage ? (
          <div
            className="w-full h-full bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url("${tree.coverImage}")` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/40">
            <Users className="w-16 h-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {tree.isMain && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="bg-primary/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Main
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-base font-bold text-[#0d191b] dark:text-white group-hover:text-primary transition-colors">
          {tree.name}
        </p>
        <div className="flex items-center gap-3 text-[#4c8d9a] text-xs font-normal mt-1">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {tree.memberCount.toLocaleString()} members
          </span>
          <span className="flex items-center gap-1">
            <History className="w-3 h-3" />
            {formatTimeAgo(tree.lastModified)}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- TreeCard.test.tsx`
Expected: PASS

**Step 6: Update TreeGrid to use new TreeCard**

Modify: `src/components/dashboard/TreeGrid.tsx`

```typescript
'use client';

import { TreeCard } from './TreeCard';

interface TreeGridProps {
  trees: Array<{
    id: string;
    name: string;
    memberCount: number;
    lastModified: Date;
    coverImage?: string;
    isMain?: boolean;
  }>;
  limit?: number;
}

export function TreeGrid({ trees, limit }: TreeGridProps) {
  const displayTrees = limit ? trees.slice(0, limit) : trees;

  if (displayTrees.length === 0) {
    return (
      <div className="text-center py-12 text-[#4c8d9a]">
        <p>No family trees yet. Create your first tree to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {displayTrees.map((tree) => (
        <TreeCard key={tree.id} tree={tree} />
      ))}
    </div>
  );
}
```

**Step 7: Update exports**

Modify: `src/components/dashboard/index.ts`

```typescript
export { TreeCard } from './TreeCard';
export { TreeGrid } from './TreeGrid';
// Keep existing exports...
```

**Step 8: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: create new TreeCard component matching design

- Add TreeCard with cover image, main badge, member count
- Show time ago for last modified
- Hover effects matching design
- Update TreeGrid to use new TreeCard"
```

---

## Task 5: Update API Response to Include Required Fields

**Files:**
- Modify: `src/app/api/dashboard/route.ts`

**Step 1: Read current dashboard API**

Read: `src/app/api/dashboard/route.ts`
Note: What fields are currently returned

**Step 2: Write integration test for dashboard API**

Create: `tests/integration/api/dashboard.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mongoose } from 'mongoose';
import { buildApp } from '@/app';
import request from 'supertest';

describe('Dashboard API', () => {
  let mongoServer: MongoMemoryServer;
  let app: Express;
  let authToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = await buildApp();

    // Create test user and get auth token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password123!', name: 'Test User' });
    authToken = registerRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('GET /api/dashboard returns dashboard data with tree fields', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('trees');
    expect(res.body).toHaveProperty('invitations');
    expect(res.body).toHaveProperty('recentActivity');
    expect(res.body).toHaveProperty('dnaMatches');

    expect(Array.isArray(res.body.trees)).toBe(true);
  });
});
```

**Step 3: Run test to check current state**

Run: `npm test -- dashboard.test.ts`
Expected: May pass or fail depending on current implementation

**Step 4: Update dashboard API to include coverImage and isMain**

Modify: `src/app/api/dashboard/route.ts`

Ensure trees returned have:
```typescript
{
  id: tree._id.toString(),
  name: tree.name,
  memberCount: tree.memberCount || 0,
  lastModified: tree.updatedAt || tree.createdAt,
  coverImage: tree.coverImage, // Add this
  isMain: tree.isMain, // Add this
}
```

**Step 5: Run test to verify**

Run: `npm test -- dashboard.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/api/dashboard/
git add tests/integration/api/dashboard.test.ts
git commit -m "feat: update dashboard API to include coverImage and isMain

- Add coverImage field to tree response
- Add isMain field for main tree designation
- Add integration test for dashboard API"
```

---

## Task 6: Test Complete Auth Flow

**Files:**
- Test: Manual verification
- Create: `tests/e2e/auth-flow.spec.ts` (if needed)

**Step 1: Test registration flow**

Run: `npm run dev`

Actions in browser:
1. Visit `http://localhost:3000/register`
2. Fill form with email, password, name
3. Submit form
4. Expected: Redirect to `/dashboard`, see dashboard page

**Step 2: Test login flow**

Actions:
1. Logout if logged in
2. Visit `http://localhost:3000/login`
3. Login with registered credentials
4. Expected: Redirect to `/dashboard`

**Step 3: Test protected route**

Actions:
1. Logout
2. Visit `http://localhost:3000/dashboard` directly
3. Expected: Redirect to `/login`

**Step 4: Test dashboard loads**

Actions (while logged in):
1. Visit `http://localhost:3000/dashboard`
2. Check: No 404 error
3. Check: Navbar visible with "AncestryHub" logo
4. Check: Greeting shows user name
5. Check: "Create New Tree" button visible
6. Check: "My Family Trees" section visible

**Step 5: Create E2E test for auth flow**

Create: `tests/e2e/auth-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('register -> redirect to dashboard', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=AncestryHub')).toBeVisible();
  });

  test('login -> redirect to dashboard', async ({ page, context }) => {
    // First register a user
    const email = `test-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Logout
    await context.clearCookies();
    await page.goto('/login');

    // Login
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('unauthenticated redirect to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
```

**Step 6: Run E2E test**

Run: `npm run test:e2e`
Expected: PASS

**Step 7: Commit**

```bash
git add tests/e2e/auth-flow.spec.ts
git commit -m "test: add E2E tests for authentication flow

- Test registration to dashboard redirect
- Test login to dashboard redirect
- Test protected route redirect
- Verify dashboard loads successfully"
```

---

## Task 7: Verify Design Match

**Files:**
- Manual verification against `design/dashboard.html`

**Step 1: Compare navbar**

Check:
- [ ] Logo with AncestryHub text
- [ ] Navigation links (Dashboard, Trees, Search, DNA, Help)
- [ ] Search input on desktop
- [ ] Notification and settings icons
- [ ] Profile avatar
- [ ] Mobile menu button

**Step 2: Compare main content**

Check:
- [ ] Greeting "Welcome back, {userName}!"
- [ ] Member and tree count
- [ ] "Create New Tree" button
- [ ] "My Family Trees" section with "View All" link
- [ ] Tree cards with image, name, member count, time ago
- [ ] Main badge on primary tree

**Step 3: Compare sidebar**

Check:
- [ ] Invitations widget with icon
- [ ] Activity timeline with icons and timestamps
- [ ] DNA insights banner

**Step 4: Compare mobile**

Check:
- [ ] Bottom navigation bar on mobile
- [ ] Responsive grid layout

**Step 5: Create visual regression test (optional)**

If using Percy, Chromatic, or similar:
- Add screenshots of dashboard page
- Compare to design reference

**Step 6: Document any deviations**

Create: `docs/dashboard-deviations.md` (if any deviations exist)

List any intentional deviations from design with reasoning.

**Step 7: Commit**

```bash
git add docs/dashboard-deviations.md
git commit -m "docs: document dashboard design deviations

- List any intentional deviations from design/dashboard.html
- Provide reasoning for each deviation"
```

---

## Task 8: Fix Mobile Bottom Navigation Icons

**Files:**
- Modify: `src/app/dashboard/DashboardContent.tsx`

**Step 1: Update mobile bottom navigation with correct icons**

Modify: `src/app/dashboard/DashboardContent.tsx`

Replace the mobile bottom navigation section with:

```typescript
{/* Mobile Bottom Navigation */}
<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-[#e7f1f3] dark:border-white/10 px-4 py-2 flex justify-around items-center z-50">
  <Link href="/dashboard" className="flex flex-col items-center gap-1 text-primary">
    <Home className="w-6 h-6" />
    <span className="text-[10px] font-medium">Home</span>
  </Link>
  <Link href="/trees" className="flex flex-col items-center gap-1 text-[#4c8d9a]">
    <AccountTree className="w-6 h-6" />
    <span className="text-[10px] font-medium">Trees</span>
  </Link>
  <Link href="/search" className="flex flex-col items-center gap-1 text-[#4c8d9a]">
    <Search className="w-6 h-6" />
    <span className="text-[10px] font-medium">Search</span>
  </Link>
  <Link href="/profile" className="flex flex-col items-center gap-1 text-[#4c8d9a]">
    <Person className="w-6 h-6" />
    <span className="text-[10px] font-medium">Profile</span>
  </Link>
</div>
```

**Step 2: Add Link import if missing**

Make sure `Link` is imported from `next/link`.

**Step 3: Test on mobile viewport**

Run: `npm run dev`
Open DevTools, toggle mobile view
Check: Bottom navigation shows correct icons

**Step 4: Commit**

```bash
git add src/app/dashboard/DashboardContent.tsx
git commit -m "fix: use correct icons for mobile bottom navigation

- Replace Plus icons with correct lucide-react icons
- Add Link wrappers for navigation"
```

---

## Task 9: Final Integration Test

**Files:**
- Test: Manual verification
- Run: All tests

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 3: Manual smoke test**

Actions:
1. Clear browser data
2. Visit `/register`
3. Create new account
4. Verify redirect to `/dashboard`
5. Verify all elements visible
6. Logout
7. Visit `/login`
8. Login
9. Verify redirect to `/dashboard`
10. Check responsive behavior on mobile

**Step 4: Check for console errors**

Open browser DevTools
Check: No console errors on dashboard page

**Step 5: Verify API responses**

Check Network tab:
- `/api/dashboard` returns 200
- Response includes trees, invitations, recentActivity

**Step 6: Create final verification checklist**

Create: `docs/plans/tasks/task-28-dashboard-page-verification.md`

```markdown
# Dashboard Page Verification Checklist

## Route Access
- [ ] `/dashboard` loads without 404
- [ ] Unauthenticated users redirected to `/login`
- [ ] Authenticated users can access `/dashboard`

## Registration Flow
- [ ] Register redirects to `/dashboard`
- [ ] User name displays correctly in greeting

## Login Flow
- [ ] Login redirects to `/dashboard`
- [ ] Session persists on navigation

## UI Elements
- [ ] Navbar with logo visible
- [ ] Navigation links work
- [ ] Search input visible on desktop
- [ ] "Create New Tree" button visible
- [ ] Tree grid displays
- [ ] Sidebar widgets display
- [ ] Mobile bottom navigation visible on small screens

## Data Display
- [ ] Member count accurate
- [ ] Tree count accurate
- [ ] Tree cards show correct data
- [ ] Activity timeline shows recent activity

## Responsive Design
- [ ] Desktop layout correct (12-column grid)
- [ ] Tablet layout works
- [ ] Mobile layout works with bottom nav
```

**Step 7: Commit**

```bash
git add docs/plans/tasks/task-28-dashboard-page-verification.md
git commit -m "docs: add dashboard page verification checklist

- Comprehensive checklist for dashboard functionality
- Covers routes, auth flow, UI, data, responsive design"
```

---

## Final Verification

**Before marking complete:**

1. **All tests pass**: `npm test`
2. **E2E tests pass**: `npm run test:e2e`
3. **No 404 on `/dashboard`**
4. **Register → Dashboard flow works**
5. **Login → Dashboard flow works**
6. **Design matches `design/dashboard.html`**

**Summary of Changes:**
- Moved dashboard from `(dashboard)` route group to `/dashboard` route
- Created DashboardNavbar component
- Updated DashboardContent layout
- Created TreeCard component with design matching
- Updated dashboard API response fields
- Added E2E tests for auth flow
- Added verification checklist
