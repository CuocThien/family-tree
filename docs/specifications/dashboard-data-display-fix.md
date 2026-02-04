# Dashboard Data Display Fix - Technical Specification

## Issue Description
The dashboard API (`/api/dashboard`) successfully returns data including `trees`, `summary`, and `recentActivity`, but the dashboard page does not display the data correctly.

## Root Cause Analysis

### Problem 1: Field Name Mismatch
- API response returns trees with `id` field (string)
- `TreeGrid` component expects `_id` field (ITree interface)
- Location: `DashboardContent.tsx:161-164` maps trees but doesn't convert `id` to `_id`

### Problem 2: Activity Data Structure Mismatch
- API returns activity objects with `id`, `action`, `timestamp`
- `ActivityTimeline` component expects `id`, `type`, `title`, `description`, `timestamp`
- Missing fields: `type`, `title`, `description`
- Location: `DashboardContent.tsx:184-189`

### Problem 3: Invitation Data Structure Mismatch
- API returns invitation objects with `id`, `treeId`, `treeName`, `invitedBy`, `createdAt`, `expiresAt`
- `InvitationsWidget` expects `id`, `treeName`, `inviterName`, `inviterAvatar`, `inviteEmail`, `permission`, `status`, `createdAt`, `expiresAt`
- Missing fields: `inviterName`, `inviterAvatar`, `inviteEmail`, `permission`, `status`
- Location: `DashboardContent.tsx:177-182`

## Acceptance Criteria

1. **Trees Display**
   - All trees from API should be displayed in the tree grid
   - Each tree card should show correct name, member count, and last updated time
   - Empty state should show when no trees exist

2. **Summary Display**
   - Summary stats (totalTrees, totalMembers, totalMedia) should be calculated correctly
   - Stats should display in the welcome message

3. **Recent Activity Display**
   - Activity timeline should show recent activities
   - Each activity should display proper type, title, and description
   - Empty state should show when no activity exists

4. **Invitations Display**
   - Pending invitations should be displayed
   - Each invitation should show proper inviter info and permission level
   - Widget should be hidden when no invitations exist

## Implementation Plan

### Option A: Fix in DashboardContent (Recommended)
Map API response data to match component prop interfaces in `DashboardContent.tsx`

**Pros:**
- Minimal changes
- Keeps API response consistent
- Easy to test

**Cons:**
- Mapping logic in component layer

### Option B: Fix API Response
Modify API to return data structure matching component interfaces

**Pros:**
- No mapping needed in components
- Single source of truth

**Cons:**
- API structure change
- May affect other consumers

### Chosen Approach: Option A
Fix data mapping in `DashboardContent.tsx` to transform API response to match component interfaces.

## Technical Changes

### File: `src/app/dashboard/DashboardContent.tsx`

#### Change 1: Fix Tree Data Mapping
```typescript
// Line 160-166
const displayTrees = trees.map((tree: TreeWithStats) => ({
  _id: tree.id,  // Map 'id' to '_id'
  name: tree.name,
  description: '',
  ownerId: userId,
  rootPersonId: undefined,
  collaborators: [],
  settings: {
    isPublic: false,
    allowComments: true,
    defaultPhotoQuality: 'medium' as const,
    language: 'en',
  },
  privacy: 'private' as const,
  coverImage: tree.coverImage,
  isMain: tree.isMain,
  createdAt: new Date(tree.createdAt),
  updatedAt: new Date(tree.updatedAt),
  memberCount: tree.memberCount,
  lastUpdated: new Date(tree.updatedAt),
}));
```

#### Change 2: Fix Activity Data Mapping
```typescript
// Line 184-189
const mappedActivities = (dashboard.recentActivity || []).map((activity: any) => {
  // Map audit log action to activity type
  const typeMap: Record<string, Activity['type']> = {
    'person.created': 'person',
    'person.updated': 'edit',
    'tree.created': 'edit',
    'photo.uploaded': 'photo',
    'document.uploaded': 'document',
  };

  const defaultType = 'edit' as Activity['type'];
  const type = typeMap[activity.action] || defaultType;

  return {
    id: activity.id,
    type,
    title: formatActivityTitle(activity.action),
    description: formatActivityDescription(activity.action, activity.details),
    timestamp: new Date(activity.timestamp),
  };
});
```

#### Change 3: Fix Invitation Data Mapping
```typescript
// Line 177-182
const mappedInvitations = (dashboard.invitations || []).map((inv: any) => ({
  id: inv.id,
  treeName: inv.treeName,
  inviterName: inv.invitedBy || 'Someone',
  inviterAvatar: undefined,
  inviteEmail: '',
  permission: 'editor' as const,
  status: 'pending' as const,
  createdAt: new Date(inv.createdAt),
  expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : undefined,
}));
```

### Helper Functions

```typescript
function formatActivityTitle(action: string): string {
  const titles: Record<string, string> = {
    'person.created': 'Person Added',
    'person.updated': 'Person Updated',
    'tree.created': 'Tree Created',
    'photo.uploaded': 'Photo Uploaded',
    'document.uploaded': 'Document Uploaded',
  };
  return titles[action] || 'Activity';
}

function formatActivityDescription(action: string, details?: any): string {
  const descriptions: Record<string, string> = {
    'person.created': 'A new person was added to the family tree.',
    'person.updated': 'Person details were updated.',
    'tree.created': 'A new family tree was created.',
    'photo.uploaded': 'A photo was uploaded.',
    'document.uploaded': 'A document was uploaded.',
  };
  return descriptions[action] || '';
}
```

## Testing Requirements

### Unit Tests
- Test tree data mapping function
- Test activity data mapping function
- Test invitation data mapping function

### Integration Tests
- Test dashboard API returns correct structure
- Test DashboardContent renders with mapped data

### E2E Tests
- Navigate to dashboard page
- Verify trees are displayed
- Verify summary stats are correct
- Verify activity timeline shows (if data exists)
- Verify invitations widget shows (if data exists)

## Architecture Compliance

- [x] Single Responsibility: Each mapping function has one purpose
- [x] Open/Closed: Easy to add new activity types without modifying existing logic
- [x] Liskov Substitution: Mapped objects satisfy component interfaces
- [x] Interface Segregation: Component interfaces remain focused
- [x] Dependency Inversion: Components depend on abstractions (interfaces)

## Files to Modify

1. `src/app/dashboard/DashboardContent.tsx` - Add data mapping logic
2. `src/app/dashboard/DashboardContent.test.tsx` - Add tests (if exists)
3. `tests/integration/dashboard.spec.ts` - Add integration tests (if exists)

## Success Metrics

- All trees display correctly
- Summary statistics accurate
- Activity timeline renders (when data exists)
- No console errors
- All tests passing
