# Tree Board Modal Relationships - Technical Specification

## Feature Overview

**Business Value**: Improve user experience by showing complete person data including family relationships when editing a person from the tree board, enabling users to understand and manage family connections without navigating away from the tree view.

**User Story**: As a family tree researcher, when I click on a person node in the tree board to edit them, I want to see all their existing relationships (parents, spouse, children, siblings) so that I can understand their family connections and make informed edits without leaving the tree visualization.

## Current Behavior Analysis

### What Works
1. **EditPersonModal** component exists and displays basic person information:
   - Name (first, middle, last, suffix)
   - Gender
   - Birth/death dates and places
   - Occupation, nationality, biography

2. **Relationship management infrastructure** is in place:
   - `EditPersonModal` already has UI for managing relationships (lines 180-228)
   - `useManageRelationships` hook handles relationship state
   - `RelationshipService` provides business logic
   - `GET /api/persons/[id]/relationships` endpoint returns family members

3. **PersonProfileContent** (person profile page) successfully shows relationships:
   - Uses `useFamily(personId)` hook to fetch relationship data
   - Displays relationships in `RelationshipsTab` component
   - Shows parents, spouses, children, and siblings with person cards

### What's Missing

**Critical Gap**: When opening EditPersonModal from the tree board, relationship data is NOT fetched or displayed.

**Root Cause**:
- `TreeBoardContent.tsx` (line 150-184) passes `selectedPerson` to `EditPersonModal`
- The `selectedPerson` object comes from Zustand store's `persons` Map
- This Map only contains `IPerson` data, NOT relationship data
- No `existingRelationships` prop is passed to `EditPersonModal`
- Modal initializes with empty relationships array (line 37: `existingRelationships = []`)

**Impact**:
- Users cannot see existing family relationships when editing from tree board
- Users might accidentally create duplicate relationships
- Users lose context of family connections while editing
- Inconsistent UX between tree board edit and person profile edit

## Functional Requirements

### FR1: Fetch Relationship Data
**Priority**: P0 (Critical)

**Requirement**: When user clicks a person node in tree board, fetch their relationship data before opening EditPersonModal.

**Acceptance Criteria**:
1. When clicking a person node, system fetches relationships via `GET /api/persons/[id]/relationships`
2. Loading state is shown while fetching relationships
3. If fetch fails, error is handled gracefully and modal still opens (with warning)
4. Fetched data includes: parents, spouses, children, siblings with full person details

### FR2: Display Existing Relationships in Modal
**Priority**: P0 (Critical)

**Requirement**: EditPersonModal displays all existing relationships in read-only format by default.

**Acceptance Criteria**:
1. Relationships section shows list of existing relationships
2. Each relationship displays:
   - Related person's name (full name with first, middle, last)
   - Relationship type (parent, child, spouse, sibling)
   - Related person's photo/avatar if available
3. Relationships are grouped by type (parents, spouses, children, siblings)
4. Each relationship has "Remove" button to delete it
5. Each relationship has "Edit" button to change relationship type

### FR3: Manage Relationships in Modal
**Priority**: P1 (High)

**Requirement**: Users can add, edit, and remove relationships from EditPersonModal.

**Acceptance Criteria**:
1. "Add Relationship" button opens person selector
2. Person selector shows all persons in tree except current person
3. After selecting person, user chooses relationship type
4. Relationship validation prevents:
   - Self-relationships
   - Duplicate relationships
   - Invalid relationship types (e.g., parent creating cycles)
   - More than 2 parents per person
5. "Remove" button deletes relationship with confirmation
6. "Edit" button allows changing relationship type
7. Changes are persisted when "Save Changes" is clicked

### FR4: Update Handling
**Priority**: P0 (Critical)

**Requirement**: When user saves person changes, relationship updates are persisted.

**Acceptance Criteria**:
1. "Save Changes" button submits both person data AND relationship changes
2. New relationships are created via relationship service
3. Removed relationships are deleted via relationship service
4. Modified relationships are updated via relationship service
5. Success/error feedback is provided
6. On success, tree board refreshes to show updated relationships
7. On error, detailed error message explains what failed

### FR5: Error Handling
**Priority**: P1 (High)

**Requirement**: System handles errors gracefully at each step.

