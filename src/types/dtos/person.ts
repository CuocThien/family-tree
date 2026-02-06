import { z } from 'zod';
import { Gender } from '../person';

export const CreatePersonDtoSchema = z.object({
  treeId: z.string().min(1, 'Tree ID is required'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').trim(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').trim(),
  middleName: z.string().max(100).trim().optional(),
  suffix: z.string().max(50).trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
  dateOfDeath: z.coerce.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown'] as const).optional(),
  birthPlace: z.string().max(200).trim().optional(),
  deathPlace: z.string().max(200).trim().optional(),
  biography: z.string().max(5000).optional(),
  occupation: z.string().max(200).trim().optional(),
  nationality: z.string().max(100).trim().optional(),
  photos: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  customAttributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
}).refine(
  (data) => !data.dateOfDeath || !data.dateOfBirth || data.dateOfDeath >= data.dateOfBirth,
  { message: 'Death date must be after birth date', path: ['dateOfDeath'] }
);

export type CreatePersonDto = z.infer<typeof CreatePersonDtoSchema>;

export const UpdatePersonDtoSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  middleName: z.string().max(100).trim().optional(),
  suffix: z.string().max(50).trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
  dateOfDeath: z.coerce.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown'] as const).optional(),
  birthPlace: z.string().max(200).trim().optional(),
  deathPlace: z.string().max(200).trim().optional(),
  biography: z.string().max(5000).optional(),
  occupation: z.string().max(200).trim().optional(),
  nationality: z.string().max(100).trim().optional(),
  photos: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  customAttributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
}).refine(
  (data) => !data.dateOfDeath || !data.dateOfBirth || data.dateOfDeath >= data.dateOfBirth,
  { message: 'Death date must be after birth date', path: ['dateOfDeath'] }
);

export type UpdatePersonDto = z.infer<typeof UpdatePersonDtoSchema>;
