# Task 18: Create Custom Hooks

**Phase:** 11 - Custom Hooks
**Priority:** High
**Dependencies:** Task 17 (Zustand Stores), Task 15 (API Routes)
**Estimated Complexity:** Medium

---

## Objective

Create reusable React hooks for common patterns: data fetching with React Query, form handling, tree operations, and utility hooks.

---

## Requirements

### Functional Requirements

1. Data fetching hooks (React Query based)
2. Mutation hooks (create, update, delete)
3. Form hooks (React Hook Form integration)
4. Tree-specific hooks (navigation, calculations)
5. Utility hooks (debounce, media query, local storage)

### Non-Functional Requirements

1. Type-safe hook interfaces
2. Consistent error handling
3. Optimistic updates where appropriate
4. Cache invalidation strategies
5. SSR compatible

---

## Hook Implementations

### 1. Data Fetching Hooks

**File:** `src/hooks/useTree.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ITree, CreateTreeDto, UpdateTreeDto } from '@/types/tree';

// Query keys factory
export const treeKeys = {
  all: ['trees'] as const,
  lists: () => [...treeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...treeKeys.lists(), filters] as const,
  details: () => [...treeKeys.all, 'detail'] as const,
  detail: (id: string) => [...treeKeys.details(), id] as const,
  stats: (id: string) => [...treeKeys.detail(id), 'stats'] as const,
};

// Fetch single tree
export function useTree(treeId: string) {
  return useQuery({
    queryKey: treeKeys.detail(treeId),
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tree');
      }
      const { data } = await response.json();
      return data as ITree;
    },
    enabled: !!treeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch user's trees
export function useTrees() {
  return useQuery({
    queryKey: treeKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/trees');
      if (!response.ok) {
        throw new Error('Failed to fetch trees');
      }
      const { data } = await response.json();
      return data as ITree[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Create tree mutation
export function useCreateTree() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTreeDto) => {
      const response = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create tree');
      }
      const { data: tree } = await response.json();
      return tree as ITree;
    },
    onSuccess: (newTree) => {
      // Update cache
      queryClient.setQueryData<ITree[]>(treeKeys.lists(), (old) =>
        old ? [...old, newTree] : [newTree]
      );
      queryClient.setQueryData(treeKeys.detail(newTree._id), newTree);
    },
  });
}

// Update tree mutation
export function useUpdateTree() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTreeDto }) => {
      const response = await fetch(`/api/trees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update tree');
      }
      const { data: tree } = await response.json();
      return tree as ITree;
    },
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: treeKeys.detail(id) });
      const previousTree = queryClient.getQueryData<ITree>(treeKeys.detail(id));

      if (previousTree) {
        queryClient.setQueryData<ITree>(treeKeys.detail(id), {
          ...previousTree,
          ...data,
        });
      }

      return { previousTree };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTree) {
        queryClient.setQueryData(treeKeys.detail(id), context.previousTree);
      }
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: treeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: treeKeys.lists() });
    },
  });
}

// Delete tree mutation
export function useDeleteTree() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/trees/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete tree');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.setQueryData<ITree[]>(treeKeys.lists(), (old) =>
        old?.filter((tree) => tree._id !== deletedId)
      );
      queryClient.removeQueries({ queryKey: treeKeys.detail(deletedId) });
    },
  });
}

// Tree stats
export function useTreeStats(treeId: string) {
  return useQuery({
    queryKey: treeKeys.stats(treeId),
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const { data } = await response.json();
      return data;
    },
    enabled: !!treeId,
    staleTime: 60 * 1000, // 1 minute
  });
}
```

### 2. Person Hooks

**File:** `src/hooks/usePerson.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IPerson, CreatePersonDto, UpdatePersonDto } from '@/types/person';
import { treeKeys } from './useTree';

export const personKeys = {
  all: ['persons'] as const,
  byTree: (treeId: string) => [...personKeys.all, 'tree', treeId] as const,
  detail: (id: string) => [...personKeys.all, id] as const,
  family: (id: string) => [...personKeys.detail(id), 'family'] as const,
  ancestors: (id: string, generations?: number) =>
    [...personKeys.detail(id), 'ancestors', generations] as const,
};

// Fetch persons by tree
export function usePersonsByTree(treeId: string) {
  return useQuery({
    queryKey: personKeys.byTree(treeId),
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}/persons`);
      if (!response.ok) throw new Error('Failed to fetch persons');
      const { data } = await response.json();
      return data as IPerson[];
    },
    enabled: !!treeId,
  });
}

// Fetch single person
export function usePerson(personId: string) {
  return useQuery({
    queryKey: personKeys.detail(personId),
    queryFn: async () => {
      const response = await fetch(`/api/persons/${personId}`);
      if (!response.ok) throw new Error('Failed to fetch person');
      const { data } = await response.json();
      return data as IPerson;
    },
    enabled: !!personId,
  });
}

// Create person
export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePersonDto & { treeId: string }) => {
      const response = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create person');
      }
      const { data: person } = await response.json();
      return person as IPerson;
    },
    onSuccess: (newPerson) => {
      // Add to tree's person list
      queryClient.setQueryData<IPerson[]>(
        personKeys.byTree(newPerson.treeId),
        (old) => (old ? [...old, newPerson] : [newPerson])
      );
      queryClient.setQueryData(personKeys.detail(newPerson._id), newPerson);

      // Invalidate tree stats
      queryClient.invalidateQueries({ queryKey: treeKeys.stats(newPerson.treeId) });
    },
  });
}

// Update person
export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePersonDto }) => {
      const response = await fetch(`/api/persons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update person');
      }
      const { data: person } = await response.json();
      return person as IPerson;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: personKeys.detail(id) });
      const previousPerson = queryClient.getQueryData<IPerson>(personKeys.detail(id));

      if (previousPerson) {
        queryClient.setQueryData<IPerson>(personKeys.detail(id), {
          ...previousPerson,
          ...data,
        });
      }

      return { previousPerson };
    },
    onError: (err, { id }, context) => {
      if (context?.previousPerson) {
        queryClient.setQueryData(personKeys.detail(id), context.previousPerson);
      }
    },
    onSettled: (person) => {
      if (person) {
        queryClient.invalidateQueries({ queryKey: personKeys.detail(person._id) });
        queryClient.invalidateQueries({ queryKey: personKeys.byTree(person.treeId) });
      }
    },
  });
}

