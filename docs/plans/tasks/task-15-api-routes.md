# Task 15: Create API Routes

**Phase:** 8 - API Layer
**Priority:** High
**Dependencies:** Task 09 (Service Implementations), Task 13 (DI Container), Task 14 (NextAuth)
**Estimated Complexity:** High

---

## Objective

Create RESTful API routes using Next.js App Router for all application features. Routes should be secure, well-documented, and follow consistent patterns.

---

## Requirements

### Functional Requirements

1. CRUD endpoints for Trees, Persons, Relationships, Media
2. Authentication endpoints
3. Dashboard aggregation endpoint
4. Search endpoints
5. Collaboration endpoints
6. Export/Import endpoints

### Non-Functional Requirements

1. Consistent error response format
2. Input validation with Zod
3. Authentication checks
4. Rate limiting
5. Request/Response logging
6. OpenAPI documentation

---

## API Structure

```
src/app/api/
├── auth/
│   └── [...nextauth]/route.ts
├── dashboard/
│   └── route.ts
├── trees/
│   ├── route.ts                    # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                # GET, PUT, DELETE
│       ├── persons/route.ts        # GET persons in tree
│       ├── relationships/route.ts  # GET relationships in tree
│       ├── export/route.ts         # GET export
│       └── collaborators/
│           └── route.ts            # GET, POST, DELETE
├── persons/
│   ├── route.ts                    # POST (create)
│   └── [id]/
│       ├── route.ts                # GET, PUT, DELETE
│       └── media/route.ts          # GET media for person
├── relationships/
│   ├── route.ts                    # POST (create)
│   └── [id]/route.ts               # GET, PUT, DELETE
├── media/
│   ├── route.ts                    # POST (upload)
│   └── [id]/route.ts               # GET, DELETE
└── search/
    └── route.ts                    # GET search
```

---

## Shared Utilities

### API Response Helper

**File:** `src/lib/api/response.ts`

```typescript
import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(data: T, meta?: ApiResponse['meta'], status = 200) {
  return NextResponse.json({ data, meta }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

// Common error responses
export const errors = {
  unauthorized: () => errorResponse('UNAUTHORIZED', 'Authentication required', 401),
  forbidden: () => errorResponse('FORBIDDEN', 'Permission denied', 403),
  notFound: (resource: string) => errorResponse('NOT_FOUND', `${resource} not found`, 404),
  badRequest: (message: string, details?: Record<string, unknown>) =>
    errorResponse('BAD_REQUEST', message, 400, details),
  conflict: (message: string) => errorResponse('CONFLICT', message, 409),
  internal: () => errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500),
  validationFailed: (errors: Record<string, string[]>) =>
    errorResponse('VALIDATION_FAILED', 'Validation failed', 400, { errors }),
  rateLimited: () => errorResponse('RATE_LIMITED', 'Too many requests', 429),
};
```

### Auth Middleware

**File:** `src/lib/api/withAuth.ts`

```typescript
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { errors } from './response';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

type RouteHandler = (
  request: AuthenticatedRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler) {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return errors.unauthorized();
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };

    return handler(authenticatedRequest, context);
  };
}
```

### Validation Middleware

**File:** `src/lib/api/withValidation.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { errors } from './response';

export function withValidation<T>(schema: ZodSchema<T>) {
  return async (request: NextRequest): Promise<{ data: T } | NextResponse> => {
    try {
      const body = await request.json();
      const data = schema.parse(body);
      return { data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(err.message);
        });
        return errors.validationFailed(fieldErrors);
      }
      return errors.badRequest('Invalid JSON body');
    }
  };
}
```

---

## Route Implementations

### Trees Routes

**File:** `src/app/api/trees/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di/container';

const createTreeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  privacy: z.enum(['private', 'family', 'public']).default('private'),
});

// GET /api/trees - List user's trees
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const trees = await container.treeService.getTreesByUserId(request.user.id);

  return successResponse(trees, {
    total: trees.length,
  });
});

// POST /api/trees - Create new tree
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const validation = await withValidation(createTreeSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  const tree = await container.treeService.createTree(request.user.id, validation.data);

  return successResponse(tree, undefined, 201);
});
```

**File:** `src/app/api/trees/[id]/route.ts`

