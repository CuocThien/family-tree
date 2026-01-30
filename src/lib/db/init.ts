/**
 * Database Initialization Module
 *
 * This module is imported early in the app lifecycle to establish
 * a persistent MongoDB connection that remains open for the duration
 * of the application process.
 *
 * The singleton pattern in mongodb.ts ensures only one connection
 * is created and reused, even across hot reloads in development.
 */

import { connectToDatabase } from './mongodb';

// Establish database connection when this module is imported
// This happens once at app startup and persists for the lifetime of the process
let connectionInitialized = false;

export async function initializeDatabase() {
  if (!connectionInitialized) {
    await connectToDatabase();
    connectionInitialized = true;
    console.log('Database connection established');
  }
}

// Auto-initialize on module import (called from layout.tsx)
initializeDatabase().catch((error) => {
  console.error('Failed to initialize database connection:', error);
});
