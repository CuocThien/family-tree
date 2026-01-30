import { useMutation } from '@tanstack/react-query';
import { PersonFormInput } from '@/schemas/person';

interface UpdatePersonResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export function useUpdatePerson(personId: string) {
  const updatePerson = useMutation({
    mutationFn: async (data: PersonFormInput): Promise<UpdatePersonResponse> => {
      try {
        const response = await fetch(`/api/persons/${personId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            gender: data.gender,
            dateOfBirth: data.birthDate ? new Date(data.birthDate) : undefined,
            dateOfDeath: data.deathDate ? new Date(data.deathDate) : undefined,
            biography: data.biography,
            occupation: data.occupation,
            nationality: data.nationality,
            birthPlace: data.birthPlace,
            deathPlace: data.deathPlace,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            success: false,
            error: error.error?.message || 'Failed to update person',
          };
        }

        const { data: updated } = await response.json();
        return {
          success: true,
          data: updated,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update person',
        };
      }
    },
  });

  return { updatePerson };
}
