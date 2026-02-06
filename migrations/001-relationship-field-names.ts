/**
 * Migration Script: Relationship Field Names
 *
 * Description: Renames person1Id/person2Id to fromPersonId/toPersonId in existing relationship documents
 * to align with the updated schema.
 *
 * Run this migration if you have existing data in the relationships collection with the old field names.
 *
 * How to run:
 * 1. Ensure MongoDB is running
 * 2. Run: npx ts-node migrations/001-relationship-field-names.ts
 */

import mongoose from 'mongoose';
import { RelationshipModel } from '../src/models/Relationship';

async function migrate() {
  try {
    // Connect to MongoDB - use your connection string
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/family-tree';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if any documents need migration
    const needsMigration = await RelationshipModel.findOne({
      $or: [
        { person1Id: { $exists: true } },
        { person2Id: { $exists: true } }
      ]
    });

    if (!needsMigration) {
      console.log('No documents need migration. All relationships already have correct field names.');
      return;
    }

    console.log('Found documents that need migration. Starting migration...');

    // Perform the migration using MongoDB's $rename operator
    const result = await RelationshipModel.updateMany(
      {},
      {
        $rename: {
          person1Id: 'fromPersonId',
          person2Id: 'toPersonId'
        }
      }
    );

    console.log(`Migration complete! Updated ${result.modifiedCount} documents.`);

    // Verify the migration
    const remainingOldFields = await RelationshipModel.findOne({
      $or: [
        { person1Id: { $exists: true } },
        { person2Id: { $exists: true } }
      ]
    });

    if (remainingOldFields) {
      console.warn('Warning: Some documents still have old field names.');
    } else {
      console.log('Verification successful: All documents have been migrated.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrate()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
