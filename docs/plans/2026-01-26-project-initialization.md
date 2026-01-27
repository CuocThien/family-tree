# Family Tree Project - Initialization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Initialize complete project structure with Next.js 14+, TypeScript, MongoDB, and SOLID architecture as specified in README.md and CLAUDE.md.

**Architecture:** Layered architecture following SOLID principles:
- Presentation: Next.js App Router + React components
- Service: Business logic with interfaces (SRP)
- Repository: Data access abstraction (DIP)
- Data: MongoDB/Mongoose models

**Tech Stack:** Next.js 14+, TypeScript, MongoDB, Mongoose, NextAuth.js, Tailwind CSS, Zustand, React Hook Form, Zod

---

## Phase 1: Project Foundation

### Task 1: Initialize Next.js 14+ Project

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.eslintrc.json`
- Create: `.prettierrc`
- Create: `.gitignore`

**Step 1: Write the project setup command**

```bash
npx create-next-app@latest family-tree --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

**Step 2: Verify project structure**

Run: `ls -la family-tree/`
Expected: Standard Next.js structure with app/, public/, src/ directories

---

### Task 2: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add dependencies to package.json**

```json
{
  "dependencies": {
    "mongoose": "^8.0.0",
    "next-auth": "^4.24.0",
    "bcryptjs": "^2.4.3",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.294.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.10.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

**Step 2: Install dependencies**

Run: `cd family-tree && npm install`
Expected: node_modules created with all packages

---

### Task 3: Create Directory Structure

**Files:**
- Create: `src/app/api/`
- Create: `src/app/(auth)/`
- Create: `src/app/(dashboard)/`
- Create: `src/components/ui/`
- Create: `src/components/tree/`
- Create: `src/components/person/`
- Create: `src/components/relationship/`
- Create: `src/components/shared/`
- Create: `src/services/person/`
- Create: `src/services/tree/`
- Create: `src/services/relationship/`
- Create: `src/services/auth/`
- Create: `src/services/media/`
- Create: `src/services/permission/`
- Create: `src/services/collaboration/`
- Create: `src/repositories/interfaces/`
- Create: `src/repositories/mongodb/`
- Create: `src/repositories/in-memory/`
- Create: `src/models/`
- Create: `src/lib/db/`
- Create: `src/lib/di/`
- Create: `src/lib/strategies/visualization/`
- Create: `src/lib/strategies/storage/`
- Create: `src/lib/strategies/permission/`
- Create: `src/hooks/`
- Create: `src/store/`
- Create: `src/types/dtos/`
- Create: `src/styles/`
- Create: `tests/unit/`
- Create: `tests/integration/`
- Create: `tests/e2e/`
- Create: `docs/plans/`

**Step 1: Run directory creation**

```bash
cd family-tree/src && \
mkdir -p \
  app/api/auth \
  app/api/trees \
  app/api/persons \
  app/api/relationships \
  app/api/media \
  "app/(auth)/login" \
  "app/(auth)/register" \
  "app/(dashboard)/trees" \
  "app/(dashboard)/profile" \
  components/ui \
  components/tree \
  components/person \
  components/relationship \
  components/shared \
  services/person \
  services/tree \
  services/relationship \
  services/auth \
  services/media \
  services/permission \
  services/collaboration \
  repositories/interfaces \
  repositories/mongodb \
  repositories/in-memory \
  models \
  lib/db \
  lib/di \
  "lib/strategies/visualization" \
  "lib/strategies/storage" \
  "lib/strategies/permission" \
  hooks \
  store \
  types/dtos \
  styles
```

**Step 2: Verify directories**

Run: `find src -type d | head -50`
Expected: All directories created

---

## Phase 2: Database Layer

### Task 4: Create MongoDB Models

**Files:**
- Create: `src/models/User.ts`
- Create: `src/models/FamilyTree.ts`
- Create: `src/models/Person.ts`
- Create: `src/models/Relationship.ts`
- Create: `src/models/Media.ts`
- Create: `src/models/AuditLog.ts`

**Step 1: Write User model test**

```typescript
// tests/unit/models/User.test.ts
import mongoose from 'mongoose';
import { UserModel } from '@/models/User';

describe('UserModel', () => {
  beforeAll(() => {
    mongoose.connect(process.env.MONGODB_URI!);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should have correct schema fields', () => {
    const fields = Object.keys(UserModel.schema.paths);
    expect(fields).toContain('email');
    expect(fields).toContain('password');
    expect(fields).toContain('profile');
    expect(fields).toContain('trees');
  });
});
```

**Step 2: Run test to verify model structure**

Run: `npm test -- tests/unit/models/User.test.ts`
Expected: FAIL - models don't exist yet

**Step 3: Create User model**

```typescript
// src/models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProfile {
  name: string;
  avatar?: string;
}

