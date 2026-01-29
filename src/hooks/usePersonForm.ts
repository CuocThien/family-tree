import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IPerson, Gender } from '@/types/person';
import { useCreatePerson, useUpdatePerson } from './usePerson';
import { useToast } from '@/store/uiStore';

export const personFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown'] as const).optional(),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  biography: z.string().max(5000).optional(),
}).refine(
  (data) => {
    if (data.dateOfBirth && data.dateOfDeath) {
      return new Date(data.dateOfDeath) >= new Date(data.dateOfBirth);
    }
    return true;
  },
  {
    message: 'Death date cannot be before birth date',
    path: ['dateOfDeath'],
  }
);

export type PersonFormData = z.infer<typeof personFormSchema>;

interface UsePersonFormOptions {
  treeId: string;
  person?: IPerson;
  onSuccess?: (person: IPerson) => void;
  onError?: (error: Error) => void;
}

interface UsePersonFormReturn {
  form: UseFormReturn<PersonFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  isEdit: boolean;
}

export function usePersonForm({
  treeId,
  person,
  onSuccess,
  onError,
}: UsePersonFormOptions): UsePersonFormReturn {
  const toast = useToast();
  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();

  const isEdit = !!person;

  const form = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: person
      ? {
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: person.middleName || '',
          gender: person.gender || 'unknown',
          dateOfBirth: person.dateOfBirth
            ? new Date(person.dateOfBirth).toISOString().split('T')[0]
            : '',
          dateOfDeath: person.dateOfDeath
            ? new Date(person.dateOfDeath).toISOString().split('T')[0]
            : '',
          biography: person.biography || '',
        }
      : {
          firstName: '',
          lastName: '',
          gender: 'unknown' as Gender,
        },
  });

  const onSubmit = async (data: PersonFormData) => {
    try {
      let result: IPerson;

      if (isEdit && person) {
        result = await updateMutation.mutateAsync({
          id: person._id,
          data: {
            ...data,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            dateOfDeath: data.dateOfDeath ? new Date(data.dateOfDeath) : undefined,
          },
        });
        toast.success('Person updated successfully');
      } else {
        result = await createMutation.mutateAsync({
          treeId,
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          dateOfDeath: data.dateOfDeath ? new Date(data.dateOfDeath) : undefined,
        });
        toast.success('Person added successfully');
      }

      onSuccess?.(result);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
      onError?.(err);
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isEdit,
  };
}
