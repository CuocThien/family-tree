# Task 20: Create Dashboard Page

**Phase:** 12 - Pages
**Priority:** High
**Dependencies:** Task 16 (UI), Task 17 (Stores), Task 15 (API)
**Estimated Complexity:** Medium

---

## Objective

Implement the main Dashboard page based on `design/dashboard.html`, showing user's family trees, recent activity, invitations, and DNA insights.

---

## Design Analysis

### Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                       │
│  [Logo] [Dashboard] [Trees] [Search] [DNA] [Help]  [Search] [Icons] [Avatar] │
├──────────────────────────────────────────┬─────────────────┤
│            Main Content (8 cols)         │  Sidebar (4 cols) │
│  ┌────────────────────────────────────┐  │  ┌─────────────┐ │
│  │ Welcome back, {Name}!              │  │  │ Invitations │ │
│  │ You have X members across Y trees  │  │  └─────────────┘ │
│  │                      [Create Tree] │  │  ┌─────────────┐ │
│  └────────────────────────────────────┘  │  │   Recent    │ │
│  ┌────────────────────────────────────┐  │  │  Activity   │ │
│  │        My Family Trees             │  │  │             │ │
│  │  [Tree1] [Tree2] [Tree3]           │  │  └─────────────┘ │
│  └────────────────────────────────────┘  │                   │
│  ┌────────────────────────────────────┐  │                   │
│  │      DNA Insights Banner           │  │                   │
│  └────────────────────────────────────┘  │                   │
├──────────────────────────────────────────┴─────────────────┤
│                 Mobile Bottom Nav (mobile only)             │
└────────────────────────────────────────────────────────────┘
```

### Components Identified

| Component | Description |
|-----------|-------------|
| TopNavBar | Logo, nav links, search, icons, avatar |
| PageHeading | Welcome message with stats and CTA |
| TreeGrid | Grid of TreeCard components |
| InvitationsWidget | Pending collaboration invites |
| ActivityTimeline | Recent changes timeline |
| DNAInsightsBanner | Promotional/info banner |
| MobileBottomNav | Mobile navigation (lg:hidden) |

---

## Implementation Specification

**File:** `src/app/(dashboard)/page.tsx`

```typescript
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardContent } from './DashboardContent';
import { DashboardSkeleton } from './DashboardSkeleton';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent user={session.user} />
    </Suspense>
  );
}
```

**File:** `src/app/(dashboard)/DashboardContent.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { TreeGrid } from '@/components/tree/TreeGrid';
import { InvitationsWidget } from '@/components/dashboard/InvitationsWidget';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { DNAInsightsBanner } from '@/components/dashboard/DNAInsightsBanner';
import { PageHeading } from '@/components/shared/PageHeading';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardContentProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', user.id],
    queryFn: () => fetch('/api/dashboard').then((res) => res.json()),
  });

  if (isLoading) return <DashboardSkeleton />;

  const totalMembers = dashboard.trees.reduce(
    (sum: number, tree: any) => sum + tree.memberCount,
    0
  );

  return (
    <main className="flex-1 px-4 md:px-10 lg:px-40 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Page Heading */}
          <PageHeading
            title={`Welcome back, ${user.name?.split(' ')[0]}!`}
            subtitle={`You have ${totalMembers.toLocaleString()} members across ${dashboard.trees.length} family trees.`}
            action={
              <Button
                onClick={() => router.push('/trees/new')}
                leftIcon={<Plus size={18} />}
              >
                Create New Tree
              </Button>
            }
          />

          {/* Tree Grid */}
          <section className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-[#e7f1f3] dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[22px] font-bold">My Family Trees</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/trees')}>
                View All
              </Button>
            </div>
            <TreeGrid trees={dashboard.trees} limit={3} />
          </section>

          {/* DNA Banner */}
          {dashboard.dnaMatches > 0 && (
            <DNAInsightsBanner matchCount={dashboard.dnaMatches} />
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <InvitationsWidget invitations={dashboard.invitations} />
          <ActivityTimeline activities={dashboard.recentActivity} />
        </aside>
      </div>
    </main>
  );
}
```

---

## Components to Create

### 1. TreeGrid Component

**File:** `src/components/tree/TreeGrid.tsx`

```typescript
interface TreeGridProps {
  trees: ITree[];
  limit?: number;
  emptyState?: React.ReactNode;
}

export function TreeGrid({ trees, limit, emptyState }: TreeGridProps) {
  const displayTrees = limit ? trees.slice(0, limit) : trees;

  if (trees.length === 0) {
    return emptyState || <EmptyTreeState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {displayTrees.map((tree) => (
        <TreeCard key={tree._id} tree={tree} />
      ))}
    </div>
  );
}
```

### 2. InvitationsWidget Component

**File:** `src/components/dashboard/InvitationsWidget.tsx`

```typescript
interface Invitation {
  id: string;
  treeName: string;
  inviterName: string;
  inviterAvatar: string;
  createdAt: Date;
}

interface InvitationsWidgetProps {
  invitations: Invitation[];
}

export function InvitationsWidget({ invitations }: InvitationsWidgetProps) {
  if (invitations.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Mail className="text-primary" size={20} />
        <h3 className="font-bold text-lg">Invitations</h3>
      </div>
      <div className="flex flex-col gap-4">
        {invitations.map((invite) => (
          <InvitationItem key={invite.id} invitation={invite} />
        ))}
      </div>
    </Card>
  );
}
```

### 3. ActivityTimeline Component

**File:** `src/components/dashboard/ActivityTimeline.tsx`

Based on design with timeline dots and connecting lines:

```typescript
interface Activity {
  id: string;
  type: 'photo' | 'person' | 'document' | 'edit';
  title: string;
  description: string;
  timestamp: Date;
  thumbnails?: string[];
}

const activityIcons = {
  photo: AddAPhoto,
  person: PersonAdd,
  document: Description,
  edit: Edit,
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <Card>
      <h3 className="font-bold text-lg mb-5">Recent Activity</h3>
      <div className="flex flex-col gap-6 relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-[#e7f1f3] dark:bg-white/10" />

        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
      <Button variant="outline" className="w-full mt-5">
        Show More Activity
      </Button>
    </Card>
  );
}
```

### 4. DNAInsightsBanner Component

**File:** `src/components/dashboard/DNAInsightsBanner.tsx`

```typescript
export function DNAInsightsBanner({ matchCount }: { matchCount: number }) {
  return (
    <div className="bg-gradient-to-r from-primary to-[#00b4db] rounded-2xl p-6 text-white flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold">New DNA matches found</h3>
        <p className="text-white/80 text-sm">
          You have {matchCount} potential relatives matching your DNA profile.
        </p>
      </div>
      <Button
        variant="secondary"
        className="bg-white text-primary hover:bg-white/90"
      >
        Review Matches
      </Button>
    </div>
  );
}
```

---

## UX Improvements

| Original Design | Improvement | Rationale |
|-----------------|-------------|-----------|
| Static tree count | Animated counter | Delight |
| No empty state | "Create your first tree" CTA | Onboarding |
| No loading state | Skeleton loaders | Perceived performance |
| No error state | Retry button with message | Recovery |
| Fixed invitation count | Badge with count | Visibility |
| Basic activity list | Collapsible with "Show more" | Reduce clutter |

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| No trees | Show empty state with CTA |
| No invitations | Hide widget entirely |
| No activity | Show "No recent activity" |
| Long tree name | Truncate with ellipsis |
| Many invitations | Show count badge, max 5 |
| API failure | Show error with retry |
| Slow loading | Progressive skeleton |
| Mobile viewport | Stack layout, hide sidebar |

---

## Responsive Breakpoints

```typescript
const layout = {
  mobile: {
    sidebar: 'hidden',
    treeGrid: 'grid-cols-1',
    padding: 'px-4',
  },
  tablet: {
    sidebar: 'hidden',
    treeGrid: 'grid-cols-2',
    padding: 'px-10',
  },
  desktop: {
    sidebar: 'lg:col-span-4',
    treeGrid: 'xl:grid-cols-3',
    padding: 'lg:px-40',
  },
};
```

---

## API Requirements

**GET /api/dashboard**

Response:
```typescript
interface DashboardResponse {
  trees: Array<{
    _id: string;
    name: string;
    memberCount: number;
    lastUpdated: Date;
    coverImage?: string;
    isMain?: boolean;
  }>;
  invitations: Array<{
    id: string;
    treeName: string;
    inviterName: string;
    inviterAvatar: string;
    createdAt: Date;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    thumbnails?: string[];
  }>;
  dnaMatches: number;
}
```

---

## Acceptance Criteria

- [ ] Dashboard displays user's trees
- [ ] Tree cards are clickable to navigate
- [ ] "Create New Tree" button works
- [ ] Invitations widget shows pending invites
- [ ] Accept/Decline invitation works
- [ ] Activity timeline shows recent changes
- [ ] DNA banner displays (when applicable)
- [ ] Mobile responsive layout
- [ ] Loading skeletons display
- [ ] Error states handled
- [ ] Empty states implemented
- [ ] Dark mode support