```typescript
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di/container';

const updateTreeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  privacy: z.enum(['private', 'family', 'public']).optional(),
  coverImage: z.string().url().optional(),
});

// GET /api/trees/[id]
export const GET = withAuth(async (request: AuthenticatedRequest, { params }) => {
  const tree = await container.treeService.getTreeById(params.id, request.user.id);

  if (!tree) {
    return errors.notFound('Tree');
  }

  return successResponse(tree);
});

// PUT /api/trees/[id]
export const PUT = withAuth(async (request: AuthenticatedRequest, { params }) => {
  const validation = await withValidation(updateTreeSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const tree = await container.treeService.updateTree(
      params.id,
      request.user.id,
      validation.data
    );
    return successResponse(tree);
  } catch (error) {
    if (error.message.includes('not found')) {
      return errors.notFound('Tree');
    }
    if (error.message.includes('Permission')) {
      return errors.forbidden();
    }
    throw error;
  }
});

// DELETE /api/trees/[id]
export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }) => {
  try {
    await container.treeService.deleteTree(params.id, request.user.id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error.message.includes('not found')) {
      return errors.notFound('Tree');
    }
    if (error.message.includes('owner')) {
      return errors.forbidden();
    }
    throw error;
  }
});
```

### Persons Routes

**File:** `src/app/api/persons/route.ts`

```typescript
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withValidation } from '@/lib/api/withValidation';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di/container';

const createPersonSchema = z.object({
  treeId: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  birthDate: z.string().datetime().optional(),
  birthPlace: z.string().max(200).optional(),
  deathDate: z.string().datetime().optional(),
  deathPlace: z.string().max(200).optional(),
  isLiving: z.boolean().default(true),
  biography: z.string().max(5000).optional(),
});

// POST /api/persons - Create person
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const validation = await withValidation(createPersonSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const person = await container.personService.createPerson(
      validation.data.treeId,
      request.user.id,
      validation.data
    );
    return successResponse(person, undefined, 201);
  } catch (error) {
    if (error.message.includes('Permission')) {
      return errors.forbidden();
    }
    if (error.message.includes('Validation')) {
      return errors.badRequest(error.message);
    }
    throw error;
  }
});
```

**File:** `src/app/api/persons/[id]/route.ts`

```typescript
// GET /api/persons/[id]
export const GET = withAuth(async (request: AuthenticatedRequest, { params }) => {
  const person = await container.personService.getPersonById(params.id, request.user.id);

  if (!person) {
    return errors.notFound('Person');
  }

  return successResponse(person);
});

// PUT /api/persons/[id]
export const PUT = withAuth(async (request: AuthenticatedRequest, { params }) => {
  const validation = await withValidation(updatePersonSchema)(request);

  if (validation instanceof Response) {
    return validation;
  }

  try {
    const person = await container.personService.updatePerson(
      params.id,
      request.user.id,
      validation.data
    );
    return successResponse(person);
  } catch (error) {
    if (error.message.includes('not found')) {
      return errors.notFound('Person');
    }
    if (error.message.includes('Permission')) {
      return errors.forbidden();
    }
    throw error;
  }
});

// DELETE /api/persons/[id]
export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }) => {
  try {
    await container.personService.deletePerson(params.id, request.user.id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error.message.includes('not found')) {
      return errors.notFound('Person');
    }
    if (error.message.includes('Permission')) {
      return errors.forbidden();
    }
    if (error.message.includes('relationships')) {
      return errors.conflict('Cannot delete person with existing relationships');
    }
    throw error;
  }
});
```

### Dashboard Route

**File:** `src/app/api/dashboard/route.ts`

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse } from '@/lib/api/response';
import { container } from '@/lib/di/container';

