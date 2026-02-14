# Feature Specification: Popup Forms and Vietnamese Input Support

## Overview

This specification outlines the changes needed to:
1. Change the "Add First Person" form from a sidebar panel to a popup/modal for empty trees
2. Update validation regex patterns to support Vietnamese characters in input fields:
   - Add/Edit Person forms (names, places, etc.)
   - Create/Edit Tree forms (tree name, description)
3. Keep validation messages in English

## Current State Analysis

### 1. Add First Person Implementation

**File:** `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx` (lines 96-128)

Currently, when a tree has no people, the `AddPersonModal` component is displayed. The `AddPersonModal` component uses a **sidebar panel** pattern instead of a centered modal popup.

**Current AddPersonModal Structure** (lines 137-432 in `src/components/person/AddPersonModal.tsx`):
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-end">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-background-dark/30 backdrop-blur-[2px]" onClick={handleClose} />

  {/* Side Panel - slides in from right */}
  <aside className="relative right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#152528] shadow-2xl flex flex-col z-20 overflow-y-auto border-l border-[#e7f1f3] dark:border-[#2a3a3d]">
    {/* Form content */}
  </aside>
</div>
```

**Issue:** The form uses `justify-end` which positions the panel on the right side (sidebar style) rather than centered (popup style).

### 2. Validation Messages Current State

**Person Schema** (`src/schemas/person.ts`):
- All validation messages are in English
- Uses Zod's built-in validation with English messages

**Tree Schema** (`src/schemas/tree.ts`):
- All validation messages are in English
- Uses Zod's built-in validation with English messages

**Current Validation Messages (English):**

Person Schema:
```typescript
'First name is required'
'First name must not exceed 50 characters'
'First name contains invalid characters'
'Last name is required'
'Last name must not exceed 50 characters'
'Last name contains invalid characters'
'Please select a gender'
'Invalid date format'
'Death date must be after birth date'
'Invalid email address'
```

Tree Schema:
```typescript
'Tree name is required'
'Tree name must be at least 3 characters'
'Tree name must not exceed 100 characters'
'Tree name can only contain letters, numbers, spaces, hyphens, and apostrophes'
'Description must not exceed 500 characters'
'Invalid visibility setting'
```

### 3. Related Components

| Component | File Path | Purpose |
|-----------|-----------|---------|
| AddPersonModal | `src/components/person/AddPersonModal.tsx` | Add new person to tree (sidebar style) |
| EditPersonModal | `src/components/person/EditPersonModal.tsx` | Edit existing person (already popup style) |
| PersonForm | `src/components/person/PersonForm.tsx` | Generic person form using Modal component |
| CreateTreeModal | `src/components/dashboard/CreateTreeModal.tsx` | Create new tree (already popup style) |
| Modal | `src/components/ui/Modal.tsx` | Reusable centered modal component |

## Proposed Changes

### Change 1: Convert AddPersonModal from Sidebar to Popup

**Approach:** Modify the `AddPersonModal` component to use a centered popup style similar to `EditPersonModal`.

**File:** `src/components/person/AddPersonModal.tsx`

**Current Layout:**
```
+--------------------------+
|                          |
|    [Backdrop]            |
|                          |
|                    +------------+
|                    | Sidebar    |
|                    | Panel      |
|                    | (Form)     |
|                    |            |
|                    |            |
|                    +------------+
+--------------------------+
```

**New Layout:**
```
+--------------------------+
|                          |
|    [Backdrop]            |
|                          |
|      +--------------+    |
|      |   Popup      |    |
|      |   Modal      |    |
|      |   (Form)     |    |
|      |              |    |
|      +--------------+    |
|                          |
+--------------------------+
```

**Implementation Details:**

1. Change container from `justify-end` to `justify-center`
2. Change `<aside>` to `<div>` with modal styling
3. Add max-height with overflow scroll
4. Match the styling of `EditPersonModal` for consistency

### Change 2: Vietnamese Validation Messages

**Approach:** Create a validation messages translation system and update Zod schemas to use Vietnamese messages.

#### Option A: Direct Vietnamese Messages (Recommended for simplicity)

Since the project doesn't have i18n infrastructure (no next-intl or similar), directly update validation messages to Vietnamese.

**Files to Modify:**
1. `src/schemas/person.ts` - Update all validation messages
2. `src/schemas/tree.ts` - Update all validation messages

#### Option B: Create i18n Infrastructure (Future-proof)

Create a lightweight translation system for validation messages.

**New Files:**
1. `src/lib/validations/messages.ts` - Vietnamese validation messages
2. `src/lib/validations/index.ts` - Export utilities

## Acceptance Criteria

### Add First Person Popup
1. When clicking "Add First Person" in an empty tree, a centered popup modal should appear
2. The modal should have a consistent design with other modals (EditPersonModal, CreateTreeModal)
3. The modal should be responsive and scrollable for smaller screens
4. All existing functionality (form fields, relationships, submission) should work unchanged
5. Clicking the backdrop should close the modal
6. Pressing Escape key should close the modal

### Vietnamese Validation
1. All person form validation messages should be in Vietnamese
2. All tree form validation messages should be in Vietnamese
3. Validation behavior should remain unchanged
4. Messages should be clear and user-friendly in Vietnamese

## Technical Implementation Details

### Part 1: AddPersonModal Popup Conversion

**File:** `src/components/person/AddPersonModal.tsx`

Replace the container structure (lines 137-146):

**Current:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-end">
  {/* Backdrop */}
  <div
    className="absolute inset-0 bg-background-dark/30 backdrop-blur-[2px]"
    onClick={handleClose}
  />

  {/* Side Panel */}
  <aside className="relative right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#152528] shadow-2xl flex flex-col z-20 overflow-y-auto border-l border-[#e7f1f3] dark:border-[#2a3a3d]">
```