export interface IUser extends Document {
  email: string;
  password?: string;
  profile: IUserProfile;
  trees: mongoose.Types.ObjectId[];
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    profile: {
      name: { type: String, required: true },
      avatar: String,
    },
    trees: [{ type: Schema.Types.ObjectId, ref: 'FamilyTree' }],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
```

**Step 4: Create remaining models (FamilyTree, Person, Relationship, Media, AuditLog)**

Follow same pattern with appropriate schemas per README.md data model

**Step 5: Run tests to verify**

Run: `npm test -- tests/unit/models/`
Expected: PASS

---

### Task 5: Create Database Connection

**Files:**
- Create: `src/lib/db/mongodb.ts`
- Create: `tests/unit/lib/db/mongodb.test.ts`

**Step 1: Write connection test**

```typescript
// tests/unit/lib/db/mongodb.test.ts
import { connectToDatabase, disconnectFromDatabase } from '@/lib/db/mongodb';

describe('Database Connection', () => {
  it('should connect to MongoDB', async () => {
    const connection = await connectToDatabase();
    expect(connection.connection.readyState).toBe(1);
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });
});
```

**Step 2: Create connection utility**

```typescript
// src/lib/db/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached?.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}
```

**Step 3: Run test**

Run: `npm test -- tests/unit/lib/db/`
Expected: PASS

---

## Phase 3: Repository Layer

### Task 6: Create Repository Interfaces

**Files:**
- Create: `src/repositories/interfaces/IPersonRepository.ts`
- Create: `src/repositories/interfaces/ITreeRepository.ts`
- Create: `src/repositories/interfaces/IRelationshipRepository.ts`
- Create: `src/repositories/interfaces/IUserRepository.ts`
- Create: `src/repositories/interfaces/IMediaRepository.ts`
- Create: `src/repositories/interfaces/IAuditRepository.ts`

**Step 1: Write PersonRepository interface**

```typescript
// src/repositories/interfaces/IPersonRepository.ts
import { IPerson } from '@/types/person';

export interface IPersonRepository {
  findById(id: string): Promise<IPerson | null>;
  findByTreeId(treeId: string): Promise<IPerson[]>;
  create(data: Partial<IPerson>): Promise<IPerson>;
  update(id: string, data: Partial<IPerson>): Promise<IPerson>;
  delete(id: string): Promise<void>;
  countByTreeId(treeId: string): Promise<number>;
}
```

**Step 2: Create remaining interfaces (ITreeRepository, IRelationshipRepository, IUserRepository, IMediaRepository, IAuditRepository)**

Follow pattern with CRUD methods specific to each entity

---

### Task 7: Create MongoDB Repository Implementations

**Files:**
- Create: `src/repositories/mongodb/PersonRepository.ts`
- Create: `src/repositories/mongodb/TreeRepository.ts`
- Create: `src/repositories/mongodb/RelationshipRepository.ts`
- Create: `src/repositories/mongodb/UserRepository.ts`
- Create: `src/repositories/mongodb/MediaRepository.ts`
- Create: `src/repositories/mongodb/AuditRepository.ts`

**Step 1: Write PersonRepository test**

```typescript
// tests/unit/repositories/PersonRepository.test.ts
import { PersonRepository } from '@/repositories/mongodb/PersonRepository';
import { PersonModel } from '@/models/Person';

describe('PersonRepository', () => {
  let repository: PersonRepository;

  beforeEach(() => {
    repository = new PersonRepository(PersonModel);
  });

  it('should find person by id', async () => {
    const person = await repository.findById('some-id');
    expect(person).toBeNull();
  });
});
```

**Step 2: Create PersonRepository implementation**

```typescript
// src/repositories/mongodb/PersonRepository.ts
import { Model } from 'mongoose';
import { IPerson } from '@/types/person';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { PersonModel } from '@/models/Person';

export class PersonRepository implements IPersonRepository {
  constructor(private model: Model<IPerson>) {}

  async findById(id: string): Promise<IPerson | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? doc.toObject() : null;
  }

  async findByTreeId(treeId: string): Promise<IPerson[]> {
    const docs = await this.model.find({ treeId }).exec();
    return docs.map((doc) => doc.toObject());
  }

  async create(data: Partial<IPerson>): Promise<IPerson> {
    const doc = await this.model.create(data);
    return doc.toObject();
  }

