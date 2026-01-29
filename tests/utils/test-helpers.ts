import { Db, ObjectId } from 'mongodb';
import { getTestDb } from '../setup/test-db';
import { IPerson } from '@/types/person';
import { ITree } from '@/types/tree';
import { IUser } from '@/types/user';
import { IRelationship } from '@/types/relationship';
import { IMedia } from '@/types/media';
import bcrypt from 'bcryptjs';

/**
 * Creates a test user in the database
 */
export async function createTestUser(overrides: Partial<IUser> = {}): Promise<IUser> {
  const db = getTestDb();
  const hashedPassword = await bcrypt.hash('TestPassword123', 12);

  const user: IUser = {
    _id: new ObjectId().toString(),
    email: `test-${Date.now()}@example.com`,
    role: 'user',
    isVerified: true,
    profile: {
      name: 'Test User',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.collection('users').insertOne({ ...user, password: hashedPassword });
  return user;
}

/**
 * Creates a test tree in the database
 */
export async function createTestTree(userId: string, overrides: Partial<ITree> = {}): Promise<ITree> {
  const db = getTestDb();

  const tree: ITree = {
    _id: new ObjectId().toString(),
    ownerId: userId,
    name: 'Test Family Tree',
    settings: {
      isPublic: false,
      allowComments: false,
      defaultPhotoQuality: 'medium',
      language: 'en',
    },
    collaborators: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.collection('trees').insertOne(tree);
  return tree;
}

/**
 * Creates a test person in the database
 */
export async function createTestPerson(treeId: string, overrides: Partial<IPerson> = {}): Promise<IPerson> {
  const db = getTestDb();

  const person: IPerson = {
    _id: new ObjectId().toString(),
    treeId,
    firstName: 'John',
    lastName: 'Doe',
    gender: 'male',
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.collection('persons').insertOne(person);
  return person;
}

/**
 * Creates a test relationship in the database
 */
export async function createTestRelationship(
  treeId: string,
  fromPersonId: string,
  toPersonId: string,
  overrides: Partial<IRelationship> = {}
): Promise<IRelationship> {
  const db = getTestDb();

  const relationship: IRelationship = {
    _id: new ObjectId().toString(),
    treeId,
    fromPersonId,
    toPersonId,
    type: 'parent',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.collection('relationships').insertOne(relationship);
  return relationship;
}

/**
 * Creates a test media item in the database
 */
export async function createTestMedia(
  treeId: string,
  overrides: Partial<IMedia> = {}
): Promise<IMedia> {
  const db = getTestDb();

  const media: IMedia = {
    _id: new ObjectId().toString(),
    treeId,
    type: 'photo',
    filename: 'test-photo.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    url: 'https://example.com/test-photo.jpg',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  await db.collection('media').insertOne(media);
  return media;
}

/**
 * Generates a mock JWT token for testing
 */
export function generateTestToken(userId: string): string {
  // In a real implementation, you would use proper JWT signing
  // For testing, we return a mock token
  return `mock-jwt-token-${userId}`;
}

/**
 * Gets a test auth token for a user
 */
export async function getTestAuthToken(userId?: string): Promise<string> {
  const user = userId ? { _id: userId } as IUser : await createTestUser();
  return generateTestToken(user._id);
}

/**
 * Creates a test auth session
 */
export async function createTestSession(overrides: { userId?: string; token?: string } = {}): Promise<{
  user: IUser;
  token: string;
}> {
  const user = overrides.userId
    ? ({ _id: overrides.userId } as IUser)
    : await createTestUser();
  const token = overrides.token || generateTestToken(user._id);

  return { user, token };
}

/**
 * Waits for a specified amount of time (useful for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock request object for API route testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Request {
  const { method = 'GET', headers = {}, body } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper to extract data from a Response
 */
export async function getResponseData<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text() as any;
}
