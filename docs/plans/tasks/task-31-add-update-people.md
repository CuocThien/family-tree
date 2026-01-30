# Add/Update People in Tree Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement add person modal, relationship selection, person profile page with edit functionality, and integrate with tree board.

**Architecture:**
- Modal components using existing UI patterns
- Service layer (PersonService, RelationshipService) for business logic
- Form validation with React Hook Form + Zod
- TanStack Query for data fetching and mutations

**Tech Stack:**
- React Hook Form for form management
- Zod for schema validation
- TanStack Query for data fetching
- Tailwind CSS for styling
- Material Symbols for icons

---

## Task 1: Enhance Person Schema with Relationships

**Files:**
- Modify: `src/schemas/person.ts` (or create if doesn't exist)
- Test: `src/schemas/__tests__/person.test.ts`

**Step 1: Write the failing test**

```typescript
// src/schemas/__tests__/person.test.ts

import { personFormSchema, personRelationshipSchema } from '../person';

describe('Person Schemas', () => {
  describe('personFormSchema', () => {
    const validPerson = {
      firstName: 'John',
      lastName: 'Smith',
      gender: 'male',
      birthDate: '1950-01-01',
      isDeceased: false,
    };

    it('should validate a valid person', () => {
      const result = personFormSchema.safeParse(validPerson);
      expect(result.success).toBe(true);
    });

    it('should require first name', () => {
      const result = personFormSchema.safeParse({ ...validPerson, firstName: '' });
      expect(result.success).toBe(false);
    });

    it('should require last name', () => {
      const result = personFormSchema.safeParse({ ...validPerson, lastName: '' });
      expect(result.success).toBe(false);
    });

    it('should require gender', () => {
      const result = personFormSchema.safeParse({ ...validPerson, gender: undefined });
      expect(result.success).toBe(false);
    });

    it('should accept valid gender values', () => {
      const genders = ['male', 'female', 'other'] as const;
      genders.forEach((gender) => {
        const result = personFormSchema.safeParse({ ...validPerson, gender });
        expect(result.success).toBe(true);
      });
    });

    it('should validate death date when deceased', () => {
      const result = personFormSchema.safeParse({
        ...validPerson,
        isDeceased: true,
        deathDate: '2020-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('should require death date when deceased', () => {
      const result = personFormSchema.safeParse({
        ...validPerson,
        isDeceased: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('personRelationshipSchema', () => {
    it('should validate relationship type', () => {
      const result = personRelationshipSchema.safeParse({
        relationshipType: 'child',
        relatedPersonId: 'person-123',
      });
      expect(result.success).toBe(true);
    });

    it('should require related person ID', () => {
      const result = personRelationshipSchema.safeParse({
        relationshipType: 'child',
      });
      expect(result.success).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/person.test.ts`
Expected: FAIL - Schema doesn't exist or incomplete

**Step 3: Write minimal implementation**

```typescript
// src/schemas/person.ts

import { z } from 'zod';

/**
 * Gender enum
 */
export const genderEnum = z.enum(['male', 'female', 'other'], {
  errorMap: () => ({ message: 'Please select a gender' }),
});

/**
 * Date string validation (ISO format)
 */
const dateSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)),
  { message: 'Invalid date format' }
);

/**
 * First name validation
 */
const firstNameSchema = z
  .string({ required_error: 'First name is required' })
  .min(1, 'First name is required')
  .max(50, 'First name must not exceed 50 characters')
  .regex(/^[a-zA-Z\u00C0-\u00FF\s\-']+$/, 'First name contains invalid characters');

/**
 * Last name validation
 */
const lastNameSchema = z
  .string({ required_error: 'Last name is required' })
  .min(1, 'Last name is required')
  .max(50, 'Last name must not exceed 50 characters')
  .regex(/^[a-zA-Z\u00C0-\u00FF\s\-']+$/, 'Last name contains invalid characters');

/**
 * Person form schema for UI
 */
export const personFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  middleName: z.string().max(50, 'Middle name must not exceed 50 characters').optional(),
  suffix: z.string().max(20, 'Suffix must not exceed 20 characters').optional(),
  gender: genderEnum,

  // Dates
  birthDate: dateSchema.optional(),
  deathDate: dateSchema.optional(),

  // Locations
  birthPlace: z.string().max(200, 'Birth place must not exceed 200 characters').optional(),
  deathPlace: z.string().max(200, 'Death place must not exceed 200 characters').optional(),

  // Life status
  isDeceased: z.boolean().default(false),

  // Additional info
  biography: z.string().max(5000, 'Biography must not exceed 5000 characters').optional(),
  occupation: z.string().max(100, 'Occupation must not exceed 100 characters').optional(),
  nationality: z.string().max(50, 'Nationality must not exceed 50 characters').optional(),

  // Contact (for living persons)
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number must not exceed 20 characters').optional(),
}).refine(
  (data) => {
    // If deceased, death date is required
    if (data.isDeceased && !data.deathDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Death date is required when person is deceased',
    path: ['deathDate'],
  }
).refine(
  (data) => {
    // Death date must be after birth date
    if (data.birthDate && data.deathDate) {
      return new Date(data.deathDate) >= new Date(data.birthDate);
    }
    return true;
  },
  {
    message: 'Death date must be after birth date',
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
  errorMap: () => ({ message: 'Invalid relationship type' }),
});

/**
 * Person relationship schema for adding connected person
 */
export const personRelationshipSchema = z.object({
  relationshipType: relationshipTypeEnum,
  relatedPersonId: z.string().min(1, 'Related person is required'),
});

/**
 * Add person to tree schema (person + relationship)
 */
export const addPersonToTreeSchema = personFormSchema.extend({
  relationshipType: relationshipTypeEnum.optional(),
  connectToPersonId: z.string().optional(),
});

/**
 * Types inferred from schemas
 */
export type PersonFormInput = z.infer<typeof personFormSchema>;
export type PersonRelationshipInput = z.infer<typeof personRelationshipSchema>;
export type AddPersonToTreeInput = z.infer<typeof addPersonToTreeSchema>;
export type GenderType = z.infer<typeof genderEnum>;
export type RelationshipType = z.infer<typeof relationshipTypeEnum>;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/person.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/schemas/person.ts src/schemas/__tests__/person.test.ts
git commit -m "feat: add person validation schemas"
```

---

## Task 2: Create AddPersonModal Component

**Files:**
- Create: `src/components/person/AddPersonModal.tsx`
- Test: `src/components/person/__tests__/AddPersonModal.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/person/__tests__/AddPersonModal.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddPersonModal } from '../AddPersonModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('AddPersonModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    treeId: 'tree-1',
  };

  it('renders modal with form', () => {
    renderWithQueryClient(<AddPersonModal {...defaultProps} />);

    expect(screen.getByText(/Add New Member/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
  });

  it('shows connection info when connectToPersonId provided', () => {
    renderWithQueryClient(
      <AddPersonModal {...defaultProps} connectToPersonId="person-1" connectToName="John Smith" />
    );

    expect(screen.getByText(/Connecting to John Smith/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddPersonModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Add to Family Tree/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn();

    renderWithQueryClient(<AddPersonModal {...defaultProps} onCreate={onCreate} />);

    await user.type(screen.getByLabelText(/First Name/i), 'Jane');
    await user.type(screen.getByLabelText(/Last Name/i), 'Smith');

    fireEvent.click(screen.getByLabelText(/^Male$/));
    fireEvent.click(screen.getByLabelText(/^Female$/));

    fireEvent.click(screen.getByRole('button', { name: /Add to Family Tree/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/person/__tests__/AddPersonModal.test.tsx`
Expected: FAIL - Component doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/components/person/AddPersonModal.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { personFormSchema, addPersonToTreeSchema, type PersonFormInput, type AddPersonToTreeInput, type GenderType, type RelationshipType } from '@/schemas/person';
import { cn } from '@/lib/utils';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeId: string;
  connectToPersonId?: string;
  connectToName?: string;
  defaultRelationship?: RelationshipType;
  onCreate?: (data: AddPersonToTreeInput) => Promise<{ success: boolean; error?: string }>;
}