// Delete person
export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, treeId }: { id: string; treeId: string }) => {
      const response = await fetch(`/api/persons/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete person');
      }
      return { id, treeId };
    },
    onSuccess: ({ id, treeId }) => {
      queryClient.setQueryData<IPerson[]>(personKeys.byTree(treeId), (old) =>
        old?.filter((p) => p._id !== id)
      );
      queryClient.removeQueries({ queryKey: personKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: treeKeys.stats(treeId) });
    },
  });
}

// Get family members
export function useFamily(personId: string) {
  return useQuery({
    queryKey: personKeys.family(personId),
    queryFn: async () => {
      const response = await fetch(`/api/persons/${personId}/family`);
      if (!response.ok) throw new Error('Failed to fetch family');
      const { data } = await response.json();
      return data as {
        parents: IPerson[];
        children: IPerson[];
        spouses: IPerson[];
        siblings: IPerson[];
      };
    },
    enabled: !!personId,
  });
}
```

### 3. Form Hooks

**File:** `src/hooks/usePersonForm.ts`

```typescript
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IPerson } from '@/types/person';
import { useCreatePerson, useUpdatePerson } from './usePerson';
import { useToast } from '@/store/uiStore';

export const personFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().max(200).optional(),
  deathDate: z.string().optional(),
  deathPlace: z.string().max(200).optional(),
  isLiving: z.boolean().default(true),
  biography: z.string().max(5000).optional(),
}).refine(
  (data) => {
    if (data.birthDate && data.deathDate) {
      return new Date(data.deathDate) >= new Date(data.birthDate);
    }
    return true;
  },
  {
    message: 'Death date cannot be before birth date',
    path: ['deathDate'],
  }
);

export type PersonFormData = z.infer<typeof personFormSchema>;

interface UsePersonFormOptions {
  treeId: string;
  person?: IPerson;
  onSuccess?: (person: IPerson) => void;
  onError?: (error: Error) => void;
}

interface UsePersonFormReturn {
  form: UseFormReturn<PersonFormData>;
  onSubmit: (data: PersonFormData) => Promise<void>;
  isSubmitting: boolean;
  isEdit: boolean;
}

export function usePersonForm({
  treeId,
  person,
  onSuccess,
  onError,
}: UsePersonFormOptions): UsePersonFormReturn {
  const toast = useToast();
  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();

  const isEdit = !!person;

  const form = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: person
      ? {
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: person.middleName || '',
          gender: person.gender || 'unknown',
          birthDate: person.birthDate
            ? new Date(person.birthDate).toISOString().split('T')[0]
            : '',
          birthPlace: person.birthPlace || '',
          deathDate: person.deathDate
            ? new Date(person.deathDate).toISOString().split('T')[0]
            : '',
          deathPlace: person.deathPlace || '',
          isLiving: person.isLiving ?? true,
          biography: person.biography || '',
        }
      : {
          firstName: '',
          lastName: '',
          isLiving: true,
        },
  });

  const onSubmit = async (data: PersonFormData) => {
    try {
      let result: IPerson;

      if (isEdit && person) {
        result = await updateMutation.mutateAsync({
          id: person._id,
          data: {
            ...data,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
          },
        });
        toast.success('Person updated successfully');
      } else {
        result = await createMutation.mutateAsync({
          treeId,
          ...data,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
        });
        toast.success('Person added successfully');
      }

      onSuccess?.(result);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
      onError?.(err);
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isEdit,
  };
}
```

### 4. Utility Hooks

**File:** `src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => callback(...args), delay));
  }) as T;

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  return debouncedCallback;
}
```

**File:** `src/hooks/useMediaQuery.ts`

```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Preset breakpoints
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
```

**File:** `src/hooks/useLocalStorage.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initial value
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Set value to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [initialValue, key]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
```

**File:** `src/hooks/useClickOutside.ts`

```typescript
import { useEffect, useRef, RefObject } from 'react';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown'
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      handler();
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, mouseEvent]);

  return ref;
}
```

---

## Export Barrel

**File:** `src/hooks/index.ts`

```typescript
// Data hooks
export * from './useTree';
export * from './usePerson';
export * from './useRelationship';
export * from './useMedia';
export * from './useDashboard';

// Form hooks
export * from './usePersonForm';
export * from './useTreeForm';

// Utility hooks
export * from './useDebounce';
export * from './useMediaQuery';
export * from './useLocalStorage';
export * from './useClickOutside';
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Network failure | Show error toast, allow retry |
| Stale cache | Invalidate on mutation success |
| Optimistic rollback | Restore previous state on error |
| SSR hydration | Use enabled flag, check typeof window |
| Concurrent mutations | Queue or cancel previous |
| Large response | Implement pagination |
| Missing data | Return null, show placeholder |

---

## Acceptance Criteria

- [ ] All data fetching hooks created
- [ ] All mutation hooks with optimistic updates
- [ ] Form hooks with validation
- [ ] Utility hooks implemented
- [ ] Proper TypeScript types
- [ ] React Query integration
- [ ] Error handling
- [ ] Unit tests
- [ ] Documentation
