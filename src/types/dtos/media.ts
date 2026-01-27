import { z } from 'zod';
import { MediaType } from '../media';

export const UploadMediaDtoSchema = z.object({
  treeId: z.string().min(1, 'Tree ID is required'),
  personId: z.string().optional(),
  filename: z.string().min(1, 'Filename is required').max(255),
  mimeType: z.string().min(1, 'MIME type is required'),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  dateTaken: z.coerce.date().optional(),
});

export type UploadMediaDto = z.infer<typeof UploadMediaDtoSchema>;

export const UpdateMediaDtoSchema = z.object({
  personId: z.string().optional(),
  description: z.string().max(2000).optional(),
  dateTaken: z.coerce.date().optional(),
});

export type UpdateMediaDto = z.infer<typeof UpdateMediaDtoSchema>;
