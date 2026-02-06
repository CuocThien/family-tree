/**
 * Relationship Type Normalization Utility
 *
 * This module provides functions to normalize relationship types to ensure
 * consistent storage in the database. The system stores all parent-child
 * relationships with type: 'parent' from the parent's perspective.
 *
 * For example:
 * - User selects "child" → stored as type: 'parent' with parent as fromPersonId
 * - User selects "parent" → stored as type: 'parent' with parent as fromPersonId
 * - User selects "spouse" → stored as type: 'spouse' (no change)
 */

import { RelationshipType } from '@/schemas/person';

/**
 * Normalized relationship that can be stored in the database.
 * The type field will always be one of the canonical database types.
 */
export interface NormalizedRelationship {
  fromPersonId: string;
  toPersonId: string;
  type: 'parent' | 'child' | 'spouse' | 'sibling';
}

/**
 * Parent-child relationship types that need to be normalized.
 * These are the types presented to users in the UI.
 */
const PARENT_CHILD_TYPES = [
  'parent',
  'child',
  'step-parent',
  'step-child',
  'adoptive-parent',
  'adoptive-child',
] as const;

/**
 * Type guard to check if a relationship type is a parent-child variant.
 *
 * @param type - The relationship type to check
 * @returns true if the type is a parent-child relationship variant
 */
export function isParentChildType(type: RelationshipType): boolean {
  return PARENT_CHILD_TYPES.includes(type as any);
}

/**
 * Checks if a relationship type indicates the new person is the "child"
 * (i.e., the type ends with '-child' or is exactly 'child').
 *
 * @param type - The relationship type to check
 * @returns true if the type indicates a child relationship
 */
function isChildType(type: RelationshipType): boolean {
  return type === 'child' || type === 'step-child' || type === 'adoptive-child';
}

/**
 * Normalizes a relationship type to be stored from the parent's perspective.
 *
 * This function handles:
 * - "child" → stores as "parent" from the existing person's perspective
 * - "parent" → stores as "parent" from the new person's perspective
 * - "step-child" → stores as "parent" from the existing person's perspective
 * - "step-parent" → stores as "parent" from the new person's perspective
 * - "adoptive-child" → stores as "parent" from the existing person's perspective
 * - "adoptive-parent" → stores as "parent" from the new person's perspective
 * - "spouse", "sibling", "partner" → stored as-is (with "partner" mapped to "spouse")
 *
 * @param relationshipType - The relationship type selected by the user
 * @param existingPersonId - The ID of the existing person in the tree
 * @param newPersonId - The ID of the person being added
 * @returns Normalized relationship with correct from/to and type
 */
export function normalizeRelationshipType(
  relationshipType: RelationshipType,
  existingPersonId: string,
  newPersonId: string
): NormalizedRelationship {
  // For parent-child relationships, always store as 'parent' from the parent's perspective
  if (isParentChildType(relationshipType)) {
    // Check if the type indicates the new person is the "child" of the existing person
    if (isChildType(relationshipType)) {
      // User selected that new person is child of existing person
      return {
        fromPersonId: existingPersonId,  // parent (existing person)
        toPersonId: newPersonId,         // child (new person)
        type: 'parent',                  // stored from parent's perspective
      };
    }

    // User selected that new person is parent of existing person
    // (relationshipType is 'parent', 'step-parent', or 'adoptive-parent')
    return {
      fromPersonId: newPersonId,         // parent (new person)
      toPersonId: existingPersonId,      // child (existing person)
      type: 'parent',                    // stored from parent's perspective
    };
  }

  // For spouse, sibling, and partner, direction doesn't matter as much
  // but we keep the user's selection
  // Note: 'partner' is not in the database model, so we map it to 'spouse'
  const dbType = relationshipType === 'partner' ? 'spouse' : relationshipType;

  return {
    fromPersonId: existingPersonId,
    toPersonId: newPersonId,
    type: dbType as 'parent' | 'child' | 'spouse' | 'sibling',
  };
}
