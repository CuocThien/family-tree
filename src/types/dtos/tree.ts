import { z } from 'zod';
import { PermissionLevel, PhotoQuality } from '../tree';

export const CreateTreeDtoSchema = z.object({
  name: z.string().min(1, 'Tree name is required').max(200, 'Tree name too long').trim(),
  rootPersonId: z.string().optional(),
  settings: z.object({
    isPublic: z.boolean().optional(),
    allowComments: z.boolean().optional(),
    defaultPhotoQuality: z.enum(['low', 'medium', 'high'] as const).optional(),
    language: z.string().length(2).optional(),
  }).strict().optional(),
});

export type CreateTreeDto = z.infer<typeof CreateTreeDtoSchema>;

export const UpdateTreeDtoSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  rootPersonId: z.string().optional(),
  settings: z.object({
    isPublic: z.boolean().optional(),
    allowComments: z.boolean().optional(),
    defaultPhotoQuality: z.enum(['low', 'medium', 'high'] as const).optional(),
    language: z.string().length(2).optional(),
  }).strict().optional(),
});

export type UpdateTreeDto = z.infer<typeof UpdateTreeDtoSchema>;
