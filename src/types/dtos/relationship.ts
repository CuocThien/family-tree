import { z } from 'zod';
import { RelationshipType } from '../relationship';

const relationshipTypeEnum = z.enum([
  'father',
  'mother',
  'parent',
  'child',
  'spouse',
  'sibling',
  'step-parent',
  'step-child',
  'adoptive-parent',
  'adoptive-child',
  'partner',
] as const, {
  errorMap: () => ({ message: 'Invalid relationship type' }),
});

export const CreateRelationshipDtoSchema = z.object({
  treeId: z.string().min(1, 'Tree ID is required'),
  fromPersonId: z.string().min(1, 'From person ID is required'),
  toPersonId: z.string().min(1, 'To person ID is required'),
  type: relationshipTypeEnum,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
).refine(
  (data) => data.fromPersonId !== data.toPersonId,
  { message: 'Cannot create relationship with same person', path: ['toPersonId'] }
);

export type CreateRelationshipDto = z.infer<typeof CreateRelationshipDtoSchema>;

export const UpdateRelationshipDtoSchema = z.object({
  type: relationshipTypeEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);

export type UpdateRelationshipDto = z.infer<typeof UpdateRelationshipDtoSchema>;
