import { z } from 'zod';

/**
 * Gender enum
 */
export const genderEnum = z.enum(['male', 'female', 'other'], {
  errorMap: () => ({ message: 'Please select a gender' }),
});

/**
 * Date string validation (ISO format)
 * Handles empty strings by converting them to undefined
 */
const dateSchema = z
  .string()
  .optional()
  .refine(
    (date) => {
      // Allow undefined or empty string
      if (!date || date === '') return true;
      // Validate date format
      return !isNaN(Date.parse(date));
    },
    { message: 'Invalid date format' }
  )
  .transform((val) => (val === '' ? undefined : val));

/**
 * First name validation
 */
const firstNameSchema = z
  .string({ required_error: 'First name is required' })
  .min(1, 'First name is required')
  .max(50, 'First name must not exceed 50 characters')
  .regex(/^[a-zA-Z\u00C0-\u00FF\s\-']+$/, 'First name contains invalid characters');

/**
 * Last name validation
 */
const lastNameSchema = z
  .string({ required_error: 'Last name is required' })
  .min(1, 'Last name is required')
  .max(50, 'Last name must not exceed 50 characters')
  .regex(/^[a-zA-Z\u00C0-\u00FF\s\-']+$/, 'Last name contains invalid characters');

/**
 * Person form schema for UI
 */
export const personFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  middleName: z.string().max(50, 'Middle name must not exceed 50 characters').optional(),
  suffix: z.string().max(20, 'Suffix must not exceed 20 characters').optional(),
  gender: genderEnum,

  // Dates
  birthDate: dateSchema.optional(),
  deathDate: dateSchema.optional(),

  // Locations
  birthPlace: z.string().max(200, 'Birth place must not exceed 200 characters').optional(),
  deathPlace: z.string().max(200, 'Death place must not exceed 200 characters').optional(),

  // Life status
  isDeceased: z.boolean().default(false),

  // Additional info
  biography: z.string().max(5000, 'Biography must not exceed 5000 characters').optional(),
  occupation: z.string().max(100, 'Occupation must not exceed 100 characters').optional(),
  nationality: z.string().max(50, 'Nationality must not exceed 50 characters').optional(),

  // Contact (for living persons)
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number must not exceed 20 characters').optional(),
}).refine(
  (data) => {
    // Death date must be after birth date (strictly greater than)
    if (data.birthDate && data.deathDate) {
      return new Date(data.deathDate) > new Date(data.birthDate);
    }
    return true;
  },
  {
    message: 'Death date must be after birth date',
    path: ['deathDate'],
  }
).refine(
  (data) => {
    // Auto-update isDeceased if death date is provided
    if (data.deathDate && !data.isDeceased) {
      // This is handled in the form component via watch effect
      return true;
    }
    return true;
  },
  {
    message: '',
  }
);

/**
 * Relationship type enum
 */
export const relationshipTypeEnum = z.enum([
  'parent',
  'child',
  'spouse',
  'sibling',
  'step-parent',
  'step-child',
  'adoptive-parent',
  'adoptive-child',
  'partner',
], {
  errorMap: () => ({ message: 'Invalid relationship type' }),
});

/**
 * Person relationship schema for adding connected person
 */
export const personRelationshipSchema = z.object({
  relationshipType: relationshipTypeEnum,
  relatedPersonId: z.string().min(1, 'Related person is required'),
});

/**
 * Add person to tree schema (person + relationship)
 */
export const addPersonToTreeSchema = personFormSchema.and(
  z.object({
    relationshipType: relationshipTypeEnum.optional(),
    connectToPersonId: z.string().optional(),
  })
);

/**
 * Types inferred from schemas
 */
export type PersonFormInput = z.infer<typeof personFormSchema>;
export type PersonRelationshipInput = z.infer<typeof personRelationshipSchema>;
export type AddPersonToTreeInput = z.infer<typeof addPersonToTreeSchema>;
export type GenderType = z.infer<typeof genderEnum>;
export type RelationshipType = z.infer<typeof relationshipTypeEnum>;
