import { z } from 'zod';
import { RelationshipType } from '../relationship';

export const CreateRelationshipDtoSchema = z.object({
  treeId: z.string().min(1, 'Tree ID is required'),
  person1Id: z.string().min(1, 'Person 1 ID is required'),
  person2Id: z.string().min(1, 'Person 2 ID is required'),
  type: z.enum(['parent', 'child', 'spouse', 'sibling'] as const, {
    errorMap: () => ({ message: 'Invalid relationship type' }),
  }),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
).refine(
  (data) => data.person1Id !== data.person2Id,
  { message: 'Cannot create relationship with same person', path: ['person2Id'] }
);

export type CreateRelationshipDto = z.infer<typeof CreateRelationshipDtoSchema>;

export const UpdateRelationshipDtoSchema = z.object({
  type: z.enum(['parent', 'child', 'spouse', 'sibling'] as const).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);

export type UpdateRelationshipDto = z.infer<typeof UpdateRelationshipDtoSchema>;
