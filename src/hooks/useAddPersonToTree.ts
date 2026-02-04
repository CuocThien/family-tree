import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AddPersonToTreeInput } from '@/schemas/person';

interface AddPersonResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface AddPersonVariables extends AddPersonToTreeInput {
  treeId: string;
}

export function useAddPersonToTree() {
  const queryClient = useQueryClient();

  const addPerson = useMutation({
    mutationFn: async (variables: AddPersonVariables): Promise<AddPersonResponse> => {
      try {
        const { treeId, connectToPersonId, relationshipType, ...personData } = variables;

        // Create the person
        const personResponse = await fetch('/api/persons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            treeId,
            firstName: personData.firstName,
            lastName: personData.lastName,
            middleName: personData.middleName,
            gender: personData.gender,
            dateOfBirth: personData.birthDate ? new Date(personData.birthDate) : undefined,
            dateOfDeath: personData.deathDate ? new Date(personData.deathDate) : undefined,
            biography: personData.biography,
          }),
        });

        if (!personResponse.ok) {
          const error = await personResponse.json();
          return {
            success: false,
            error: error.error?.message || 'Failed to add person',
          };
        }

        const { data: newPerson } = await personResponse.json();

        // If connecting to existing person, create relationship
        if (connectToPersonId && relationshipType) {
          const relationshipResponse = await fetch('/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              treeId,
              fromPersonId: connectToPersonId,
              toPersonId: newPerson._id,
              type: relationshipType,
            }),
          });

          if (!relationshipResponse.ok) {
            const error = await relationshipResponse.json();
            return {
              success: false,
              error: error.error?.message || 'Failed to create relationship',
            };
          }
        }

        return {
          success: true,
          data: newPerson,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add person',
        };
      }
    },
    onSuccess: (data, variables) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({
          queryKey: ['tree-data', variables.treeId],
        });
      }
    },
  });

  return { addPerson };
}
