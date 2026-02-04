# Specification: Dashboard Data Rendering Fix

## Requirement
The dashboard page at `/dashboard` is not rendering data returned from the API endpoint `/api/dashboard`. The API returns valid data, but the frontend component is not properly mapping the response structure.

## Current State

### API Response Structure (`/api/dashboard`)
```json
{
  "data": {
    "trees": [...],
    "invitations": [],
    "recentActivity": [
      {
        "_id": "6981b7a3696a68b0b6a9a8e0",
        "treeId": "6981b778696a68b0b6a9a8c1",
        "userId": "697b3b1c8a5ad894d279099d",
        "action": "create",
        "entityType": "Person",
        "entityId": "6981b7a3696a68b0b6a9a8de",
        "changes": [],
        "timestamp": "2026-02-03T08:53:55.653Z"
      }
    ],
    "dnaMatches": 0,
    "summary": {...}
  }
}
```

### DashboardContent Expected Interfaces
```typescript
interface ApiActivity {
  id: string;
  action: string;  // expects "person.created", "tree.created", etc.
  timestamp: Date | string;
  details?: Record<string, unknown>;
}
```

## Root Cause Analysis

1. **Activity Mapping Mismatch**:
   - API returns: `action` = "create", `entityType` = "Person"
   - Component expects: `action` = "person.created"
   - API returns: `_id`, component expects: `id`

2. **Invitation Structure**: Need to verify the actual structure returned by the collaboration service

## Implementation Plan

### Step 1: Fix Activity Data Mapping
Update `DashboardContent.tsx` to properly map the API response:
- Use `_id` as `id`
- Combine `entityType` + `action` to format activity actions (e.g., "Person" + "create" = "person.created")
- Update formatActivityTitle and formatActivityDescription to handle new format

### Step 2: Verify Invitation Structure
Check what the collaboration service returns and map accordingly

### Step 3: Ensure Data Flows Correctly
- Verify the response is unwrapped properly (API returns `{ data: {...} }`)
- Ensure React Query receives the correct data structure

## Acceptance Criteria

- [ ] Dashboard displays trees from API response
- [ ] Recent activities are displayed in the activity timeline
- [ ] Each activity shows correct title and description
- [ ] Activity type is correctly mapped (photo, person, document, edit)
- [ ] Invitations (if any) are displayed correctly
- [ ] Summary statistics are shown correctly
- [ ] No console errors related to data mapping

## Files to Modify

1. `src/app/dashboard/DashboardContent.tsx` - Update data mapping logic

## Testing

- Unit tests for data mapping functions
- Integration test with mock API response
- Manual verification in browser

## References

- AuditLog Type: `src/types/audit.ts`
- API Route: `src/app/api/dashboard/route.ts`
- Dashboard Component: `src/app/dashboard/DashboardContent.tsx`