**New:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div
    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
    onClick={handleClose}
  />

  {/* Modal */}
  <div className="relative w-full max-w-2xl bg-white dark:bg-[#152528] rounded-2xl shadow-2xl border border-[#e7f1f3] dark:border-[#2a3a3d] max-h-[90vh] overflow-y-auto z-20">
```

Update closing tag at the end:
**Current:**
```tsx
      </aside>
```

**New:**
```tsx
      </div>
```

### Part 2: Vietnamese Validation Messages

**File:** `src/schemas/person.ts`

Replace English messages with Vietnamese:

```typescript
import { z } from 'zod';

/**
 * Gender enum
 */
export const genderEnum = z.enum(['male', 'female', 'other'], {
  errorMap: () => ({ message: 'Vui long chon gioi tinh' }),
});

/**
 * Date string validation (ISO format)
 * Handles empty strings by converting them to undefined
 */
const dateSchema = z
  .string()
  .optional()
  .refine(
    (date) => {
      if (!date || date === '') return true;
      return !isNaN(Date.parse(date));
    },
    { message: 'Dinh dang ngay khong hop le' }
  )
  .transform((val) => (val === '' ? undefined : val));

/**
 * First name validation
 */
const firstNameSchema = z
  .string({ required_error: 'Ho la bat buoc' })
  .min(1, 'Ho la bat buoc')
  .max(50, 'Ho khong duoc vuot qua 50 ky tu')
  .regex(/^[a-zA-Z\u00C0-\u00FF\s\-']+$/, 'Ho chua ky tu khong hop le');

/**
 * Last name validation
 */
const lastNameSchema = z
  .string({ required_error: 'Ten la bat buoc' })
  .min(1, 'Ten la bat buoc')
  .max(50, 'Ten khong duoc vuot qua 50 ky tu')
  .regex(/^[a-zA-Z\u00C0-\u00FF\s\-']+$/, 'Ten chua ky tu khong hop le');

/**
 * Person form schema for UI
 */
export const personFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  middleName: z.string().max(50, 'Ten dem khong duoc vuot qua 50 ky tu').optional(),
  suffix: z.string().max(20, 'Hau to khong duoc vuot qua 20 ky tu').optional(),
  gender: genderEnum,

  // Dates
  birthDate: dateSchema.optional(),
  deathDate: dateSchema.optional(),

  // Locations
  birthPlace: z.string().max(200, 'Noi sinh khong duoc vuot qua 200 ky tu').optional(),
  deathPlace: z.string().max(200, 'Noi mat khong duoc vuot qua 200 ky tu').optional(),

  // Life status
  isDeceased: z.boolean().default(false),

  // Additional info
  biography: z.string().max(5000, 'Tieu su khong duoc vuot qua 5000 ky tu').optional(),
  occupation: z.string().max(100, 'Nghe nghiep khong duoc vuot qua 100 ky tu').optional(),
  nationality: z.string().max(50, 'Quoc tich khong duoc vuot qua 50 ky tu').optional(),

  // Contact (for living persons)
  email: z.string().email('Dia chi email khong hop le').optional().or(z.literal('')),
  phone: z.string().max(20, 'So dien thoai khong duoc vuot qua 20 ky tu').optional(),
}).refine(
  (data) => {
    if (data.birthDate && data.deathDate) {
      return new Date(data.deathDate) > new Date(data.birthDate);
    }
    return true;
  },
  {
    message: 'Ngay mat phai sau ngay sinh',
    path: ['deathDate'],
  }
);

/**
 * Relationship type enum
 */
export const relationshipTypeEnum = z.enum([
  'parent',
  'child',
  'spouse',
  'sibling',
  'step-parent',
  'step-child',
  'adoptive-parent',
  'adoptive-child',
  'partner',
], {
  errorMap: () => ({ message: 'Loai moi quan he khong hop le' }),
});

/**
 * Person relationship schema for adding connected person
 */
export const personRelationshipSchema = z.object({
  relationshipType: relationshipTypeEnum,
  relatedPersonId: z.string().min(1, 'Nguoi lien quan la bat buoc'),
});
```

**File:** `src/schemas/tree.ts`

Replace English messages with Vietnamese:

```typescript
import { z } from 'zod';

/**
 * Tree name validation
 * - Required
 * - 3-100 characters
 * - Alphanumeric with spaces, hyphens, apostrophes
 */
const treeNameSchema = z
  .string({
    required_error: 'Ten cay gia pha la bat buoc',
  })
  .min(3, 'Ten cay gia pha phai co it nhat 3 ky tu')
  .max(100, 'Ten cay gia pha khong duoc vuot qua 100 ky tu')
  .regex(
    /^[a-zA-Z0-9\s\-'\u00C0-\u00FF]+$/,
    'Ten cay gia pha chi duoc chua chu cai, so, khoang trang, gach noi va dau nhay don'
  );

/**
 * Tree description validation
 * - Optional
 * - Max 500 characters
 */
const treeDescriptionSchema = z
  .string()
  .max(500, 'Mo ta khong duoc vuot qua 500 ky tu')
  .optional()
  .or(z.literal(''));

/**
 * Tree visibility setting
 */
const treeVisibilitySchema = z.enum(['private', 'family', 'public'], {
  errorMap: () => ({ message: 'Cai dat hien thi khong hop le' }),
});

/**
 * Full tree schema for API
 */
export const treeSchema = z.object({
  name: treeNameSchema,
  description: treeDescriptionSchema,
  rootPersonId: z.string().optional(),
  isPublic: z.boolean().default(false),
  visibility: treeVisibilitySchema.default('private'),
  settings: z.object({
    allowCollaborators: z.boolean().default(false),
    allowComments: z.boolean().default(true),
  }).optional(),
});

/**
 * Tree form schema for UI (simplified)
 */
export const treeFormSchema = z.object({
  name: treeNameSchema,
  description: treeDescriptionSchema,
  visibility: treeVisibilitySchema.default('private'),
  allowCollaborators: z.boolean().default(false),
});

/**
 * Types inferred from schemas
 */
export type TreeInput = z.infer<typeof treeSchema>;
export type TreeFormInput = z.infer<typeof treeFormSchema>;
```

### Part 3: Update Form Labels (Optional Enhancement)

For complete Vietnamese support, update labels in the form components:

**File:** `src/components/person/AddPersonModal.tsx`

Update labels (partial list - lines 183-198, 203-235, etc.):
```tsx
// Identity section
<h3>Thong tin ca nhan</h3>
// First Name: Ho
// Last Name: Ten
// Gender: Gioi tinh
// Male: Nam
// Female: Nu
// Other: Khac
```

**File:** `src/components/person/EditPersonModal.tsx`

Update labels similarly.

**File:** `src/components/dashboard/CreateTreeModal.tsx`

Update labels:
```tsx
// Tree Name: Ten cay gia pha
// Description: Mo ta
// Who can view this tree?: Ai co the xem cay gia pha nay?
// Private: Rieng tu
// Family: Gia dinh
// Public: Cong khai
// Allow Collaborators: Cho phep nguoi dong
```

## Files to Modify

### Required Changes

| File | Change Description |
|------|-------------------|
| `src/components/person/AddPersonModal.tsx` | Convert from sidebar to popup modal |
| `src/schemas/person.ts` | Update validation messages to Vietnamese |
| `src/schemas/tree.ts` | Update validation messages to Vietnamese |

### Optional Changes (Complete Vietnamese UI)

| File | Change Description |
|------|-------------------|
| `src/components/person/AddPersonModal.tsx` | Update form labels to Vietnamese |
| `src/components/person/EditPersonModal.tsx` | Update form labels to Vietnamese |
| `src/components/dashboard/CreateTreeModal.tsx` | Update form labels to Vietnamese |
| `src/components/person/PersonForm.tsx` | Update form labels to Vietnamese |

## Testing Requirements

### Unit Tests

1. **AddPersonModal Popup Rendering**
   - Verify modal renders centered
   - Verify backdrop click closes modal
   - Verify Escape key closes modal
   - Verify all form fields render correctly

2. **Person Schema Validation (Vietnamese)**
   - Test required field validation shows Vietnamese message
   - Test min/max length validation shows Vietnamese message
   - Test regex validation shows Vietnamese message
   - Test date validation shows Vietnamese message
   - Test email validation shows Vietnamese message

3. **Tree Schema Validation (Vietnamese)**
   - Test required field validation shows Vietnamese message
   - Test min/max length validation shows Vietnamese message
   - Test regex validation shows Vietnamese message
   - Test visibility enum validation shows Vietnamese message

### Integration Tests

1. **Add First Person Flow**
   - Navigate to empty tree
   - Click "Add First Person" button
   - Verify popup modal appears centered
   - Fill form with valid data
   - Submit and verify person is created
   - Verify modal closes after submission

2. **Validation Messages Display**
   - Open Add Person modal
   - Submit empty form
   - Verify Vietnamese validation messages appear
   - Fill invalid data
   - Verify appropriate Vietnamese messages

3. **Tree Creation Validation**
   - Open Create Tree modal
   - Submit empty form
   - Verify Vietnamese validation messages appear
   - Fill invalid data
   - Verify appropriate Vietnamese messages

### E2E Tests

1. **Complete Add First Person Flow**
   ```typescript
   test('Add first person in empty tree shows popup modal', async ({ page }) => {
     // Create empty tree
     // Navigate to tree
     // Click "Add First Person"
     // Verify centered popup appears
     // Fill form
     // Submit
     // Verify person added to tree
   });
   ```

2. **Vietnamese Validation Messages**
   ```typescript
   test('Person form shows Vietnamese validation messages', async ({ page }) => {
     // Open Add Person modal
     // Submit empty form
     // Verify "Ho la bat buoc" appears
     // Verify "Ten la bat buoc" appears
   });
   ```

## Verification Steps

1. **Popup Modal Verification**
   - Navigate to a tree with no people
   - Click "Add First Person"
   - Verify modal appears centered (not as sidebar)
   - Verify modal has rounded corners and shadow
   - Verify clicking outside modal closes it
   - Verify pressing Escape closes modal

2. **Vietnamese Validation Verification**
   - Open Add Person modal
   - Click "Add to Family Tree" without filling fields
   - Verify Vietnamese messages appear:
     - "Ho la bat buoc" (First name is required)
     - "Ten la bat buoc" (Last name is required)
   - Enter invalid email
   - Verify "Dia chi email khong hop le" appears

3. **Tree Form Verification**
   - Open Create Tree modal
   - Click "Create Tree" without filling fields
   - Verify Vietnamese message appears:
     - "Ten cay gia pha la bat buoc"
   - Enter name with 2 characters
   - Verify "Ten cay gia pha phai co it nhat 3 ky tu" appears

## Architecture Compliance

- **Single Responsibility:** Each schema handles its own validation messages
- **Open/Closed:** Adding Vietnamese messages extends functionality without modifying validation logic
- **Liskov Substitution:** Schema interfaces remain unchanged
- **Interface Segregation:** No interface changes required
- **Dependency Injection:** No DI changes required

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vietnamese characters not rendering correctly | Low | Medium | Use proper UTF-8 encoding, test with Vietnamese input |
| Modal styling inconsistencies | Low | Low | Match existing EditPersonModal styling exactly |
| Breaking existing tests | Medium | Medium | Update test expectations to match new Vietnamese messages |
| Form layout issues on mobile | Low | Medium | Test responsive design, ensure scrollable modal |

## Dependencies

No new npm packages required. Implementation uses existing:
- Zod for validation
- React Hook Form for form management
- Tailwind CSS for styling

## Rollback Plan

If issues arise:
1. Revert AddPersonModal container changes to restore sidebar
2. Revert schema message changes to restore English messages
3. Both changes are independent and can be rolled back separately
