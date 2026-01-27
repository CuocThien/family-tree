import { z } from 'zod';
import { PermissionLevel } from '../tree';

export const InviteCollaboratorDtoSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  role: z.enum(['viewer', 'editor', 'admin'] as const, {
    errorMap: () => ({ message: 'Invalid role. Must be viewer, editor, or admin' }),
  }),
});

export type InviteCollaboratorDto = z.infer<typeof InviteCollaboratorDtoSchema>;

export const UpdateCollaboratorRoleDtoSchema = z.object({
  role: z.enum(['viewer', 'editor', 'admin'] as const, {
    errorMap: () => ({ message: 'Invalid role. Must be viewer, editor, or admin' }),
  }),
});

export type UpdateCollaboratorRoleDto = z.infer<typeof UpdateCollaboratorRoleDtoSchema>;
