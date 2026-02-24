/**
 * Relationship Labels Utility
 *
 * Provides gender-aware, bidirectional relationship labels for display.
 * This helps clarify the relationship direction and makes the UI more intuitive.
 */

import { RelationshipType } from '@/schemas/person';
import { Gender } from '@/types/person';

/**
 * Gets a gender-aware label for a relationship type.
 *
 * @param type - The relationship type
 * @param gender - The gender of the related person (optional)
 * @returns A human-readable, gender-aware label
 */
export function getGenderAwareLabel(type: RelationshipType, gender?: Gender): string {
  switch (type) {
    case 'parent':
      if (gender === 'male') return 'Father';
      if (gender === 'female') return 'Mother';
      return 'Parent';

    case 'child':
      if (gender === 'male') return 'Son';
      if (gender === 'female') return 'Daughter';
      return 'Child';

    case 'spouse':
      if (gender === 'male') return 'Husband';
      if (gender === 'female') return 'Wife';
      return 'Spouse';

    case 'sibling':
      if (gender === 'male') return 'Brother';
      if (gender === 'female') return 'Sister';
      return 'Sibling';

    case 'step-parent':
      if (gender === 'male') return 'Step Father';
      if (gender === 'female') return 'Step Mother';
      return 'Step Parent';

    case 'step-child':
      if (gender === 'male') return 'Step Son';
      if (gender === 'female') return 'Step Daughter';
      return 'Step Child';

    case 'adoptive-parent':
      if (gender === 'male') return 'Adoptive Father';
      if (gender === 'female') return 'Adoptive Mother';
      return 'Adoptive Parent';

    case 'adoptive-child':
      if (gender === 'male') return 'Adoptive Son';
      if (gender === 'female') return 'Adoptive Daughter';
      return 'Adoptive Child';

    case 'partner':
      return 'Partner';

    default:
      return type;
  }
}

/**
 * Gets a description for the relationship that provides context about the direction.
 *
 * @param type - The relationship type
 * @param relatedPersonName - The name of the related person
 * @param gender - The gender of the related person (optional)
 * @returns A contextual description string
 */
export function getRelationshipDescription(
  type: RelationshipType,
  relatedPersonName: string,
  gender?: Gender
): string {
  const label = getGenderAwareLabel(type, gender);

  switch (type) {
    case 'parent':
    case 'step-parent':
    case 'adoptive-parent':
      return `${relatedPersonName} is the ${label.toLowerCase()} of this person`;

    case 'child':
    case 'step-child':
    case 'adoptive-child':
      return `${relatedPersonName} is the ${label.toLowerCase()} of this person`;

    case 'spouse':
    case 'partner':
      return `${relatedPersonName} is the ${label.toLowerCase()} of this person`;

    case 'sibling':
      return `${relatedPersonName} is the ${label.toLowerCase()} of this person`;

    default:
      return `${relatedPersonName} (${label})`;
  }
}

/**
 * Gets the icon name for a relationship type.
 */
export function getRelationshipIcon(type: RelationshipType): string {
  const icons: Record<RelationshipType, string> = {
    parent: 'north',
    child: 'south',
    spouse: 'favorite',
    sibling: 'group',
    'step-parent': 'north',
    'step-child': 'south',
    'adoptive-parent': 'north',
    'adoptive-child': 'south',
    partner: 'favorite',
  };

  return icons[type] || 'person';
}
