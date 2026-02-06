import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AddPersonToTreeInput } from '@/schemas/person';
import { normalizeRelationshipType, type NormalizedRelationship } from '@/utils/relationshipNormalization';

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
        const { treeId, relationships, connectToPersonId, relationshipType, ...personData } = variables;

        // Prepare relationships array
        const relationshipsToCreate = relationships || [];

        // For backward compatibility, if connectToPersonId and relationshipType are provided
        // but no relationships array, add them to the array
        if (connectToPersonId && relationshipType && relationshipsToCreate.length === 0) {
          relationshipsToCreate.push({
            relatedPersonId: connectToPersonId,
            relationshipType,
          });
        }

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

        // Create relationships
        const relationshipPromises = relationshipsToCreate.map((rel) => {
          // Normalize the relationship type to be stored from the parent's perspective
          const normalized = normalizeRelationshipType(
            rel.relationshipType,
            rel.relatedPersonId,
            newPerson._id
          );

          return fetch('/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              treeId,
              fromPersonId: normalized.fromPersonId,
              toPersonId: normalized.toPersonId,
              type: normalized.type,
            }),
          });
        });

        const relationshipResponses = await Promise.all(relationshipPromises);

        // Check if any relationship creation failed
        const failedRelationship = relationshipResponses.find((res) => !res.ok);
        if (failedRelationship) {
          const error = await failedRelationship.json();
          return {
            success: false,
            error: error.error?.message || 'Failed to create relationship',
          };
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

// Re-export utility function for testing convenience
export { normalizeRelationshipType, type NormalizedRelationship } from '@/utils/relationshipNormalization';