export function AddPersonModal({
  isOpen,
  onClose,
  treeId,
  connectToPersonId,
  connectToName,
  defaultRelationship,
  onCreate,
}: AddPersonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedGender, setSelectedGender] = useState<GenderType>('male');
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipType>(
    defaultRelationship || 'child'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AddPersonToTreeInput>({
    resolver: zodResolver(addPersonToTreeSchema),
    defaultValues: {
      gender: 'male',
      isDeceased: false,
    },
  });

  const isDeceased = watch('isDeceased');

  if (!isOpen) return null;

  const onSubmit = async (data: AddPersonToTreeInput) => {
    setIsSubmitting(true);
    try {
      const result = onCreate
        ? await onCreate({
            ...data,
            connectToPersonId,
            relationshipType: connectToPersonId ? selectedRelationship : undefined,
          })
        : { success: true };

      if (result.success) {
        reset();
        onClose();
      }
    } catch (error) {
      console.error('Failed to add person:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const genders: { value: GenderType; label: string; icon: string }[] = [
    { value: 'male', label: 'Male', icon: 'male' },
    { value: 'female', label: 'Female', icon: 'female' },
    { value: 'other', label: 'Other', icon: 'person' },
  ];

  const relationships: { value: RelationshipType; label: string; icon: string }[] = [
    { value: 'parent', label: 'Parent', icon: 'north' },
    { value: 'child', label: 'Child', icon: 'south' },
    { value: 'spouse', label: 'Spouse', icon: 'favorite' },
    { value: 'sibling', label: 'Sibling', icon: 'group' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-dark/30 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Side Panel */}
      <aside className="relative right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#152528] shadow-2xl flex flex-col z-20 overflow-y-auto border-l border-[#e7f1f3] dark:border-[#2a3a3d]">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 p-6 border-b border-[#e7f1f3] dark:border-[#2a3a3d]">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#0d191b] dark:text-white text-2xl font-black leading-tight tracking-[-0.033em]">
              Add New Member
            </h2>
            {connectToName && (
              <p className="text-[#4c8d9a] text-sm font-normal leading-normal">
                Connecting to <span className="font-bold text-[#0d191b] dark:text-primary">{connectToName}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center rounded-xl size-10 hover:bg-[#f0f5f6] dark:hover:bg-[#1f2f32] transition-colors"
          >
            <MaterialSymbol icon="close" className="text-[#4c8d9a]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6 flex-1">
          {/* Basic Information */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#0d191b] dark:text-white text-lg font-bold leading-tight">
              Identity
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <p className="text-[#0d191b] dark:text-white text-sm font-medium">First Name</p>
                <Input
                  placeholder="e.g. Emily"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
              </label>
              <label className="flex flex-col gap-2">
                <p className="text-[#0d191b] dark:text-white text-sm font-medium">Last Name</p>
                <Input
                  placeholder="e.g. Smith"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </label>
            </div>
          </div>

          {/* Gender Selection */}
          <div className="flex flex-col gap-4">
            <p className="text-[#0d191b] dark:text-white text-sm font-medium">Gender</p>
            <div className="flex gap-2">
              {genders.map((gender) => (
                <button
                  key={gender.value}
                  type="button"
                  onClick={() => setSelectedGender(gender.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                    selectedGender === gender.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-[#cfe3e7] dark:border-[#2a3a3d] hover:bg-[#f8fbfc] dark:hover:bg-[#1a2e32] text-[#0d191b] dark:text-white'
                  )}
                >
                  <MaterialSymbol
                    icon={gender.icon as any}
                    className={cn(
                      'text-[20px]',
                      selectedGender === gender.value ? 'text-primary' : 'text-[#4c8d9a]'
                    )}
                  />
                  {gender.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('gender')} value={selectedGender} />
          </div>

          {/* Relationship Selection */}
          {connectToPersonId && (
            <div className="flex flex-col gap-4">
              <p className="text-[#0d191b] dark:text-white text-sm font-medium">
                Relationship to {connectToName}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {relationships.map((rel) => (
                  <button
                    key={rel.value}
                    type="button"
                    onClick={() => setSelectedRelationship(rel.value)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all',
                      selectedRelationship === rel.value
                        ? 'border-primary bg-primary/5'
                        : 'border-[#cfe3e7] dark:border-[#2a3a3d] hover:border-primary'
                    )}
                  >
                    <div
                      className={cn(
                        'size-8 rounded-full flex items-center justify-center',
                        selectedRelationship === rel.value
                          ? 'bg-primary'
                          : 'bg-[#f0f5f6] dark:bg-[#2a3a3d]'
                      )}
                    >
                      <MaterialSymbol
                        icon={rel.icon as any}
                        className={cn(
                          'text-sm',
                          selectedRelationship === rel.value ? 'text-white' : 'text-[#4c8d9a]'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        selectedRelationship === rel.value ? 'font-bold' : ''
                      )}
                    >
                      {rel.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Details Toggle */}
          <div className="border-t border-[#e7f1f3] dark:border-[#2a3a3d] pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-primary text-sm font-bold"
            >
              <MaterialSymbol icon={showAdvanced ? 'remove_circle' : 'add_circle'} />
              {showAdvanced ? 'Hide' : 'Add more details'} (Birth, Place, Occupation)
            </button>
          </div>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <p className="text-[#0d191b] dark:text-white text-sm font-medium">Birth Date</p>
                  <Input
                    type="date"
                    error={errors.birthDate?.message}
                    {...register('birthDate')}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <p className="text-[#0d191b] dark:text-white text-sm font-medium">Birth Place</p>
                  <Input
                    placeholder="e.g. London, UK"
                    {...register('birthPlace')}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <p className="text-[#0d191b] dark:text-white text-sm font-medium">Death Date</p>
                  <Input
                    type="date"
                    disabled={!isDeceased}
                    error={errors.deathDate?.message}
                    {...register('deathDate')}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <p className="text-[#0d191b] dark:text-white text-sm font-medium">Death Place</p>
                  <Input
                    placeholder="e.g. New York, USA"
                    disabled={!isDeceased}
                    {...register('deathPlace')}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <p className="text-[#0d191b] dark:text-white text-sm font-medium">Occupation</p>
                <Input
                  placeholder="e.g. Teacher"
                  {...register('occupation')}
                />
              </label>

              <label className="flex flex-col gap-2">
                <p className="text-[#0d191b] dark:text-white text-sm font-medium">Biography</p>
                <Textarea
                  placeholder="Life story and achievements..."
                  rows={4}
                  {...register('biography')}
                />
              </label>
            </div>
          )}

          {/* Deceased Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox rounded text-primary focus:ring-primary border-[#cfe3e7] dark:border-[#2a3a3d] size-5"
              {...register('isDeceased')}
            />
            <span className="text-sm text-[#0d191b] dark:text-white font-medium">
              Person is deceased
            </span>
          </label>
        </form>

        {/* Footer Actions */}
        <div className="mt-auto p-6 border-t border-[#e7f1f3] dark:border-[#2a3a3d] flex flex-col gap-3">
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Adding...
              </>
            ) : (
              'Add to Family Tree'
            )}
          </Button>
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            className="w-full"
            disabled={isSubmitting}
          >
            Cancel and Go Back
          </Button>
        </div>
      </aside>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/person/__tests__/AddPersonModal.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/person/AddPersonModal.tsx src/components/person/__tests__/AddPersonModal.test.tsx
git commit -m "feat: add AddPersonModal component"
```

---

## Task 3: Create useAddPersonToTree Hook

**Files:**
- Create: `src/hooks/useAddPersonToTree.ts`
- Test: `src/hooks/__tests__/useAddPersonToTree.test.ts`

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/useAddPersonToTree.test.ts

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAddPersonToTree } from '../useAddPersonToTree';
import { personService } from '@/services/person/PersonService';
import { relationshipService } from '@/services/relationship/RelationshipService';

jest.mock('@/services/person/PersonService');
jest.mock('@/services/relationship/RelationshipService');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAddPersonToTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add person to tree successfully', async () => {
    const mockPerson = {
      id: 'person-1',
      firstName: 'John',
      lastName: 'Smith',
      gender: 'male',
    };

    (personService.createPerson as jest.Mock).mockResolvedValue(mockPerson);
    (relationshipService.createRelationship as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useAddPersonToTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.addPerson.mutateAsync({
        treeId: 'tree-1',
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
      });

      expect(response).toEqual({
        success: true,
        data: mockPerson,
      });
    });
  });

  it('should create relationship when connectToPersonId provided', async () => {
    const mockPerson = {
      id: 'person-1',
      firstName: 'Jane',
      lastName: 'Smith',
      gender: 'female',
    };

    (personService.createPerson as jest.Mock).mockResolvedValue(mockPerson);
    (relationshipService.createRelationship as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useAddPersonToTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.addPerson.mutateAsync({
        treeId: 'tree-1',
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        connectToPersonId: 'person-2',
        relationshipType: 'child',
      });
    });

    expect(relationshipService.createRelationship).toHaveBeenCalledWith({
      fromPersonId: 'person-2',
      toPersonId: 'person-1',
      type: 'child',
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/__tests__/useAddPersonToTree.test.ts`
Expected: FAIL - Hook doesn't exist

**Step 3: Write minimal implementation**

```typescript
// src/hooks/useAddPersonToTree.ts

import { useMutation } from '@tanstack/react-query';
import { personService } from '@/services/person/PersonService';
import { relationshipService } from '@/services/relationship/RelationshipService';
import type { AddPersonToTreeInput } from '@/schemas/person';

interface AddPersonResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface AddPersonVariables extends AddPersonToTreeInput {
  treeId: string;
}

export function useAddPersonToTree() {
  const addPerson = useMutation({
    mutationFn: async (variables: AddPersonVariables): Promise<AddPersonResponse> => {
      try {
        const { treeId, connectToPersonId, relationshipType, ...personData } = variables;

        // Create the person
        const newPerson = await personService.createPerson({
          ...personData,
          treeId,
        });

        // If connecting to existing person, create relationship
        if (connectToPersonId && relationshipType) {
          await relationshipService.createRelationship({
            fromPersonId: connectToPersonId,
            toPersonId: newPerson.id,
            type: relationshipType,
          });
        }

        return {
          success: true,
          data: newPerson,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add person',
        };
      }
    },
  });

  return { addPerson };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/__tests__/useAddPersonToTree.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useAddPersonToTree.ts src/hooks/__tests__/useAddPersonToTree.test.ts
git commit -m "feat: add useAddPersonToTree hook"
```

---

## Task 4: Create Person Profile Page

**Files:**
- Create: `src/app/dashboard/persons/[personId]/page.tsx`
- Create: `src/app/dashboard/persons/[personId]/PersonProfileContent.tsx`
- Create: `src/components/person/PersonProfileHeader.tsx`
- Create: `src/components/person/PersonProfileTabs.tsx`
- Create: `src/components/person/PersonOverviewTab.tsx`
- Test: `src/app/dashboard/persons/[personId]/__tests__/page.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/app/dashboard/persons/[personId]/__tests__/page.test.tsx

import { render, screen } from '@testing-library/react';
import PersonProfilePage from '../page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/services/person/PersonService');

describe('Person Profile Page', () => {
  it('renders person profile', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <PersonProfilePage params={{ personId: 'person-1' }} />
      </QueryClientProvider>
    );

    // Should show loading first
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/dashboard/persons/[personId]/__tests__/page.test.tsx`
Expected: FAIL - Page doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/app/dashboard/persons/[personId]/page.tsx

import { Metadata } from 'next';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PersonProfileContent } from './PersonProfileContent';
import { PersonProfileSkeleton } from '@/components/person/PersonProfileSkeleton';

interface PersonProfilePageProps {
  params: {
    personId: string;
  };
}

export async function generateMetadata({ params }: PersonProfilePageProps): Promise<Metadata> {
  // Optionally fetch person data for metadata
  return {
    title: 'Person Profile - Family Tree',
    description: 'View person details and family connections',
  };
}

export default async function PersonProfilePage({ params }: PersonProfilePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<PersonProfileSkeleton />}>
      <PersonProfileContent personId={params.personId} />
    </Suspense>
  );
}
```

```tsx
// src/app/dashboard/persons/[personId]/PersonProfileContent.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PersonProfileHeader } from '@/components/person/PersonProfileHeader';
import { PersonProfileTabs } from '@/components/person/PersonProfileTabs';
import { PersonOverviewTab } from '@/components/person/PersonOverviewTab';
import { PersonProfileSkeleton } from '@/components/person/PersonProfileSkeleton';
import { personService } from '@/services/person/PersonService';
import { useSession } from 'next-auth/react';

interface PersonProfileContentProps {
  personId: string;
}

export function PersonProfileContent({ personId }: PersonProfileContentProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: person, isLoading, error } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => personService.getPersonById(personId),
  });

  if (isLoading) {
    return <PersonProfileSkeleton />;
  }

  if (error || !person) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Error loading person</p>
          <p className="text-sm text-[#4c8d9a]">{(error as Error)?.message || 'Person not found'}</p>
        </div>
      </div>
    );
  }

  const lifeStatus = person.deathDate
    ? `${person.birthDate ? `${new Date(person.birthDate).getFullYear()} — ` : ''}${new Date(person.deathDate).getFullYear()}`
    : `${person.birthDate ? `${new Date(person.birthDate).getFullYear()} — Present` : 'Present'}`;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Navigation */}
      <nav className="flex items-center gap-2 py-2 px-4 md:px-8 border-b border-[#e7f1f3] dark:border-gray-800">
        <a href="/dashboard" className="text-primary text-sm font-medium hover:underline">
          Dashboard
        </a>
        <span className="text-[#4c8d9a] text-sm font-medium">/</span>
        <a href="/dashboard/trees" className="text-primary text-sm font-medium hover:underline">
          Family Trees
        </a>
        <span className="text-[#4c8d9a] text-sm font-medium">/</span>
        <span className="text-[#0d191b] dark:text-gray-400 text-sm font-medium">
          {person.firstName} {person.lastName}
        </span>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {/* Profile Header */}
        <PersonProfileHeader
          person={person}
          lifeStatus={lifeStatus}
          onEdit={() => router.push(`/dashboard/persons/${personId}/edit`)}
        />

        {/* Tabs */}
        <PersonProfileTabs
          personId={personId}
          activeTab="overview"
        />

        {/* Tab Content */}
        <div className="mt-8">
          <PersonOverviewTab person={person} />
        </div>
      </main>
    </div>
  );
}
```

```tsx
// src/components/person/PersonProfileHeader.tsx

'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/date-utils';
import type { IPerson } from '@/types/person';

interface PersonProfileHeaderProps {
  person: IPerson;
  lifeStatus: string;
  onEdit: () => void;
}

export function PersonProfileHeader({ person, lifeStatus, onEdit }: PersonProfileHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-[#e7f1f3] dark:border-gray-800 p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Avatar */}
        <div className="relative group">
          <Avatar
            src={person.photoUrl}
            alt={`${person.firstName} ${person.lastName}`}
            size="xl"
            className="ring-4 ring-white dark:ring-gray-800"
          />
          <button
            className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-md hover:scale-105 transition-transform"
            aria-label="Change photo"
          >
            <MaterialSymbol icon="photo_camera" className="text-sm" />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-[#0d191b] dark:text-white text-3xl md:text-4xl font-bold leading-tight">
                {person.firstName} {person.middleName && `${person.middleName} `}{person.lastName}
                {person.suffix && `, ${person.suffix}`}
              </h1>
              <p className="text-primary text-lg font-semibold mt-1">{lifeStatus}</p>
              {(person.birthPlace || person.deathPlace) && (
                <p className="text-[#4c8d9a] text-base mt-1 flex items-center justify-center md:justify-start gap-1">
                  <MaterialSymbol icon="location_on" className="text-lg" />
                  {person.birthPlace && `Born: ${person.birthPlace}`}
                  {person.birthPlace && person.deathPlace && ' • '}
                  {person.deathPlace && `Died: ${person.deathPlace}`}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={onEdit} className="gap-2">
                <MaterialSymbol icon="edit" className="text-lg" />
                Edit Profile
              </Button>
              <Button variant="primary" className="gap-2">
                <MaterialSymbol icon="add_a_photo" className="text-lg" />
                Add Media
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="bg-background-light dark:bg-gray-800 px-4 py-2 rounded-lg border border-[#e7f1f3] dark:border-gray-700">
              <p className="text-[10px] uppercase tracking-wider text-[#4c8d9a] font-bold">Relationships</p>
              <p className="text-sm font-bold dark:text-gray-200">12 Connected</p>
            </div>
            <div className="bg-background-light dark:bg-gray-800 px-4 py-2 rounded-lg border border-[#e7f1f3] dark:border-gray-700">
              <p className="text-[10px] uppercase tracking-wider text-[#4c8d9a] font-bold">Records</p>
              <p className="text-sm font-bold dark:text-gray-200">8 Documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/components/person/PersonProfileTabs.tsx

'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PersonProfileTabsProps {
  personId: string;
  activeTab: string;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'person' },
  { id: 'relationships', label: 'Relationships', icon: 'family_restroom' },
  { id: 'media', label: 'Media', icon: 'photo_library' },
  { id: 'events', label: 'Life Events', icon: 'event' },
  { id: 'sources', label: 'Sources', icon: 'description' },
];

export function PersonProfileTabs({ personId, activeTab }: PersonProfileTabsProps) {
  const pathname = usePathname();

  return (
    <div className="mb-8">
      <div className="flex border-b border-[#cfe3e7] dark:border-gray-800 px-4 gap-8">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/dashboard/persons/${personId}/${tab.id}`}
            className={cn(
              'flex items-center gap-2 pb-[13px] pt-4 border-b-[3px] transition-colors',
              activeTab === tab.id
                ? 'border-b-primary text-[#0d191b] dark:text-white'
                : 'border-b-transparent text-[#4c8d9a] hover:text-primary'
            )}
          >
            <MaterialSymbol icon={tab.icon as any} className="text-lg" />
            <p className="text-sm font-bold tracking-[0.015em]">{tab.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// src/components/person/PersonOverviewTab.tsx

'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import type { IPerson } from '@/types/person';

interface PersonOverviewTabProps {
  person: IPerson;
}

export function PersonOverviewTab({ person }: PersonOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Biography & Life Story */}
      <div className="lg:col-span-2 space-y-8">
        {/* Biography */}
        <section>
          <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold mb-4">
            Biography
          </h2>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-[#e7f1f3] dark:border-gray-800 leading-relaxed text-[#4c8d9a] dark:text-gray-300">
            {person.biography ? (
              <p className="whitespace-pre-wrap">{person.biography}</p>
            ) : (
              <p className="italic text-[#4c8d9a]">No biography added yet.</p>
            )}
          </div>
        </section>

        {/* Life Events Timeline */}
        <section>
          <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold mb-4">
            Life Events
          </h2>
          <div className="space-y-4">
            {/* Birth */}
            {person.birthDate && (
              <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-[#e7f1f3] dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <MaterialSymbol icon="child_care" />
                  </div>
                  <div className="w-0.5 h-full bg-[#e7f1f3] dark:bg-gray-800 mt-2" />
                </div>
                <div className="pb-2">
                  <p className="text-sm font-bold text-[#0d191b] dark:text-white">Birth</p>
                  <p className="text-xs text-primary font-bold">
                    {new Date(person.birthDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {person.birthPlace && (
                    <p className="text-sm text-[#4c8d9a] mt-1">{person.birthPlace}</p>
                  )}
                </div>
              </div>
            )}

            {/* Death */}
            {person.deathDate && (
              <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-[#e7f1f3] dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <MaterialSymbol icon="deceased" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0d191b] dark:text-white">Death</p>
                  <p className="text-xs text-primary font-bold">
                    {new Date(person.deathDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {person.deathPlace && (
                    <p className="text-sm text-[#4c8d9a] mt-1">{person.deathPlace}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Key Facts */}
      <div className="space-y-8">
        {/* Key Facts */}
        <section>
          <h2 className="text-[#0d191b] dark:text-white text-xl font-bold mb-4">
            Key Facts
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7f1f3] dark:border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[#e7f1f3] dark:border-gray-800">
                  <td className="p-4 text-[#4c8d9a] font-medium">Gender</td>
                  <td className="p-4 text-[#0d191b] dark:text-gray-200 font-bold capitalize">
                    {person.gender}
                  </td>
                </tr>
                {person.occupation && (
                  <tr className="border-b border-[#e7f1f3] dark:border-gray-800">
                    <td className="p-4 text-[#4c8d9a] font-medium">Occupation</td>
                    <td className="p-4 text-[#0d191b] dark:text-gray-200 font-bold">
                      {person.occupation}
                    </td>
                  </tr>
                )}
                {person.nationality && (
                  <tr>
                    <td className="p-4 text-[#4c8d9a] font-medium">Nationality</td>
                    <td className="p-4 text-[#0d191b] dark:text-gray-200 font-bold">
                      {person.nationality}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/dashboard/persons/[personId]/__tests__/page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/dashboard/persons/[personId]/ src/components/person/PersonProfileHeader.tsx src/components/person/PersonProfileTabs.tsx src/components/person/PersonOverviewTab.tsx src/app/dashboard/persons/[personId]/__tests__/page.test.tsx
git commit -m "feat: add person profile page"
```

---

## Task 5: Create EditPersonModal Component

**Files:**
- Create: `src/components/person/EditPersonModal.tsx`
- Create: `src/hooks/useUpdatePerson.ts`
- Test: `src/components/person/__tests__/EditPersonModal.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/person/__tests__/EditPersonModal.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { EditPersonModal } from '../EditPersonModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('EditPersonModal', () => {
  const mockPerson = {
    id: 'person-1',
    firstName: 'John',
    lastName: 'Smith',
    gender: 'male',
    birthDate: '1950-01-01',
    isDeceased: false,
  };

  it('renders modal with existing data', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EditPersonModal isOpen person={mockPerson} onClose={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/person/__tests__/EditPersonModal.test.tsx`
Expected: FAIL - Component doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/components/person/EditPersonModal.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { personFormSchema, type PersonFormInput, type GenderType } from '@/schemas/person';
import { cn } from '@/lib/utils';
import type { IPerson } from '@/types/person';

interface EditPersonModalProps {
  isOpen: boolean;
  person: IPerson;
  onClose: () => void;
  onUpdate?: (data: PersonFormInput) => Promise<{ success: boolean; error?: string }>;
}

export function EditPersonModal({ isOpen, person, onClose, onUpdate }: EditPersonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGender, setSelectedGender] = useState<GenderType>(
    person.gender as GenderType
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PersonFormInput>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName || '',
      suffix: person.suffix || '',
      gender: person.gender as GenderType,
      birthDate: person.birthDate || '',
      deathDate: person.deathDate || '',
      birthPlace: person.birthPlace || '',
      deathPlace: person.deathPlace || '',
      isDeceased: !!person.deathDate,
      biography: person.biography || '',
      occupation: person.occupation || '',
      nationality: person.nationality || '',
      email: person.email || '',
      phone: person.phone || '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: PersonFormInput) => {
    setIsSubmitting(true);
    try {
      const result = onUpdate ? await onUpdate(data) : { success: true };
      if (result.success) {
        reset();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update person:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const genders: { value: GenderType; label: string; icon: string }[] = [
    { value: 'male', label: 'Male', icon: 'male' },
    { value: 'female', label: 'Female', icon: 'female' },
    { value: 'other', label: 'Other', icon: 'person' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#152528] rounded-2xl shadow-2xl border border-[#e7f1f3] dark:border-[#2a3a3d] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e7f1f3] dark:border-[#2a3a3d]">
          <h2 className="text-2xl font-bold text-[#0d191b] dark:text-white">
            Edit Person
          </h2>
          <button onClick={onClose} className="size-10 rounded-xl hover:bg-[#f0f5f6] dark:hover:bg-[#1f2f32]">
            <MaterialSymbol icon="close" className="text-[#4c8d9a]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name *</label>
              <Input error={errors.firstName?.message} {...register('firstName')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Middle Name</label>
              <Input {...register('middleName')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name *</label>
              <Input error={errors.lastName?.message} {...register('lastName')} />
            </div>
          </div>

          {/* Suffix */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Suffix</label>
            <Input placeholder="e.g. Jr., Sr., III" {...register('suffix')} />
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Gender *</label>
            <div className="flex gap-2">
              {genders.map((gender) => (
                <button
                  key={gender.value}
                  type="button"
                  onClick={() => setSelectedGender(gender.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium',
                    selectedGender === gender.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-[#cfe3e7] dark:border-[#2a3a3d] text-[#0d191b] dark:text-white'
                  )}
                >
                  <MaterialSymbol icon={gender.icon as any} className="text-lg" />
                  {gender.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('gender')} value={selectedGender} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Birth Date</label>
              <Input type="date" {...register('birthDate')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Birth Place</label>
              <Input placeholder="e.g. London, UK" {...register('birthPlace')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Death Date</label>
              <Input type="date" {...register('deathDate')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Death Place</label>
              <Input placeholder="e.g. New York, USA" {...register('deathPlace')} />
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Occupation</label>
              <Input {...register('occupation')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nationality</label>
              <Input {...register('nationality')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Biography</label>
              <Textarea rows={4} {...register('biography')} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

```typescript
// src/hooks/useUpdatePerson.ts

import { useMutation } from '@tanstack/react-query';
import { personService } from '@/services/person/PersonService';
import type { PersonFormInput } from '@/schemas/person';

interface UpdatePersonResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function useUpdatePerson(personId: string) {
  const updatePerson = useMutation({
    mutationFn: async (data: PersonFormInput): Promise<UpdatePersonResponse> => {
      try {
        const updated = await personService.updatePerson(personId, data);
        return {
          success: true,
          data: updated,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update person',
        };
      }
    },
  });

  return { updatePerson };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/person/__tests__/EditPersonModal.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/person/EditPersonModal.tsx src/hooks/useUpdatePerson.ts src/components/person/__tests__/EditPersonModal.test.tsx
git commit -m "feat: add EditPersonModal component"
```

---

## Task 6: Integrate AddPersonModal with Tree Board Quick Add

**Files:**
- Modify: `src/components/tree/FloatingControls.tsx`
- Modify: `src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/tree/__tests__/FloatingControls.add.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingControls } from '../FloatingControls';
import { useTreeBoardStore } from '@/store/treeBoardStore';

jest.mock('@/store/treeBoardStore');

describe('FloatingControls - Quick Add', () => {
  it('opens add person modal when clicking Quick Add', () => {
    (useTreeBoardStore as jest.Mock).mockReturnValue({
      viewMode: 'pedigree',
      setViewMode: jest.fn(),
      zoom: 100,
      setZoom: jest.fn(),
    });

    render(<FloatingControls treeId="tree-1" />);

    const quickAddButton = screen.getByText('Quick Add');
    fireEvent.click(quickAddButton);

    // Modal should be visible (need to check in actual component)
    expect(screen.getByText('Add New Member')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tree/__tests__/FloatingControls.add.test.tsx`
Expected: FAIL - Quick add not integrated

**Step 3: Update implementation**

```tsx
// src/components/tree/FloatingControls.tsx
// Add props and modal:

interface FloatingControlsProps {
  treeId: string;
}

export function FloatingControls({ treeId }: FloatingControlsProps) {
  // ... existing code
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Update Quick Add button:
  <button
    onClick={() => setIsAddModalOpen(true)}
    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
  >
    <MaterialSymbol icon="person_add" className="text-xl" />
    <span className="text-sm">Quick Add</span>
  </button>

  // Add modal at the end:
  <AddPersonModal
    isOpen={isAddModalOpen}
    onClose={() => setIsAddModalOpen(false)}
    treeId={treeId}
  />
}
```

```tsx
// src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx
// Update FloatingControls usage:

<FloatingControls treeId={treeId} />
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tree/__tests__/FloatingControls.add.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/tree/FloatingControls.tsx src/app/dashboard/trees/[treeId]/TreeBoardContent.tsx src/components/tree/__tests__/FloatingControls.add.test.tsx
git commit -m "feat: integrate AddPersonModal with tree board"
```

---

## Task 7: Create E2E Test for Add/Update Person Flow

**Files:**
- Create: `tests/e2e/add-update-person.spec.ts`

**Step 1: Write the test**

```typescript
// tests/e2e/add-update-person.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Add/Update Person Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should open add person modal from tree board', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Click Quick Add
    await page.click('text=Quick Add');

    // Modal should open
    await expect(page.getByText('Add New Member')).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
  });

  test('should add a new person', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');
    await page.click('text=Quick Add');

    // Fill form
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Doe');

    // Select gender
    await page.click('button:has-text("Female")');

    // Submit
    await page.click('button:has-text("Add to Family Tree")');

    // Should show success
    await expect(page.getByText('added successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should add person with relationship', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Click on a person node first
    await page.click('.react-flow__node');

    // Click add relative
    await page.click('button:has-text("Add Relative")');

    // Should show relationship options
    await expect(page.getByText('Child')).toBeVisible();
    await expect(page.getByText('Spouse')).toBeVisible();

    // Select child relationship
    await page.click('button:has-text("Child")');

    // Fill form
    await page.fill('input[name="firstName"]', 'Baby');
    await page.fill('input[name="lastName"]', 'Doe');

    // Submit
    await page.click('button:has-text("Add to Family Tree")');

    // Should show success
    await expect(page.getByText('added successfully')).toBeVisible();
  });

  test('should navigate to person profile', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');

    // Click on a person node
    await page.click('.react-flow__node');

    // Click view profile in tooltip
    await page.click('text=View Profile');

    // Should navigate to profile page
    await page.waitForURL(/\/dashboard\/persons\//);
    await expect(page.locator('h1')).toContainText(/Smith/);
  });

  test('should edit person from profile page', async ({ page }) => {
    await page.goto('/dashboard/persons/person-1');

    // Click edit button
    await page.click('text=Edit Profile');

    // Modal should open with existing data
    await expect(page.getByText('Edit Person')).toBeVisible();
    await expect(page.getByDisplayValue('John')).toBeVisible();

    // Change first name
    await page.fill('input[name="firstName"]', 'Johnny');

    // Save
    await page.click('button:has-text("Save Changes")');

    // Should update the page
    await expect(page.getByText('Johnny')).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');
    await page.click('text=Quick Add');

    // Try to submit without required fields
    await page.click('button:has-text("Add to Family Tree")');

    // Should show validation error
    await expect(page.getByText(/First name is required/i)).toBeVisible();
  });

  test('should add advanced details', async ({ page }) => {
    await page.goto('/dashboard/trees/tree-1');
    await page.click('text=Quick Add');

    // Fill basic info
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Smith');

    // Expand advanced details
    await page.click('text=Add more details');

    // Fill birth date
    await page.fill('input[name="birthDate"]', '1950-01-01');

    // Mark as deceased
    await page.check('input[type="checkbox"]');

    // Fill death date
    await page.fill('input[name="deathDate"]', '2020-12-31');

    // Submit
    await page.click('button:has-text("Add to Family Tree")');

    // Should show success
    await expect(page.getByText('added successfully')).toBeVisible();
  });
});
```

**Step 2: Run test to verify behavior**

Run: `npm run test:e2e tests/e2e/add-update-person.spec.ts`
Expected: Tests should pass or show areas needing improvement

**Step 3: Commit**

```bash
git add tests/e2e/add-update-person.spec.ts
git commit -m "test: add E2E tests for add/update person flow"
```

---

## Task 8: Run Type Check and Lint

**Files:**
- All modified files

**Step 1: Run TypeScript type check**

Run: `npm run type-check`
Expected: No type errors

**Step 2: Fix any type errors**

If errors exist, fix them and re-run.

**Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors

**Step 4: Fix any lint errors**

If errors exist, fix them and re-run.

**Step 5: Commit**

```bash
git add .
git commit -m "fix: resolve type and lint issues"
```

---

## Task 9: Final Review and Documentation

**Files:**
- Create: `docs/add-update-people-feature.md`

**Step 1: Create feature documentation**

```markdown
# Add/Update People in Tree Feature

## Overview
Allows users to add new people to family trees and edit existing person information.

## Features

### Add Person Modal
- Slide-out panel from tree board
- Basic info: first/last name, gender
- Relationship selection when connecting to existing person
- Advanced details: birth/death dates, places, occupation, biography
- Deceased toggle with validation

### Person Profile Page
- Overview tab with biography and life events
- Relationships, Media, Life Events, Sources tabs (planned)
- Edit profile functionality
- Photo management

### Edit Person Modal
- Pre-populated with existing data
- All fields from add modal
- Save changes with validation

## Components

### AddPersonModal
Slide-out panel for adding new persons.

### EditPersonModal
Modal for editing existing person data.

### PersonProfileHeader
Person info with avatar, dates, locations, stats.

### PersonProfileTabs
Navigation tabs for profile sections.

### PersonOverviewTab
Biography and key facts display.

## Hooks

### useAddPersonToTree
Mutation hook for adding persons and creating relationships.

### useUpdatePerson
Mutation hook for updating person data.

## Schemas

### personFormSchema
Zod schema for person validation.

### addPersonToTreeSchema
Extended schema with relationship data.

## API Routes

### POST /api/persons
Create a new person.

### PUT /api/persons/[id]
Update person data.

## Testing

Unit tests: `src/components/person/__tests__/`
E2E tests: `tests/e2e/add-update-person.spec.ts`
```

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 4: Final commit**

```bash
git add docs/add-update-people-feature.md
git commit -m "docs: add add/update people feature documentation"
```

---

## Summary

This plan implements complete add/update people functionality with:
- Add person modal with relationship selection
- Person profile page with overview
- Edit person modal
- Tree board integration with Quick Add
- Full test coverage (unit, E2E)
- TypeScript strict mode compliance
- SOLID architecture adherence
