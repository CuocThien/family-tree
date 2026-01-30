# Add New Tree Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement "Add New Tree" functionality with modal form, tree creation service integration, and dashboard integration.

**Architecture:**
- Modal component using existing UI components
- Service layer (TreeService) for business logic
- Repository pattern for data persistence
- Form validation with React Hook Form + Zod

**Tech Stack:**
- React Hook Form for form management
- Zod for schema validation
- TanStack Query for data fetching
- Tailwind CSS for styling

---

## Task 1: Create Tree Schema Validation

**Files:**
- Create: `src/schemas/tree.ts`
- Test: `src/schemas/__tests__/tree.test.ts`

**Step 1: Write the failing test**

```typescript
// src/schemas/__tests__/tree.test.ts

import { treeSchema, treeFormSchema } from '../tree';

describe('Tree Schemas', () => {
  describe('treeSchema', () => {
    const validTree = {
      name: 'Smith Family Tree',
      description: 'The Smith family lineage',
      rootPersonId: 'person-1',
      isPublic: false,
    };

    it('should validate a valid tree', () => {
      const result = treeSchema.safeParse(validTree);
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = treeSchema.safeParse({ ...validTree, name: '' });
      expect(result.success).toBe(false);
    });

    it('should limit name length', () => {
      const result = treeSchema.safeParse({ ...validTree, name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const result = treeSchema.safeParse({ ...validTree, description: undefined });
      expect(result.success).toBe(true);
    });
  });

  describe('treeFormSchema', () => {
    const validForm = {
      name: 'My Family Tree',
      description: 'A description',
    };

    it('should validate form input', () => {
      const result = treeFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/tree.test.ts`
Expected: FAIL - Schema doesn't exist

**Step 3: Write minimal implementation**

```typescript
// src/schemas/tree.ts

import { z } from 'zod';

/**
 * Tree name validation
 * - Required
 * - 3-100 characters
 * - Alphanumeric with spaces, hyphens, apostrophes
 */
const treeNameSchema = z
  .string({
    required_error: 'Tree name is required',
  })
  .min(3, 'Tree name must be at least 3 characters')
  .max(100, 'Tree name must not exceed 100 characters')
  .regex(
    /^[a-zA-Z0-9\s\-'\u00C0-\u00FF]+$/,
    'Tree name can only contain letters, numbers, spaces, hyphens, and apostrophes'
  );

/**
 * Tree description validation
 * - Optional
 * - Max 500 characters
 */
const treeDescriptionSchema = z
  .string()
  .max(500, 'Description must not exceed 500 characters')
  .optional();

/**
 * Tree visibility setting
 */
const treeVisibilitySchema = z.enum(['private', 'family', 'public'], {
  errorMap: () => ({ message: 'Invalid visibility setting' }),
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

**Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/tree.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/schemas/tree.ts src/schemas/__tests__/tree.test.ts
git commit -m "feat: add tree validation schemas"
```

---

## Task 2: Create CreateTreeModal Component

**Files:**
- Create: `src/components/dashboard/CreateTreeModal.tsx`
- Test: `src/components/dashboard/__tests__/CreateTreeModal.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/dashboard/__tests__/CreateTreeModal.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTreeModal } from '../CreateTreeModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('CreateTreeModal', () => {
  it('renders modal with form', () => {
    renderWithQueryClient(
      <CreateTreeModal isOpen onClose={() => {}} />
    );

    expect(screen.getByText(/Create New Family Tree/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tree Name/i)).toBeInTheDocument();
  });

  it('should validate tree name', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <CreateTreeModal isOpen onClose={() => {}} />
    );

    const submitButton = screen.getByRole('button', { name: /Create Tree/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Tree name is required/i)).toBeInTheDocument();
    });
  });

  it('should call onCreate with form data', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn();
    const onClose = jest.fn();

    renderWithQueryClient(
      <CreateTreeModal isOpen onClose={onClose} onCreate={onCreate} />
    );

    await user.type(screen.getByLabelText(/Tree Name/i), 'Smith Family Tree');
    await user.type(screen.getByLabelText(/Description/i), 'The Smith lineage');

    fireEvent.click(screen.getByRole('button', { name: /Create Tree/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        name: 'Smith Family Tree',
        description: 'The Smith lineage',
        visibility: 'private',
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/dashboard/__tests__/CreateTreeModal.test.tsx`
Expected: FAIL - Component doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/components/dashboard/CreateTreeModal.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Spinner } from '@/components/ui/Spinner';
import { treeFormSchema, type TreeFormInput } from '@/schemas/tree';
import { cn } from '@/lib/utils';