  async update(id: string, data: Partial<IPerson>): Promise<IPerson> {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new Error('Person not found');
    return doc.toObject();
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async countByTreeId(treeId: string): Promise<number> {
    return this.model.countDocuments({ treeId }).exec();
  }
}
```

**Step 3: Create remaining repository implementations**

Follow same pattern for all entities

---

## Phase 4: Service Layer

### Task 8: Create Service Interfaces

**Files:**
- Create: `src/services/person/IPersonService.ts`
- Create: `src/services/tree/ITreeService.ts`
- Create: `src/services/relationship/IRelationshipService.ts`
- Create: `src/services/auth/IAuthService.ts`
- Create: `src/services/media/IMediaService.ts`
- Create: `src/services/permission/IPermissionService.ts`
- Create: `src/services/collaboration/ICollaborationService.ts`

**Step 1: Write IPersonService interface**

```typescript
// src/services/person/IPersonService.ts
import { IPerson } from '@/types/person';
import { CreatePersonDto } from '@/types/dtos/CreatePersonDto';
import { UpdatePersonDto } from '@/types/dtos/UpdatePersonDto';

export interface IPersonService {
  createPerson(treeId: string, data: CreatePersonDto): Promise<IPerson>;
  updatePerson(personId: string, data: UpdatePersonDto): Promise<IPerson>;
  deletePerson(personId: string): Promise<void>;
  getPersonById(personId: string): Promise<IPerson | null>;
  getPersonsByTreeId(treeId: string): Promise<IPerson[]>;
}
```

**Step 2: Create remaining service interfaces**

---

### Task 9: Create Service Implementations

**Files:**
- Create: `src/services/person/PersonService.ts`
- Create: `src/services/tree/TreeService.ts`
- Create: `src/services/relationship/RelationshipService.ts`
- Create: `src/services/auth/AuthService.ts`
- Create: `src/services/media/MediaService.ts`
- Create: `src/services/permission/PermissionService.ts`
- Create: `src/services/collaboration/CollaborationService.ts`

**Step 1: Write PersonService test**

```typescript
// tests/unit/services/PersonService.test.ts
import { PersonService } from '@/services/person/PersonService';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { CreatePersonDto } from '@/types/dtos/CreatePersonDto';

describe('PersonService', () => {
  let service: PersonService;
  let mockRepository: jest.Mocked<IPersonRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByTreeId: jest.fn(),
      countByTreeId: jest.fn(),
    };
    service = new PersonService(mockRepository);
  });

  it('should create person', async () => {
    const dto: CreatePersonDto = {
      firstName: 'John',
      lastName: 'Doe',
      treeId: 'tree-123',
    };
    const expectedPerson = { ...dto, _id: 'person-123' };
    mockRepository.create.mockResolvedValue(expectedPerson);

    const result = await service.createPerson('tree-123', dto);
    expect(result).toEqual(expectedPerson);
  });
});
```

**Step 2: Create PersonService implementation**

```typescript
// src/services/person/PersonService.ts
import { IPersonService } from './IPersonService';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { CreatePersonDto } from '@/types/dtos/CreatePersonDto';
import { UpdatePersonDto } from '@/types/dtos/UpdatePersonDto';
import { IPerson } from '@/types/person';

export class PersonService implements IPersonService {
  constructor(private personRepo: IPersonRepository) {}

  async createPerson(treeId: string, data: CreatePersonDto): Promise<IPerson> {
    return this.personRepo.create({
      ...data,
      treeId,
    });
  }

  async updatePerson(personId: string, data: UpdatePersonDto): Promise<IPerson> {
    return this.personRepo.update(personId, data);
  }

  async deletePerson(personId: string): Promise<void> {
    await this.personRepo.delete(personId);
  }

  async getPersonById(personId: string): Promise<IPerson | null> {
    return this.personRepo.findById(personId);
  }

  async getPersonsByTreeId(treeId: string): Promise<IPerson[]> {
    return this.personRepo.findByTreeId(treeId);
  }
}
```

**Step 3: Create remaining service implementations**

---

## Phase 5: Strategy Pattern

### Task 10: Create Visualization Strategies

**Files:**
- Create: `src/lib/strategies/visualization/ITreeVisualizationStrategy.ts`
- Create: `src/lib/strategies/visualization/VerticalTreeStrategy.ts`
- Create: `src/lib/strategies/visualization/HorizontalTreeStrategy.ts`
- Create: `src/lib/strategies/visualization/TimelineTreeStrategy.ts`

**Step 1: Write interface and strategies**

```typescript
// src/lib/strategies/visualization/ITreeVisualizationStrategy.ts
export interface ITreeVisualizationStrategy {
  render(tree: any): { nodes: any[]; edges: any[] };
  getLayoutType(): 'vertical' | 'horizontal' | 'timeline';
}

