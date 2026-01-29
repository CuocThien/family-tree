# Next.js Best Practices Guide - Family Tree Application

**Version:** 1.0
**Last Updated:** 2026-01-29
**Purpose:** Project-specific Next.js best practices and patterns

---

## Table of Contents

- [Server vs Client Components](#server-vs-client-components)
- [Data Fetching Patterns](#data-fetching-patterns)
- [Performance Optimization](#performance-optimization)
- [Caching Strategies](#caching-strategies)
- [Code Organization](#code-organization)
- [Common Patterns](#common-patterns)

---

## Server vs Client Components

### Default to Server Components

**Rule:** Always use Server Components (no 'use client') unless you need interactivity.

**When to use Server Components:**
- Fetching data
- Displaying static content
- SEO-critical pages
- Large data processing

**When to add 'use client':**
- Event handlers (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, window, etc.)
- Third-party libraries requiring client-side rendering

### Example: Server Component

```typescript
// ✅ GOOD - Server Component for data fetching
import { container } from '@/lib/di/instance';
import { PersonListClient } from './PersonListClient';

export default async function PersonsPage({
  params,
}: {
  params: Promise<{ treeId: string }>;
}) {
  const { treeId } = await params;

  // Data fetched server-side
  const persons = await container.personService.getPersonsByTreeId(
    treeId,
    getUserId()
  );

  // Pass data to client component for interactivity
  return <PersonListClient persons={persons} treeId={treeId} />;
}
```

### Example: Client Component

```typescript
// ✅ GOOD - Client Component for interactivity
'use client';

import { useState } from 'react';

export function PersonListClient({
  persons,
  treeId,
}: {
  persons: IPerson[];
  treeId: string;
}) {
  const [selectedPerson, setSelectedPerson] = useState<IPerson | null>(null);

  return (
    <div>
      {persons.map((person) => (
        <PersonCard
          key={person._id}
          person={person}
          onClick={() => setSelectedPerson(person)}
        />
      ))}
    </div>
  );
}
```

### ❌ Anti-Pattern: Unnecessary Client Component

```typescript
// ❌ BAD - 'use client' not needed for static display
'use client';

export function PersonDisplayName({ name }: { name: string }) {
  return <div>{name}</div>;
}
```

---

## Data Fetching Patterns

### 1. Server-Side Fetching (Preferred)

**Use when:** Data is needed for initial page render, SEO is important

```typescript
// In a Server Component
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Fetch data server-side
  const trees = await container.treeService.getTreesByUserId(
    session.user.id
  );

  // Pass to client component
  return <DashboardContent initialTrees={trees} />;
}
```

### 2. React Query for Client-Side Fetching

**Use when:** Data changes frequently, real-time updates needed, user interactions

```typescript
// hooks/useTreeData.ts
import { useQuery } from '@tanstack/react-query';

export function useTreeData(treeId: string) {
  return useQuery({
    queryKey: ['tree', treeId],
    queryFn: async () => {
      const [persons, relationships] = await Promise.all([
        fetch(`/api/trees/${treeId}/persons`).then(r => r.json()),
        fetch(`/api/trees/${treeId}/relationships`).then(r => r.json()),
      ]);
      return { persons, relationships };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3. Server Actions for Mutations

**Use when:** Form submissions, state changes

```typescript
// app/actions/person.ts
'use server';

export async function createPerson(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const result = await container.personService.createPerson(
    formData.get('treeId') as string,
    session.user.id,
    Object.fromEntries(formData)
  );

  revalidatePath('/trees/[treeId]');
  return result;
}

// In component
<form action={createPerson}>
  <input name="firstName" required />
  <button type="submit">Create</button>
</form>
```

### ❌ Anti-Pattern: useEffect for Data Fetching

```typescript
// ❌ BAD - Don't use useEffect for initial data fetch
useEffect(() => {
  fetch('/api/persons').then(r => r.json()).then(setPersons);
}, []);

// ✅ GOOD - Use React Query or Server Component
const { data: persons } = useQuery({
  queryKey: ['persons'],
  queryFn: () => fetch('/api/persons').then(r => r.json()),
});
```

---

## Performance Optimization

### 1. Dynamic Imports

**Use for:** Large components, route-level code splitting

```typescript
// ✅ GOOD - Dynamic import for heavy component
import dynamic from 'next/dynamic';

const TreeCanvas = dynamic(
  () => import('@/components/tree/TreeCanvas').then(m => ({ default: m.TreeCanvas })),
  {
    loading: () => <TreeBoardSkeleton />,
    ssr: false, // ReactFlow doesn't support SSR
  }
);

export function TreeBoard({ treeId }: { treeId: string }) {
  return <TreeCanvas treeId={treeId} />;
}
```

### 2. Image Optimization

**Always use next/image:**

```typescript
// ✅ GOOD - Using next/image
import Image from 'next/image';

export function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="rounded-full"
    />
  );
}

// ❌ BAD - Using regular img tag
export function Avatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} width={40} height={40} />;
}
```

### 3. Component Memoization

**Use for:** Expensive components, list items

```typescript
// ✅ GOOD - Memoized component
export const PersonCard = React.memo(function PersonCard({
  person,
  onClick,
}: {
  person: IPerson;
  onClick: (person: IPerson) => void;
}) {
  return (
    <div onClick={() => onClick(person)}>
      {person.firstName} {person.lastName}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.person._id === nextProps.person._id &&
         prevProps.person.updatedAt === nextProps.person.updatedAt;
});
```

### 4. useCallback for Event Handlers

```typescript
// ✅ GOOD - Using useCallback
function PersonList({ persons }: { persons: IPerson[] }) {
  const handleClick = useCallback((personId: string) => {
    // Handle click
  }, []);

  return (
    <div>
      {persons.map(person => (
        <PersonCard
          key={person._id}
          person={person}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}
```

### 5. useMemo for Expensive Calculations

```typescript
// ✅ GOOD - Using useMemo
function TreeStats({ tree }: { tree: ITree }) {
  const stats = useMemo(() => {
    // Expensive calculation
    return calculateTreeStats(tree);
  }, [tree.id, tree.updatedAt]); // Dependencies

  return <div>{stats.memberCount} members</div>;
}
```

---

## Caching Strategies

### 1. Next.js Fetch Caching

```typescript
// API Route with caching
export async function GET(request: Request) {
  const data = await fetch('https://api.example.com/data', {
    next: {
      revalidate: 300, // 5 minutes
      tags: ['tree-data'],
    },
  });

  return NextResponse.json(data);
}
```

### 2. React Query Caching

```typescript
// Configure QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: 1,
    },
  },
});

// Use cache keys effectively
useQuery({
  queryKey: ['person', personId],
  queryFn: () => fetch(`/api/persons/${personId}`).then(r => r.json()),
});

// Invalidate cache when data changes
queryClient.invalidateQueries({ queryKey: ['person', personId] });
```

### 3. Redis Caching for Server-Side

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// Use in API routes
export async function getCachedTreeStats(treeId: string) {
  const cached = await redis.get(`tree:${treeId}:stats`);
  if (cached) return cached;

  const stats = await container.treeService.getTreeStats(treeId);
  await redis.set(`tree:${treeId}:stats`, stats, { ex: 300 }); // 5 min
  return stats;
}
```

### 4. unstable_cache for Server Components

```typescript
import { unstable_cache } from 'next/cache';

const getCachedTreeStats = unstable_cache(
  async (treeId: string) => {
    return await container.treeService.getTreeStats(treeId);
  },
  ['tree-stats'],
  { revalidate: 300 } // 5 minutes
);

// Use in Server Component
export default async function TreePage({ params }: { params: { id: string } }) {
  const stats = await getCachedTreeStats(params.id);
  return <TreeStatsView stats={stats} />;
}
```

---

## Code Organization

### File Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth route group
│   ├── (dashboard)/         # Dashboard route group
│   ├── api/                 # API routes
│   │   ├── persons/        # Person endpoints
│   │   ├── trees/          # Tree endpoints
│   │   └── ...
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   ├── person/             # Person-related components
│   ├── tree/               # Tree-related components
│   └── dashboard/          # Dashboard components
├── hooks/                   # Custom React hooks
│   ├── usePerson.ts
│   ├── useTreeData.ts
│   └── ...
├── services/                # Business logic layer
│   ├── person/
│   ├── tree/
│   └── ...
├── repositories/            # Data access layer
│   ├── interfaces/
│   └── mongodb/
├── models/                  # Mongoose models
├── lib/                     # Utilities
│   ├── di/                 # Dependency injection
│   ├── api/                # API utilities
│   ├── auth/               # Authentication
│   └── ...
├── types/                   # TypeScript types
│   ├── dtos/               # Data transfer objects
│   ├── person.ts
│   └── ...
└── strategies/              # Strategy patterns
    ├── visualization/
    ├── storage/
    └── permission/
```

### Naming Conventions

**Components:** PascalCase
```
PersonCard.tsx
TreeCanvas.tsx
DashboardLayout.tsx
```

**Hooks:** camelCase with 'use' prefix
```
usePerson.ts
useTreeData.ts
useAuth.ts
```

**Services:** PascalCase
```
PersonService.ts
TreeService.ts
```

**Interfaces:** PascalCase with 'I' prefix
```
IPerson.ts
ITreeService.ts
IPersonRepository.ts
```

**API Routes:** lowercase with hyphens
```
app/api/persons/route.ts
app/api/trees/[id]/route.ts
```

---

## Common Patterns

### 1. API Route with Auth

```typescript
// app/api/persons/route.ts
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { CreatePersonDtoSchema } from '@/types/dtos/person';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const persons = await container.personService.getPersonsByTreeId(
    request.query.treeId,
    request.user.id
  );
  return successResponse(persons);
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const body = await request.json();
  const validated = CreatePersonDtoSchema.safeParse(body);

  if (!validated.success) {
    return errors.badRequest(validated.error.errors[0].message);
  }

  const person = await container.personService.createPerson(
    validated.data.treeId,
    request.user.id,
    validated.data
  );

  return successResponse(person, {}, 201);
});
```

### 2. Custom Hook for Data Fetching

```typescript
// hooks/usePerson.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePerson(personId: string) {
  const queryClient = useQueryClient();

  const { data: person, isLoading, error } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => fetch(`/api/persons/${personId}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePersonDto) =>
      fetch(`/api/persons/${personId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', personId] });
    },
  });

  return {
    person,
    isLoading,
    error,
    updatePerson: updateMutation.mutate,
  };
}
```

### 3. Error Boundary

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <YourComponent />
</ErrorBoundary>
```