**Acceptance Criteria**:
1. Network errors during relationship fetch show warning but allow modal to open
2. Validation errors for relationships show specific error messages
3. Relationship conflicts (duplicates, cycles) prevent action with explanation
4. Partial failures (some relationships succeed, some fail) are handled
5. User can retry failed operations

## Technical Design Approach

### Architecture Pattern
**Pattern**: Service-Oriented Architecture with Repository Pattern

**Layers**:
1. **Presentation Layer**: `EditPersonModal`, `TreeBoardContent`
2. **Hook Layer**: `useManageRelationships`, custom hook for fetching relationships
3. **Service Layer**: `IRelationshipService` (already exists)
4. **Repository Layer**: `IRelationshipRepository` (already exists)
5. **API Layer**: `/api/persons/[id]/relationships` (already exists)

### Data Flow

```
User clicks node in tree board
    ↓
TreeBoardContent.handleNodeClick()
    ↓
Fetch person from store (already done)
    ↓
Fetch relationships from API (NEW)
    ↓
Transform API response to EditPersonModal format
    ↓
Open EditPersonModal with existingRelationships prop
    ↓
User views/edits relationships
    ↓
User clicks "Save Changes"
    ↓
onUpdate callback processes relationship changes
    ↓
Call relationship service to create/update/delete
    ↓
Refresh tree board data
    ↓
Close modal
```

### Component Changes

#### 1. TreeBoardContent.tsx
**Location**: `/Users/nguyenhuukhai/Project/family-tree/src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`

**Changes**:
```typescript
// Add state for relationships
const [personRelationships, setPersonRelationships] = useState<RelationshipData[]>([]);
const [isFetchingRelationships, setIsFetchingRelationships] = useState(false);

// Modify handleNodeClick to fetch relationships
const handleNodeClick: NodeMouseHandler = useCallback(async (event, node: Node) => {
  selectPerson(node.id);

  // Fetch relationships for this person
  setIsFetchingRelationships(true);
  try {
    const response = await fetch(`/api/persons/${node.id}/relationships`);
    if (response.ok) {
      const data = await response.json();
      setPersonRelationships(data.data || []);
    }
  } catch (error) {
    console.error('Failed to fetch relationships:', error);
    setPersonRelationships([]);
  } finally {
    setIsFetchingRelationships(false);
  }

  setIsEditModalOpen(true);
}, [selectPerson]);

// Pass existingRelationships to EditPersonModal
<EditPersonModal
  isOpen={isEditModalOpen}
  person={selectedPerson}
  treeId={treeId}
  existingRelationships={personRelationships}
  onClose={() => setIsEditModalOpen(false)}
  onUpdate={async (data) => {
    // Handle both person updates and relationship updates
    try {
      // Update person
      await updatePerson.mutateAsync({...});

      // Update relationships
      if (data.relationships) {
        // Process relationship changes
      }

      setIsEditModalOpen(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: ... };
    }
  }}
/>
```

#### 2. EditPersonModal.tsx
**Location**: `/Users/nguyenhuukhai/Project/family-tree/src/components/person/EditPersonModal.tsx`

**Changes**:
- No structural changes needed (already has relationship UI)
- Ensure `existingRelationships` prop is properly used (already implemented)
- Verify relationship submission in `onSubmit` handler

#### 3. Create Custom Hook (NEW)
**Location**: `/Users/nguyenhuukhai/Project/family-tree/src/hooks/usePersonRelationships.ts`

**Purpose**: Encapsulate relationship fetching logic

```typescript
interface UsePersonRelationshipsOptions {
  personId: string;
  enabled?: boolean;
}

interface RelationshipData {
  _id: string;
  relatedPersonId: string;
  relationshipType: 'parent' | 'child' | 'spouse' | 'sibling';
  relatedPersonName: string;
}

export function usePersonRelationships(
  options: UsePersonRelationshipsOptions
) {
  const { personId, enabled = true } = options;

  return useQuery({
    queryKey: ['person-relationships', personId],
    queryFn: async (): Promise<RelationshipData[]> => {
      const response = await fetch(`/api/persons/${personId}/relationships`);
      if (!response.ok) {
        throw new Error('Failed to fetch relationships');
      }
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!personId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### API Endpoints

#### GET /api/persons/[id]/relationships
**Status**: Already exists

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "rel-person123-parent456",
      "relatedPersonId": "parent456",
      "relationshipType": "parent",
      "relatedPersonName": "John Smith"
    },
    {
      "_id": "rel-person123-spouse789",
      "relatedPersonId": "spouse789",
      "relationshipType": "spouse",
      "relatedPersonName": "Jane Smith"
    }
  ]
}
```

