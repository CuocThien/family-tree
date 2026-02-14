import { z } from 'zod';

/**
 * Gender enum
 */
export const genderEnum = z.enum(['male', 'female', 'other'], {
  errorMap: () => ({ message: 'Vui long chon gioi tinh' }),
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
    { message: 'Dinh dang ngay khong hop le' }
  )
  .transform((val) => (val === '' ? undefined : val));

/**
 * First name validation
 */
const firstNameSchema = z
  .string({ required_error: 'Ho la bat buoc' })
  .min(1, 'Ho la bat buoc')
  .max(50, 'Ho khong duoc vuot qua 50 ky tu')
  .regex(/^[a-zA-Z\u00C0-\u00FF\s\-']+$/, 'Ho chua ky tu khong hop le');

/**
 * Last name validation
 */
const lastNameSchema = z
  .string({ required_error: 'Ten la bat buoc' })
  .min(1, 'Ten la bat buoc')
  .max(50, 'Ten khong duoc vuot qua 50 ky tu')
  .regex(/^[a-zA-Z\u00C0-\u00FF\s\-']+$/, 'Ten chua ky tu khong hop le');

/**
 * Person form schema for UI
 */
export const personFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  middleName: z.string().max(50, 'Ten dem khong duoc vuot qua 50 ky tu').optional(),
  suffix: z.string().max(20, 'Hau to khong duoc vuot qua 20 ky tu').optional(),
  gender: genderEnum,

  // Dates
  birthDate: dateSchema.optional(),
  deathDate: dateSchema.optional(),

  // Locations
  birthPlace: z.string().max(200, 'Noi sinh khong duoc vuot qua 200 ky tu').optional(),
  deathPlace: z.string().max(200, 'Noi mat khong duoc vuot qua 200 ky tu').optional(),

  // Life status
  isDeceased: z.boolean().default(false),

  // Additional info
  biography: z.string().max(5000, 'Tieu su khong duoc vuot qua 5000 ky tu').optional(),
  occupation: z.string().max(100, 'Nghe nghiep khong duoc vuot qua 100 ky tu').optional(),
  nationality: z.string().max(50, 'Quoc tich khong duoc vuot qua 50 ky tu').optional(),

  // Contact (for living persons)
  email: z.string().email('Dia chi email khong hop le').optional().or(z.literal('')),
  phone: z.string().max(20, 'So dien thoai khong duoc vuot qua 20 ky tu').optional(),
}).refine(
  (data) => {
    // Death date must be after birth date (strictly greater than)
    if (data.birthDate && data.deathDate) {
      return new Date(data.deathDate) > new Date(data.birthDate);
    }
    return true;
  },
  {
    message: 'Ngay mat phai sau ngay sinh',
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
  errorMap: () => ({ message: 'Loai moi quan he khong hop le' }),
});

/**
 * Person relationship schema for adding connected person
 */
export const personRelationshipSchema = z.object({
  relationshipType: relationshipTypeEnum,
  relatedPersonId: z.string().min(1, 'Nguoi lien quan la bat buoc'),
});

/**
 * Multiple relationships schema for person form
 */
export const personRelationshipsSchema = z.array(personRelationshipSchema).min(0).default([]);

/**
 * Add person to tree schema (person + single relationship for backward compatibility)
 */
export const addPersonToTreeSchema = personFormSchema.and(
  z.object({
    relationshipType: relationshipTypeEnum.optional(),
    connectToPersonId: z.string().optional(),
    relationships: personRelationshipsSchema.optional(),
  })
);

/**
 * Types inferred from schemas
 */
export type PersonFormInput = z.infer<typeof personFormSchema>;
export type PersonRelationshipInput = z.infer<typeof personRelationshipSchema>;
export type PersonRelationshipsInput = z.infer<typeof personRelationshipsSchema>;
export type AddPersonToTreeInput = z.infer<typeof addPersonToTreeSchema>;
export type GenderType = z.infer<typeof genderEnum>;
export type RelationshipType = z.infer<typeof relationshipTypeEnum>;