// VerticalTreeStrategy, HorizontalTreeStrategy, TimelineTreeStrategy implementations
```

---

### Task 11: Create Storage Strategies

**Files:**
- Create: `src/lib/strategies/storage/IMediaStorage.ts`
- Create: `src/lib/strategies/storage/GridFSStorage.ts`
- Create: `src/lib/strategies/storage/CloudinaryStorage.ts`

---

### Task 12: Create Permission Strategies

**Files:**
- Create: `src/lib/strategies/permission/IPermissionChecker.ts`
- Create: `src/lib/strategies/permission/OwnerPermissionChecker.ts`
- Create: `src/lib/strategies/permission/EditorPermissionChecker.ts`
- Create: `src/lib/strategies/permission/ViewerPermissionChecker.ts`

---

## Phase 6: Dependency Injection

### Task 13: Create DI Container

**Files:**
- Create: `src/lib/di/container.ts`
- Create: `tests/unit/lib/di/container.test.ts`

**Step 1: Write container test**

```typescript
// tests/unit/lib/di/container.test.ts
import { container } from '@/lib/di/container';

describe('DI Container', () => {
  it('should have personRepository', () => {
    expect(container.personRepository).toBeDefined();
  });

  it('should have personService', () => {
    expect(container.personService).toBeDefined();
  });
});
```

**Step 2: Create container**

```typescript
// src/lib/di/container.ts
import { PersonRepository } from '@/repositories/mongodb/PersonRepository';
import { TreeRepository } from '@/repositories/mongodb/TreeRepository';
import { RelationshipRepository } from '@/repositories/mongodb/RelationshipRepository';
import { UserRepository } from '@/repositories/mongodb/UserRepository';
import { MediaRepository } from '@/repositories/mongodb/MediaRepository';
import { AuditRepository } from '@/repositories/mongodb/AuditRepository';
import { PersonModel } from '@/models/Person';
import { TreeModel } from '@/models/FamilyTree';
import { RelationshipModel } from '@/models/Relationship';
import { UserModel } from '@/models/User';
import { MediaModel } from '@/models/Media';
import { AuditLogModel } from '@/models/AuditLog';
import { PersonService } from '@/services/person/PersonService';
import { TreeService } from '@/services/tree/TreeService';
import { RelationshipService } from '@/services/relationship/RelationshipService';
import { AuthService } from '@/services/auth/AuthService';
import { MediaService } from '@/services/media/MediaService';
import { PermissionService } from '@/services/permission/PermissionService';
import { CollaborationService } from '@/services/collaboration/CollaborationService';
import { VerticalTreeStrategy } from '@/lib/strategies/visualization/VerticalTreeStrategy';
import { GridFSStorage } from '@/lib/strategies/storage/GridFSStorage';
import { OwnerPermissionChecker } from '@/lib/strategies/permission/OwnerPermissionChecker';
import { AuditLogger } from '@/services/audit/AuditLogger';

export const container = {
  // Repositories
  personRepository: new PersonRepository(PersonModel),
  treeRepository: new TreeRepository(TreeModel),
  relationshipRepository: new RelationshipRepository(RelationshipModel),
  userRepository: new UserRepository(UserModel),
  mediaRepository: new MediaRepository(MediaModel),
  auditRepository: new AuditRepository(AuditLogModel),

  // Strategies
  visualizationStrategy: new VerticalTreeStrategy(),
  mediaStorage: new GridFSStorage(),
  permissionChecker: new OwnerPermissionChecker(),

  // Services
  personService: new PersonService(container.personRepository),
  treeService: new TreeService(
    container.treeRepository,
    container.personService,
    container.visualizationStrategy
  ),
  relationshipService: new RelationshipService(container.relationshipRepository),
  authService: new AuthService(container.userRepository),
  mediaService: new MediaService(container.mediaRepository, container.mediaStorage),
  permissionService: new PermissionService(container.permissionChecker),
  collaborationService: new CollaborationService(container.treeRepository),

  // Cross-cutting
  auditLogger: new AuditLogger(container.auditRepository),
};
```

---

## Phase 7: Authentication

### Task 14: Set Up NextAuth.js

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/components/providers/AuthProvider.tsx`