### 4. Loading States with Suspense

```typescript
// In a Server Component
import { Suspense } from 'react';
import { PersonList } from './PersonList';
import { PersonListSkeleton } from './PersonListSkeleton';

export default async function PersonsPage() {
  return (
    <Suspense fallback={<PersonListSkeleton />}>
      <PersonList treeId={treeId} />
    </Suspense>
  );
}
```

### 5. Pagination

```typescript
// repositories/mongodb/PersonRepository.ts
async findByTreeId(
  treeId: string,
  options: { page?: number; limit?: number } = {}
): Promise<IPerson[]> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const docs = await this.model
    .find({ treeId })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

  return docs.map(doc => this.toEntity(doc));
}

// API route
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

  const persons = await container.personRepository.findByTreeId(
    treeId,
    { page, limit }
  );

  const total = await container.personRepository.countByTreeId(treeId);

  return successResponse(persons, {
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
```

---

## Testing

### Component Testing

```typescript
// components/person/__tests__/PersonCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PersonCard } from '../PersonCard';

describe('PersonCard', () => {
  it('renders person name', () => {
    const person = { _id: '1', firstName: 'John', lastName: 'Doe' };
    render(<PersonCard person={person} onClick={() => {}} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
// hooks/__tests__/usePerson.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { usePerson } from '../usePerson';

describe('usePerson', () => {
  it('fetches person data', async () => {
    const { result } = renderHook(() => usePerson('123'));

    await waitFor(() => {
      expect(result.current.person).toBeDefined();
      expect(result.current.person.firstName).toBe('John');
    });
  });
});
```

---

## Performance Monitoring

### Measure Component Renders

```typescript
import { useRenderCounter } from '@/hooks/useRenderCounter';

function MyComponent() {
  const renders = useRenderCounter();
  return <div>Renders: {renders}</div>;
}
```

### Measure API Response Times

```typescript
// app/api/persons/route.ts
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const start = Date.now();

  const persons = await container.personService.getPersonsByTreeId(...);

  const duration = Date.now() - start;
  console.log(`GET /api/persons took ${duration}ms`);

  return successResponse(persons, { meta: { duration } });
});
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` and check for errors
- [ ] Run `npm run lint` and fix all issues
- [ ] Run tests: `npm test`
- [ ] Set production environment variables
- [ ] Enable production mode: `NODE_ENV=production`
- [ ] Configure CDN for static assets
- [ ] Enable compression
- [ ] Set up monitoring/logging
- [ ] Configure error tracking
- [ ] Review and set cache headers
- [ ] Test all critical user flows
- [ ] Load test the application
- [ ] Review security headers
- [ ] Check database indexes
- [ ] Verify rate limiting is enabled

---

**Guide Version:** 1.0
**Last Updated:** 2026-01-29
**Maintained By:** Development Team
