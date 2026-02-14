import { z } from 'zod';

/**
 * Tree name validation
 * - Required
 * - 3-100 characters
 * - Alphanumeric with spaces, hyphens, apostrophes
 */
const treeNameSchema = z
  .string({
    required_error: 'Ten cay gia pha la bat buoc',
  })
  .min(3, 'Ten cay gia pha phai co it nhat 3 ky tu')
  .max(100, 'Ten cay gia pha khong duoc vuot qua 100 ky tu')
  .regex(
    /^[a-zA-Z0-9\s\-'\u00C0-\u00FF]+$/,
    'Ten cay gia pha chi duoc chua chu cai, so, khoang trang, gach noi va dau nhay don'
  );

/**
 * Tree description validation
 * - Optional
 * - Max 500 characters
 */
const treeDescriptionSchema = z
  .string()
  .max(500, 'Mo ta khong duoc vuot qua 500 ky tu')
  .optional()
  .or(z.literal(''));

/**
 * Tree visibility setting
 */
const treeVisibilitySchema = z.enum(['private', 'family', 'public'], {
  errorMap: () => ({ message: 'Cai dat hien thi khong hop le' }),
});

/**
 * Full tree schema for API
 */
export const treeSchema = z.object({
  name: treeNameSchema,
  description: treeDescriptionSchema,
  rootPersonId: z.string().optional(),
  isPublic: z.boolean().default(false),
  visibility: treeVisibilitySchema.default('private'),
  settings: z.object({
    allowCollaborators: z.boolean().default(false),
    allowComments: z.boolean().default(true),
  }).optional(),
});

/**
 * Tree form schema for UI (simplified)
 */
export const treeFormSchema = z.object({
  name: treeNameSchema,
  description: treeDescriptionSchema,
  visibility: treeVisibilitySchema.default('private'),
  allowCollaborators: z.boolean().default(false),
});

/**
 * Types inferred from schemas
 */
export type TreeInput = z.infer<typeof treeSchema>;
export type TreeFormInput = z.infer<typeof treeFormSchema>;