**Step 1: Write auth configuration**

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { connectToDatabase } from '@/lib/db/mongodb';
import { UserModel } from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await connectToDatabase();
        const user = await UserModel.findOne({ email: credentials?.email });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials!.password, user.password);
        if (!isValid) return null;
        return { id: user._id.toString(), email: user.email, name: user.profile.name };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
};
```

---

## Phase 8: API Routes

### Task 15: Create API Routes

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/api/trees/route.ts`
- Create: `src/app/api/trees/[id]/route.ts`
- Create: `src/app/api/persons/route.ts`
- Create: `src/app/api/persons/[id]/route.ts`
- Create: `src/app/api/relationships/route.ts`
- Create: `src/app/api/media/route.ts`

**Step 1: Write person API route**

```typescript
// src/app/api/persons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/di/container';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const treeId = searchParams.get('treeId');
  if (!treeId) return NextResponse.json({ error: 'treeId required' }, { status: 400 });

  const persons = await container.personService.getPersonsByTreeId(treeId);
  return NextResponse.json(persons);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const person = await container.personService.createPerson(data.treeId, data);
  return NextResponse.json(person, { status: 201 });
}
```

---

## Phase 9: UI Components

### Task 16: Create UI Components

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/tree/TreeView.tsx`
- Create: `src/components/tree/PersonNode.tsx`
- Create: `src/components/person/PersonCard.tsx`
- Create: `src/components/person/PersonForm.tsx`

**Step 1: Create base UI components using shadcn/ui patterns**

---

## Phase 10: State Management

### Task 17: Create Zustand Stores

**Files:**
- Create: `src/store/treeStore.ts`
- Create: `src/store/authStore.ts`

**Step 1: Write tree store**

```typescript
// src/store/treeStore.ts
import { create } from 'zustand';
import { ITree } from '@/types/tree';

interface TreeState {
  trees: ITree[];
  currentTree: ITree | null;
  setTrees: (trees: ITree[]) => void;
  setCurrentTree: (tree: ITree | null) => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  trees: [],
  currentTree: null,
  setTrees: (trees) => set({ trees }),
  setCurrentTree: (tree) => set({ currentTree: tree }),
}));
```

---

## Phase 11: Custom Hooks

### Task 18: Create Custom Hooks

**Files:**
- Create: `src/hooks/useTree.ts`
- Create: `src/hooks/usePerson.ts`
- Create: `src/hooks/useAuth.ts`

**Step 1: Write useTree hook**

```typescript
// src/hooks/useTree.ts
import { useState, useEffect } from 'react';
import { ITree } from '@/types/tree';

export function useTree(treeId: string | null) {
  const [tree, setTree] = useState<ITree | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!treeId) return;
    setLoading(true);
    fetch(`/api/trees/${treeId}`)
      .then((res) => res.json())
      .then((data) => setTree(data))
      .finally(() => setLoading(false));
  }, [treeId]);

  return { tree, loading };
}
```

---

## Phase 12: Pages

### Task 19: Create App Pages

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/trees/page.tsx`
- Create: `src/app/(dashboard)/trees/new/page.tsx`
- Create: `src/app/(dashboard)/trees/[id]/page.tsx`
- Create: `src/app/(dashboard)/profile/page.tsx`

---

## Phase 13: Type Definitions

### Task 20: Create Type Definitions

**Files:**
- Create: `src/types/person.ts`
- Create: `src/types/tree.ts`
- Create: `src/types/relationship.ts`
- Create: `src/types/user.ts`
- Create: `src/types/dtos/CreatePersonDto.ts`
- Create: `src/types/dtos/UpdatePersonDto.ts`
- Create: `src/types/dtos/CreateTreeDto.ts`

---

## Phase 14: Utilities

### Task 21: Create Utility Functions

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/validations.ts`

**Step 1: Write utils**

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

---

## Phase 15: Global Styles

### Task 22: Set Up Global Styles

**Files:**
- Modify: `src/styles/globals.css`
- Create: `src/components/providers/Providers.tsx`

---

## Phase 16: Environment Configuration

### Task 23: Create Environment Files

**Files:**
- Create: `.env.example`
- Create: `.env.local`

**Step 1: Write .env.example**

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/family-tree

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# File Storage (optional)
CLOUDINARY_URL=your-cloudinary-url
```

---

## Plan Execution Summary

**Total Tasks:** 23 tasks across 16 phases

**Estimated Duration:** 2-4 hours for full implementation

**Testing Strategy:**
- Unit tests for models, repositories, services
- Integration tests for API routes
- E2E tests for critical user flows

**Commit Strategy:** One commit per task for traceability

---

**Plan complete and saved to `docs/plans/2026-01-26-project-initialization.md`**

**Two execution options:**

**1. Subagent-Driven (this session)** - Fresh subagent per task, code review between tasks

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution

**Which approach?**