#### PUT /api/persons/[id]
**Status**: Already exists

**Enhancement Needed**: Handle relationship updates

**Request Format**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "relationships": [
    {
      "relatedPersonId": "parent456",
      "relationshipType": "parent"
    }
  ]
}
```

### Database Operations

**Repository Methods** (already exist):
- `IRelationshipRepository.findByPersonId(personId: string)` - Get all relationships
- `IRelationshipRepository.findBetweenPersons(id1: string, id2: string)` - Check duplicates
- `IRelationshipRepository.create(data)` - Create relationship
- `IRelationshipRepository.update(id: string, data)` - Update relationship
- `IRelationshipRepository.delete(id: string)` - Delete relationship

**Service Methods** (already exist):
- `IRelationshipService.getFamilyMembers(personId, userId)` - Get family members
- `IRelationshipService.createRelationship(treeId, userId, data)` - Create
- `IRelationshipService.updateRelationship(relationshipId, userId, data)` - Update
- `IRelationshipService.deleteRelationship(relationshipId, userId)` - Delete
- `IRelationshipService.validateRelationship(data)` - Validate

## Files to Modify/Create

### Modify
1. `/Users/nguyenhuukhai/Project/family-tree/src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`
   - Add state for person relationships
   - Fetch relationships on node click
   - Pass `existingRelationships` to EditPersonModal
   - Handle relationship updates in `onUpdate` callback

2. `/Users/nguyenhuukhai/Project/family-tree/src/app/api/persons/[id]/route.ts`
   - Enhance PUT handler to process relationship updates
   - Or delegate relationship updates to separate endpoint

### Create
1. `/Users/nguyenhuukhai/Project/family-tree/src/hooks/usePersonRelationships.ts`
   - Custom hook for fetching person relationships
   - Uses React Query for caching
   - Handles loading and error states

### Verify (No Changes Expected)
1. `/Users/nguyenhuukhai/Project/family-tree/src/components/person/EditPersonModal.tsx` - Already has relationship UI
2. `/Users/nguyenhuukhai/Project/family-tree/src/hooks/useManageRelationships.ts` - Already manages relationship state
3. `/Users/nguyenhuukhai/Project/family-tree/src/app/api/persons/[id]/relationships/route.ts` - Already returns relationships
4. `/Users/nguyenhuukhai/Project/family-tree/src/services/relationship/RelationshipService.ts` - Already has business logic

## Architecture Considerations (SOLID Compliance)

### Single Responsibility Principle (SRP)
- **EditPersonModal**: Responsible for displaying person form and managing relationship UI state
- **useManageRelationships**: Responsible for relationship form state management
- **usePersonRelationships**: Responsible for fetching relationship data
- **RelationshipService**: Responsible for relationship business logic
- **TreeBoardContent**: Responsible for tree board orchestration (fetches data, passes to modal)

**Compliance**: Each component/hook/service has a single, well-defined responsibility.

### Open/Closed Principle (OCP)
- **EditPersonModal**: Open for extension via props (existingRelationships, onUpdate), closed for modification
- **RelationshipService**: Open for extension (new relationship types via enum), closed for modification
- **useManageRelationships**: Configurable via options object, closed for modification

**Compliance**: System allows adding relationship types without modifying existing code.

### Liskov Substitution Principle (LSP)
- **IRelationshipService**: Interface defines contract
- **RelationshipService**: Implements interface contract
- Any alternative implementation could be substituted without breaking functionality

**Compliance**: Service interfaces are properly abstracted.

### Interface Segregation Principle (ISP)
- **IRelationshipService**: Focused interface with specific methods
- **IPersonService**: Separate interface for person operations
- **IRelationshipRepository**: Separate interface for data access

**Compliance**: Interfaces are focused and not bloated.

### Dependency Inversion Principle (DIP)
- **EditPersonModal**: Depends on props (abstractions), not concrete implementations
- **TreeBoardContent**: Depends on hooks (abstractions), not direct API calls
- **RelationshipService**: Depends on repository interfaces, not concrete implementations

**Compliance**: High-level modules depend on abstractions.

## Edge Cases to Handle

### EC1: No Relationships
**Scenario**: Person has no existing relationships

**Handling**:
- Show empty state message in relationships section
- Display "Add Relationship" button
- No errors or warnings

### EC2: Failed Relationship Fetch
**Scenario**: API call to fetch relationships fails

**Handling**:
- Log error to console
- Show warning message: "Could not load relationships. You can still edit person details."
- Allow modal to open without relationship data
- Disable relationship management (show as read-only)

### EC3: Conflicting Relationship Updates
**Scenario**: Another user updates relationships while modal is open

**Handling**:
- On save, validate relationships still exist and are valid
- Show conflict error if relationship was deleted
- Offer options: "Refresh and retry" or "Close without saving"

### EC4: Large Number of Relationships
**Scenario**: Person has 50+ relationships (rare but possible)

**Handling**:
- Implement pagination or virtual scrolling if needed
- Consider limiting to closest relationships (parents, children, spouses)
- For siblings, limit to first 10 with "Show all" option

### EC5: Circular Relationships
**Scenario**: User tries to create relationship that creates a cycle (e.g., making A the parent of B, when B is already parent of A)

**Handling**:
- Validation in `RelationshipService.checkForCycles()` (already exists)
- Show error: "This relationship would create an impossible cycle"
- Prevent relationship creation

### EC6: Duplicate Relationships
**Scenario**: User tries to add relationship that already exists

**Handling**:
- Check for duplicates in `RelationshipService.validateRelationship()` (already exists)
- Show error: "A relationship between these persons already exists"
- Prevent duplicate creation

### EC7: Maximum Parents Limit
**Scenario**: User tries to add third parent to a person

**Handling**:
- Validation in `RelationshipService` (already exists)
- Show error: "A person can have maximum 2 parents"
- Prevent third parent addition

### EC8: Self-Relationship
**Scenario**: User tries to create relationship with same person

**Handling**:
- Validation in `RelationshipService` (already exists)
- Show error: "Cannot create relationship with same person"
- Prevent self-relationship

### EC9: Partial Save Failure
**Scenario**: Person update succeeds but some relationship updates fail

**Handling**:
- Use transaction-like approach: validate all before executing
- If any fails, rollback successful changes if possible
- Show detailed error: "Person updated, but 2 relationship updates failed"
- List which relationships failed and why

### EC10: Relationship Type Change
**Scenario**: User changes relationship type (e.g., parent → sibling)

**Handling**:
- Delete old relationship
- Create new relationship with new type
- Validate new relationship before creating
- Show warning: "Changing relationship type will delete the old relationship"

## Testing Requirements

### Unit Tests

#### usePersonRelationships Hook
**File**: `/Users/nguyenhuukhai/Project/family-tree/src/hooks/usePersonRelationships.test.ts`

**Test Cases**:
1. Fetches relationships successfully
2. Handles fetch errors gracefully
3. Returns cached data on subsequent calls
4. Invalidates cache when relationships change
5. Handles empty relationship list

#### TreeBoardContent Integration
**File**: `/Users/nguyenhuukhai/Project/family-tree/src/app/dashboard/trees/[treeId]/__tests__/TreeBoardContent.test.tsx`

**Test Cases**:
1. Fetches relationships when clicking node
2. Passes relationships to EditPersonModal
3. Handles relationship fetch errors
4. Shows loading state while fetching
5. Updates relationships on save

### Integration Tests

#### API Integration
**File**: `/Users/nguyenhuukhai/Project/family-tree/tests/integration/person-relationships.integration.test.ts`

**Test Cases**:
1. Fetch relationships via GET /api/persons/[id]/relationships
2. Create relationship via modal save
3. Update relationship via modal save
4. Delete relationship via modal save
5. Handle validation errors
6. Handle duplicate relationship errors

#### Service Integration
**File**: `/Users/nguyenhuukhai/Project/family-tree/tests/integration/relationship-service.integration.test.ts`

**Test Cases**:
1. Get family members for person
2. Create multiple relationships
3. Validate relationship constraints
4. Check for cycles
5. Handle partial failures

### E2E Tests

**File**: `/Users/nguyenhuukhai/Project/family-tree/tests/e2e/tree-board-relationships.spec.ts`

**Test Scenarios**:
1. View existing relationships in modal
2. Add new parent relationship
3. Add new spouse relationship
4. Add new child relationship
5. Add new sibling relationship
6. Edit relationship type
7. Remove relationship
8. Handle validation errors (duplicate, cycle, max parents)
9. Save person with relationship changes
10. Verify tree board updates after saving

### Performance Tests

**Test Cases**:
1. Fetch relationships for person with 100+ relationships
2. Modal render time with 50+ relationships
3. Save time with 20 relationship changes
4. Memory usage during relationship management

## Acceptance Criteria

### AC1: Relationship Display
**Given**: A person with existing relationships in the tree
**When**: I click on the person node in tree board
**Then**: EditPersonModal opens showing all existing relationships grouped by type (parents, spouses, children, siblings)

**Acceptance**:
- Modal shows relationship count for each type
- Each relationship displays person's full name and photo
- Relationships are in read-only state by default
- UI is responsive and loads within 2 seconds

### AC2: Add Relationship
**Given**: EditPersonModal is open for a person
**When**: I click "Add Relationship" and select a person and relationship type
**Then**: New relationship appears in the relationships list

**Acceptance**:
- Person selector shows all tree members except current person
- Relationship type selector shows valid types
- Validation prevents invalid relationships
- New relationship appears immediately in list
- Relationship is persisted when "Save Changes" is clicked

### AC3: Edit Relationship
**Given**: EditPersonModal is open with existing relationships
**When**: I click "Edit" on a relationship and change the type
**Then**: Relationship type is updated

**Acceptance**:
- Edit button opens relationship type selector
- Validation prevents invalid type changes
- Updated type shows immediately
- Change is persisted when "Save Changes" is clicked

### AC4: Remove Relationship
**Given**: EditPersonModal is open with existing relationships
**When**: I click "Remove" on a relationship
**Then**: Relationship is removed from the list

**Acceptance**:
- Confirmation dialog appears before removal
- Relationship disappears from list immediately
- Removal is persisted when "Save Changes" is clicked
- Tree board updates to reflect removal

### AC5: Validation Errors
**Given**: EditPersonModal is open
**When**: I try to add a duplicate or invalid relationship
**Then**: Specific error message explains the issue

**Acceptance**:
- Error message is clear and actionable
- Relationship is not added to list
- User can retry with different selection
- Modal remains open for other changes

### AC6: Save with Relationship Changes
**Given**: EditPersonModal is open with relationship changes
**When**: I click "Save Changes"
**Then**: Both person data and relationships are updated

**Acceptance**:
- Loading indicator shows during save
- Success message confirms save
- Modal closes on success
- Tree board refreshes to show updated relationships
- Edges in tree visualization update

### AC7: Error Handling
**Given**: EditPersonModal is open
**When**: Network error occurs during relationship fetch or save
**Then**: Graceful error handling occurs

**Acceptance**:
- Error message is user-friendly
- Modal remains open for retry
- No data loss occurs
- User can close modal without saving

### AC8: Performance
**Given**: A person with many relationships (50+)
**When**: I open EditPersonModal
**Then**: Modal loads quickly and is responsive

**Acceptance**:
- Modal opens within 2 seconds
- Relationships render within 1 second
- UI remains responsive (no freezing)
- Scrolling is smooth if list is long

## Implementation Phases

### Phase 1: Foundation (P0)
**Goal**: Enable viewing existing relationships in modal

**Tasks**:
1. Create `usePersonRelationships` hook
2. Modify `TreeBoardContent` to fetch relationships on node click
3. Pass `existingRelationships` to `EditPersonModal`
4. Test relationship display in modal

**Success Criteria**:
- Relationships display in modal when opened from tree board
- No regressions to existing functionality

### Phase 2: Relationship Management (P1)
**Goal**: Enable adding, editing, and removing relationships

**Tasks**:
1. Enhance `onUpdate` callback in `TreeBoardContent` to handle relationship updates
2. Add API endpoint or enhance existing endpoint to process relationship changes
3. Implement transaction-like save logic (all or nothing)
4. Add error handling for relationship operations

**Success Criteria**:
- Users can add relationships from modal
- Users can edit relationship types
- Users can remove relationships
- Changes persist correctly

### Phase 3: Polish & Edge Cases (P2)
**Goal**: Handle edge cases and improve UX

**Tasks**:
1. Add loading states for relationship operations
2. Implement conflict detection for concurrent edits
3. Add undo/redo capability if time permits
4. Optimize performance for large relationship lists
5. Add comprehensive error messages

**Success Criteria**:
- All edge cases handled gracefully
- UX is smooth and responsive
- Error messages are clear and actionable

### Phase 4: Testing & Documentation (P2)
**Goal**: Ensure quality and maintainability

**Tasks**:
1. Write unit tests for new hook
2. Write integration tests for API endpoints
3. Write E2E tests for complete workflow
4. Update technical documentation
5. Add comments to complex logic

**Success Criteria**:
- Test coverage > 80% for new code
- All E2E scenarios pass
- Documentation is complete

## Dependencies

### Internal Dependencies
1. `IRelationshipService` - Already exists
2. `IRelationshipRepository` - Already exists
3. `useManageRelationships` hook - Already exists
4. `GET /api/persons/[id]/relationships` endpoint - Already exists
5. `EditPersonModal` component - Already exists

### External Dependencies
1. **React Query** - For data fetching and caching
2. **Zustand** - For tree board state management
3. **React Hook Form** - For form state (already used)

### Blocking Dependencies
None - all required infrastructure exists

## Risks and Mitigations

### Risk 1: Performance Degradation
**Risk**: Fetching relationships on every node click could slow down tree board

**Mitigation**:
- Use React Query caching (5-minute stale time)
- Implement optimistic UI updates
- Consider background fetching for frequently accessed persons
- Add loading skeleton to prevent UI jank

### Risk 2: Data Inconsistency
**Risk**: Relationships in modal might be stale if another user updates them

**Mitigation**:
- Implement optimistic locking (version field)
- Validate relationships on save
- Show conflict resolution dialog if needed
- Refresh relationships when modal opens

### Risk 3: Complex Save Logic
**Risk**: Saving both person and relationships could lead to partial failures

**Mitigation**:
- Validate all changes before executing
- Use transaction-like approach
- Implement rollback mechanism
- Show detailed error messages for failures

### Risk 4: UI Complexity
**Risk**: Relationship management UI could become complex and confusing

**Mitigation**:
- Keep UI simple and intuitive
- Use clear labels and icons
- Provide help text where needed
- Test with real users for UX feedback

## Rollout Plan

### Stage 1: Internal Testing
- Deploy to development environment
- QA team tests all scenarios
- Fix bugs and edge cases
- Performance testing

### Stage 2: Beta Release
- Release to subset of users (beta testers)
- Collect feedback on UX
- Monitor performance metrics
- Fix reported issues

### Stage 3: Full Release
- Release to all users
- Monitor error rates and performance
- Gather user feedback
- Plan improvements based on feedback

## Success Metrics

### Technical Metrics
- **Performance**: Modal opens within 2 seconds with relationships
- **Error Rate**: < 1% for relationship operations
- **Test Coverage**: > 80% for new code
- **Bundle Size**: Increase < 50KB gzipped

### User Metrics
- **Adoption**: % of users who view relationships in modal
- **Engagement**: % of users who add/edit relationships from modal
- **Satisfaction**: User feedback score > 4/5
- **Task Completion**: % of relationship operations completed successfully

## References

### Related Specifications
- [Relationship Validation Fix](/Users/nguyenhuukhai/Project/family-tree/docs/specifications/relationship-validation-fix.md)
- [Tree Board Visualization Fix](/Users/nguyenhuukhai/Project/family-tree/docs/specifications/tree-board-visualization-fix.md)

### Related Components
- `PersonProfileContent` - Reference for relationship display
- `RelationshipsTab` - Reference for relationship UI
- `AddPersonModal` - Reference for relationship management

### API Documentation
- `GET /api/persons/[id]/relationships` - Fetch person relationships
- `POST /api/relationships` - Create relationship (if needed)
- `PUT /api/relationships/[id]` - Update relationship (if needed)
- `DELETE /api/relationships/[id]` - Delete relationship (if needed)

---

**Document Version**: 1.0
**Last Updated**: 2025-02-06
**Author**: PM Agent (Claude)
**Status**: Ready for Review