// GET /api/dashboard
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const [trees, invitations, recentActivity] = await Promise.all([
    container.treeService.getTreesByUserId(request.user.id),
    container.collaborationService.getPendingInvitations(request.user.id),
    container.auditLogService.getRecentActivity(request.user.id, { limit: 10 }),
  ]);

  // Calculate stats
  const treesWithStats = await Promise.all(
    trees.map(async (tree) => {
      const stats = await container.treeService.getTreeStats(tree._id, request.user.id);
      return {
        ...tree,
        memberCount: stats.memberCount,
        lastUpdated: tree.updatedAt,
      };
    })
  );

  return successResponse({
    trees: treesWithStats,
    invitations,
    recentActivity,
    dnaMatches: 0, // Placeholder for DNA feature
  });
});
```

### Search Route

**File:** `src/app/api/search/route.ts`

```typescript
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di/container';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['all', 'persons', 'trees']).default('all'),
  treeId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/search
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { searchParams } = new URL(request.url);

  const validation = searchQuerySchema.safeParse({
    q: searchParams.get('q'),
    type: searchParams.get('type'),
    treeId: searchParams.get('treeId'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });

  if (!validation.success) {
    return errors.validationFailed(
      Object.fromEntries(
        validation.error.errors.map(e => [e.path.join('.'), [e.message]])
      )
    );
  }

  const { q, type, treeId, page, limit } = validation.data;
  const results: { persons?: unknown[]; trees?: unknown[] } = {};

  if (type === 'all' || type === 'persons') {
    const personResults = await container.personService.searchPersons(
      request.user.id,
      { query: q, treeId, page, limit }
    );
    results.persons = personResults.persons;
  }

  if (type === 'all' || type === 'trees') {
    const treeResults = await container.treeService.searchTrees(
      request.user.id,
      { query: q, page, limit }
    );
    results.trees = treeResults.trees;
  }

  return successResponse(results, { page, limit });
});
```

### Media Upload Route

**File:** `src/app/api/media/route.ts`

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { successResponse, errors } from '@/lib/api/response';
import { container } from '@/lib/di/container';

// POST /api/media - Upload media
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const formData = await request.formData();

  const file = formData.get('file') as File | null;
  const treeId = formData.get('treeId') as string | null;
  const personId = formData.get('personId') as string | null;
  const title = formData.get('title') as string | null;
  const description = formData.get('description') as string | null;

  if (!file) {
    return errors.badRequest('No file provided');
  }

  if (!treeId) {
    return errors.badRequest('Tree ID is required');
  }

  // Validate file
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return errors.badRequest(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return errors.badRequest(`File type not allowed. Allowed: ${allowedTypes.join(', ')}`);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await container.mediaService.uploadMedia(request.user.id, {
      treeId,
      personId: personId || undefined,
      file: buffer,
      filename: file.name,
      mimeType: file.type,
      title: title || undefined,
      description: description || undefined,
    });

    return successResponse(result, undefined, 201);
  } catch (error) {
    if (error.message.includes('Permission')) {
      return errors.forbidden();
    }
    throw error;
  }
});
```

---

## Error Handling

**File:** `src/app/api/error.ts`

```typescript
import { NextResponse } from 'next/server';
import { errors } from '@/lib/api/response';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Known error types
    if (error.message.includes('not found')) {
      return errors.notFound('Resource');
    }
    if (error.message.includes('Permission') || error.message.includes('denied')) {
      return errors.forbidden();
    }
    if (error.message.includes('Validation')) {
      return errors.badRequest(error.message);
    }
  }

  // Unknown error
  return errors.internal();
}
```

---

## API Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": {
      "errors": {
        "firstName": ["First name is required"],
        "birthDate": ["Invalid date format"]
      }
    }
  }
}
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Invalid JSON body | Return 400 with "Invalid JSON" |
| Missing required fields | Return 400 with field errors |
| Unauthorized access | Return 401 |
| Permission denied | Return 403 |
| Resource not found | Return 404 |
| Duplicate resource | Return 409 Conflict |
| File too large | Return 400 with size limit |
| Rate limited | Return 429 |
| Database connection error | Return 500, log error |
| Timeout | Return 504 Gateway Timeout |

---

## Acceptance Criteria

- [ ] All CRUD routes for Trees implemented
- [ ] All CRUD routes for Persons implemented
- [ ] All CRUD routes for Relationships implemented
- [ ] Media upload route working
- [ ] Dashboard aggregation route working
- [ ] Search route working
- [ ] Consistent error format
- [ ] Input validation on all routes
- [ ] Authentication checks
- [ ] Unit tests for route handlers
- [ ] Integration tests for API flows
- [ ] TypeScript compilation succeeds