interface CreateTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (data: TreeFormInput) => void;
}

type VisibilityType = 'private' | 'family' | 'public';

export function CreateTreeModal({ isOpen, onClose, onCreate }: CreateTreeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityType>('private');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TreeFormInput>({
    resolver: zodResolver(treeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      visibility: 'private',
      allowCollaborators: false,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: TreeFormInput) => {
    setIsSubmitting(true);
    try {
      if (onCreate) {
        await onCreate({ ...data, visibility });
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create tree:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#152528] rounded-2xl shadow-2xl border border-[#e7f1f3] dark:border-[#2a3a3d] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e7f1f3] dark:border-[#2a3a3d]">
          <div>
            <h2 className="text-2xl font-bold text-[#0d191b] dark:text-white">
              Create New Family Tree
            </h2>
            <p className="text-sm text-[#4c8d9a] mt-1">
              Start documenting your family heritage
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center rounded-xl size-10 hover:bg-[#f0f5f6] dark:hover:bg-[#1f2f32] transition-colors"
          >
            <MaterialSymbol icon="close" className="text-[#4c8d9a]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Tree Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-[#0d191b] dark:text-white">
              Tree Name *
            </label>
            <Input
              id="name"
              placeholder="e.g., Smith Family Tree"
              error={errors.name?.message}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-[#0d191b] dark:text-white">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Brief description of your family tree..."
              rows={3}
              error={errors.description?.message}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#0d191b] dark:text-white">
              Who can view this tree?
            </label>
            <div className="space-y-2">
              {[
                { value: 'private', label: 'Private', description: 'Only you can view' },
                { value: 'family', label: 'Family', description: 'Invite family members' },
                { value: 'public', label: 'Public', description: 'Anyone with link' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value as VisibilityType)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                    visibility === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-[#e7f1f3] dark:border-[#2a3a3d] hover:border-primary/50'
                  )}
                >
                  <div className="text-left">
                    <p className="font-semibold text-[#0d191b] dark:text-white">{option.label}</p>
                    <p className="text-sm text-[#4c8d9a]">{option.description}</p>
                  </div>
                  <div
                    className={cn(
                      'size-5 rounded-full border-2 flex items-center justify-center',
                      visibility === option.value
                        ? 'border-primary bg-primary'
                        : 'border-[#cbd5e1]'
                    )}
                  >
                    {visibility === option.value && (
                      <div className="size-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Allow Collaborators Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#e7f1f3] dark:bg-[#2a3a3d]">
            <div>
              <p className="font-semibold text-[#0d191b] dark:text-white">
                Allow Collaborators
              </p>
              <p className="text-sm text-[#4c8d9a]">
                Let family members add and edit people
              </p>
            </div>
            <Toggle {...register('allowCollaborators')} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Tree'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/dashboard/__tests__/CreateTreeModal.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/CreateTreeModal.tsx src/components/dashboard/__tests__/CreateTreeModal.test.tsx
git commit -m "feat: add CreateTreeModal component"
```

---

## Task 3: Create useCreateTree Hook

**Files:**
- Create: `src/hooks/useCreateTree.ts`
- Test: `src/hooks/__tests__/useCreateTree.test.ts`

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/useCreateTree.test.ts

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTree } from '../useCreateTree';
import { treeService } from '@/services/tree/TreeService';

jest.mock('@/services/tree/TreeService');

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

describe('useCreateTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create tree successfully', async () => {
    const mockTree = {
      id: 'tree-1',
      name: 'Smith Family Tree',
      description: 'The Smith lineage',
      ownerId: 'user-1',
    };

    (treeService.createTree as jest.Mock).mockResolvedValue(mockTree);

    const { result } = renderHook(() => useCreateTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.createTree.mutateAsync({
        name: 'Smith Family Tree',
        description: 'The Smith lineage',
        visibility: 'private',
        allowCollaborators: false,
      });

      expect(response).toEqual({
        success: true,
        data: mockTree,
      });
    });
  });

  it('should handle validation errors', async () => {
    const mockError = new Error('Validation failed');
    (treeService.createTree as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useCreateTree(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const response = await result.current.createTree.mutateAsync({
        name: 'AB', // Too short
        description: '',
        visibility: 'private',
        allowCollaborators: false,
      });

      expect(response).toEqual({
        success: false,
        error: 'Validation failed',
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/__tests__/useCreateTree.test.ts`
Expected: FAIL - Hook doesn't exist

**Step 3: Write minimal implementation**

```typescript
// src/hooks/useCreateTree.ts

import { useMutation } from '@tanstack/react-query';
import { treeService } from '@/services/tree/TreeService';
import type { TreeFormInput } from '@/schemas/tree';

interface CreateTreeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function useCreateTree() {
  const createTree = useMutation({
    mutationFn: async (data: TreeFormInput): Promise<CreateTreeResponse> => {
      try {
        // Validate input using service
        const validationResult = await treeService.validateTreeData(data);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: validationResult.errors?.join(', ') || 'Validation failed',
          };
        }

        // Create tree
        const newTree = await treeService.createTree({
          name: data.name,
          description: data.description,
          isPublic: data.visibility === 'public',
          settings: {
            allowCollaborators: data.allowCollaborators,
          },
        });

        return {
          success: true,
          data: newTree,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create tree',
        };
      }
    },
  });

  return { createTree };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/__tests__/useCreateTree.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useCreateTree.ts src/hooks/__tests__/useCreateTree.test.ts
git commit -m "feat: add useCreateTree hook"
```

---

## Task 4: Update DashboardContent to Include Create Tree Button

**Files:**
- Modify: `src/components/dashboard/DashboardContent.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/dashboard/__tests__/DashboardContent.create.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardContent } from '../DashboardContent';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('DashboardContent - Create Tree', () => {
  it('renders create tree button', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardContent />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Create New Tree/i)).toBeInTheDocument();
  });

  it('opens modal when clicking create button', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardContent />
      </QueryClientProvider>
    );

    const createButton = screen.getByText(/Create New Tree/i);
    fireEvent.click(createButton);

    expect(screen.getByText(/Create New Family Tree/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/dashboard/__tests__/DashboardContent.create.test.tsx`
Expected: FAIL - Button doesn't exist or modal not integrated

**Step 3: Update implementation**

```tsx
// src/components/dashboard/DashboardContent.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardNavbar } from './DashboardNavbar';
import { TreeGrid } from './TreeGrid';
import { ActivityTimeline } from './ActivityTimeline';
import { CreateTreeModal } from './CreateTreeModal';
import { Button } from '@/components/ui/Button';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { treeService } from '@/services/tree/TreeService';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { TreeFormInput } from '@/schemas/tree';

export function DashboardContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const { data: trees = [], isLoading } = useQuery({
    queryKey: ['trees', session?.user?.id],
    queryFn: () => treeService.getTreesByUserId(session?.user?.id || ''),
    enabled: !!session?.user?.id,
  });

  const handleCreateTree = async (data: TreeFormInput) => {
    // The mutation will be handled by the modal's internal hook
    // After success, navigate to the new tree
    router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardNavbar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0d191b] dark:text-white">
                Welcome back, {session?.user?.name || 'User'}
              </h1>
              <p className="text-[#4c8d9a] mt-1">
                You have {trees.length} family {trees.length === 1 ? 'tree' : 'trees'}
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2"
            >
              <MaterialSymbol icon="add" />
              Create New Tree
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#152528] rounded-xl p-6 border border-[#e7f1f3] dark:border-[#2a3a3d]">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MaterialSymbol icon="account_tree" className="text-primary text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0d191b] dark:text-white">
                    {trees.length}
                  </p>
                  <p className="text-sm text-[#4c8d9a]">Family Trees</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#152528] rounded-xl p-6 border border-[#e7f1f3] dark:border-[#2a3a3d]">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MaterialSymbol icon="people" className="text-primary text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0d191b] dark:text-white">
                    {trees.reduce((acc, tree) => acc + (tree.personCount || 0), 0)}
                  </p>
                  <p className="text-sm text-[#4c8d9a]">Total People</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#152528] rounded-xl p-6 border border-[#e7f1f3] dark:border-[#2a3a3d]">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MaterialSymbol icon="schedule" className="text-primary text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0d191b] dark:text-white">7</p>
                  <p className="text-sm text-[#4c8d9a]">Days Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trees Grid */}
          <div>
            <h2 className="text-xl font-bold text-[#0d191b] dark:text-white mb-4">
              Your Family Trees
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 bg-[#e7f1f3] dark:bg-[#2a3a3d] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : trees.length === 0 ? (
              <div className="text-center py-12">
                <div className="size-16 rounded-full bg-[#e7f1f3] dark:bg-[#2a3a3d] flex items-center justify-center mx-auto mb-4">
                  <MaterialSymbol icon="account_tree" className="text-3xl text-[#4c8d9a]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0d191b] dark:text-white mb-2">
                  No family trees yet
                </h3>
                <p className="text-[#4c8d9a] mb-4">Create your first family tree to get started</p>
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="gap-2"
                >
                  <MaterialSymbol icon="add" />
                  Create Your First Tree
                </Button>
              </div>
            ) : (
              <TreeGrid trees={trees} />
            )}
          </div>

          {/* Activity Timeline */}
          <ActivityTimeline />
        </div>
      </main>

      {/* Create Tree Modal */}
      <CreateTreeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTree}
      />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/dashboard/__tests__/DashboardContent.create.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/DashboardContent.tsx src/components/dashboard/__tests__/DashboardContent.create.test.tsx
git commit -m "feat: integrate create tree button in dashboard"
```

---

## Task 5: Create E2E Test for Create Tree Flow

**Files:**
- Create: `tests/e2e/create-tree.spec.ts`

**Step 1: Write the test**

```typescript
// tests/e2e/create-tree.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Create Tree Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should show create tree button on dashboard', async ({ page }) => {
    await expect(page.getByText('Create New Tree')).toBeVisible();
  });

  test('should open create tree modal', async ({ page }) => {
    await page.click('text=Create New Tree');

    await expect(page.getByText('Create New Family Tree')).toBeVisible();
    await expect(page.getByLabel('Tree Name')).toBeVisible();
  });

  test('should validate tree name', async ({ page }) => {
    await page.click('text=Create New Tree');

    // Try to submit without name
    await page.click('button:has-text("Create Tree")');

    // Should show validation error
    await expect(page.getByText(/Tree name is required/i)).toBeVisible();
  });

  test('should create a new tree', async ({ page }) => {
    await page.click('text=Create New Tree');

    // Fill form
    await page.fill('input[name="name"]', 'My Test Family Tree');
    await page.fill('textarea[name="description"]', 'This is a test tree');

    // Select visibility
    await page.click('button:has-text("Private")');

    // Submit
    await page.click('button:has-text("Create Tree")');

    // Should redirect to tree board
    await page.waitForURL(/\/dashboard\/trees\/.+/, { timeout: 5000 });

    // Verify tree name is visible
    await expect(page.getByText('My Test Family Tree')).toBeVisible();
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.click('text=Create New Tree');

    // Click backdrop to close
    await page.click('.fixed.inset-0');

    // Modal should be closed
    await expect(page.getByText('Create New Family Tree')).not.toBeVisible();
  });

  test('should switch visibility options', async ({ page }) => {
    await page.click('text=Create New Tree');

    // Click Family option
    await page.click('button:has-text("Family")');

    // Family should be selected
    const familyButton = page.locator('button').filter({ hasText: 'Family' });
    await expect(familyButton).toHaveClass(/border-primary/);
  });

  test('should toggle collaborators option', async ({ page }) => {
    await page.click('text=Create New Tree');

    // Find the toggle
    const toggle = page.locator('input[type="checkbox"]').first();

    // Check initial state (should be unchecked)
    await expect(toggle).not.toBeChecked();

    // Click to toggle
    await toggle.click();

    // Should now be checked
    await expect(toggle).toBeChecked();
  });
});
```

**Step 2: Run test to verify behavior**

Run: `npm run test:e2e tests/e2e/create-tree.spec.ts`
Expected: Tests should pass or show areas needing improvement

**Step 3: Commit**

```bash
git add tests/e2e/create-tree.spec.ts
git commit -m "test: add E2E tests for create tree flow"
```

---

## Task 6: Add Toast Notifications for Success/Error

**Files:**
- Create: `src/components/ui/Toast.tsx`
- Create: `src/hooks/useToast.ts`
- Modify: `src/components/dashboard/CreateTreeModal.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/ui/__tests__/Toast.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { Toast } from '../Toast';
import { useToast } from '@/hooks/useToast';

describe('Toast', () => {
  it('renders success message', () => {
    render(
      <Toast
        message="Tree created successfully"
        type="success"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Tree created successfully')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(
      <Toast
        message="Failed to create tree"
        type="error"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Failed to create tree')).toBeInTheDocument();
  });

  it('auto-dismisses after timeout', async () => {
    const onClose = jest.fn();
    render(
      <Toast
        message="Test message"
        type="success"
        onClose={onClose}
        duration={1000}
      />
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2000 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/__tests__/Toast.test.tsx`
Expected: FAIL - Toast doesn't exist

**Step 3: Write minimal implementation**

```tsx
// src/components/ui/Toast.tsx

'use client';

import { useEffect } from 'react';
import { MaterialSymbol } from './MaterialSymbol';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: 'check_circle',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
    },
    error: {
      icon: 'error',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
    },
    warning: {
      icon: 'warning',
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
    },
    info: {
      icon: 'info',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
    },
  };

  const { icon, bgColor, textColor } = config[type];

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
        bgColor,
        textColor
      )}
    >
      <MaterialSymbol icon={icon} />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition-opacity"
      >
        <MaterialSymbol icon="close" className="text-sm" />
      </button>
    </div>
  );
}
```

```typescript
// src/hooks/useToast.ts

import { create } from 'zustand';

interface ToastState {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'info') =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Math.random().toString(36).substring(7), message, type },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
```

**Step 4: Update CreateTreeModal to use toast**

```tsx
// src/components/dashboard/CreateTreeModal.tsx
// Add import:
import { useToast } from '@/hooks/useToast';

// Inside component:
export function CreateTreeModal({ isOpen, onClose, onCreate }: CreateTreeModalProps) {
  const { showToast } = useToast();
  // ... existing code

  const onSubmit = async (data: TreeFormInput) => {
    setIsSubmitting(true);
    try {
      if (onCreate) {
        const result = await onCreate({ ...data, visibility });
        if (result.success) {
          showToast('Tree created successfully!', 'success');
        } else {
          showToast(result.error || 'Failed to create tree', 'error');
        }
      }
      reset();
      onClose();
    } catch (error) {
      showToast('Failed to create tree', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  // ... rest of code
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- src/components/ui/__tests__/Toast.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/ui/Toast.tsx src/hooks/useToast.ts src/components/ui/__tests__/Toast.test.tsx src/components/dashboard/CreateTreeModal.tsx
git commit -m "feat: add toast notifications"
```

---

## Task 7: Run Type Check and Lint

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

## Task 8: Final Review and Documentation

**Files:**
- Create: `docs/create-tree-feature.md`

**Step 1: Create feature documentation**

```markdown
# Create New Tree Feature

## Overview
Allows users to create new family trees from the dashboard with a modal form.

## Features

### Modal Form
- Tree name input (required, 3-100 characters)
- Description textarea (optional, max 500 characters)
- Visibility selection (Private, Family, Public)
- Collaborators toggle

### Validation
- Client-side validation with Zod
- Server-side validation via TreeService
- Real-time error messages

### State Management
- React Hook Form for form state
- TanStack Query for server mutation
- Zustand for toast notifications

## Components

### CreateTreeModal
Main modal component with form.

### Toast
Notification component for success/error feedback.

## Hooks

### useCreateTree
Mutation hook for creating trees.

### useToast
Toast notification state management.

## Schemas

### treeFormSchema
Zod schema for form validation.

## API Routes

### POST /api/trees
Create a new family tree.

Request body:
```json
{
  "name": "Smith Family Tree",
  "description": "The Smith family lineage",
  "isPublic": false,
  "settings": {
    "allowCollaborators": false
  }
}
```

Response:
```json
{
  "id": "tree-123",
  "name": "Smith Family Tree",
  "ownerId": "user-123",
  "createdAt": "2024-01-30T00:00:00.000Z"
}
```

## Testing

Unit tests: `src/components/dashboard/__tests__/CreateTreeModal.test.tsx`
E2E tests: `tests/e2e/create-tree.spec.ts`
```

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 4: Final commit**

```bash
git add docs/create-tree-feature.md
git commit -m "docs: add create tree feature documentation"
```

---

## Summary

This plan implements complete "Add New Tree" functionality with:
- Modal form with validation
- Service layer integration
- Toast notifications
- Dashboard integration
- Full test coverage (unit, E2E)
- TypeScript strict mode compliance
- SOLID architecture adherence
