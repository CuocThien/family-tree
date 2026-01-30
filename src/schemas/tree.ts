import { z } from 'zod';

/**
 * Tree name validation
 * - Required
 * - 3-100 characters
 * - Alphanumeric with spaces, hyphens, apostrophes
 */
const treeNameSchema = z
  .string({
    required_error: 'Tree name is required',
  })
  .min(3, 'Tree name must be at least 3 characters')
  .max(100, 'Tree name must not exceed 100 characters')
  .regex(
    /^[a-zA-Z0-9\s\-'\u00C0-\u00FF]+$/,
    'Tree name can only contain letters, numbers, spaces, hyphens, and apostrophes'
  );

/**
 * Tree description validation
 * - Optional
 * - Max 500 characters
 */
const treeDescriptionSchema = z
  .string()
  .max(500, 'Description must not exceed 500 characters')
  .optional()
  .or(z.literal(''));

/**
 * Tree visibility setting
 */
const treeVisibilitySchema = z.enum(['private', 'family', 'public'], {
  errorMap: () => ({ message: 'Invalid visibility setting' }),
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
