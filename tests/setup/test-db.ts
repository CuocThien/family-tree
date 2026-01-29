import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let client: MongoClient;

/**
 * Sets up an in-memory MongoDB instance for testing
 */
export async function setupTestDb(): Promise<Db> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  client = new MongoClient(uri);
  await client.connect();
  return client.db();
}

/**
 * Tears down the in-memory MongoDB instance
 */
export async function teardownTestDb(): Promise<void> {
  if (client) {
    await client.close();
  }
  if (mongod) {
    await mongod.stop();
  }
}

/**
 * Clears all collections in the test database
 */
export async function clearTestDatabase(): Promise<void> {
  if (!client) {
    return;
  }
  const db = client.db();
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
}

/**
 * Gets the test database instance
 */
export function getTestDb(): Db {
  if (!client) {
    throw new Error('Test database not initialized. Call setupTestDb() first.');
  }
  return client.db();
}

/**
 * Gets the MongoDB connection URI
 */
export function getTestDbUri(): string {
  if (!mongod) {
    throw new Error('Test database not initialized. Call setupTestDb() first.');
  }
  return mongod.getUri();
}
