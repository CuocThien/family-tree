import { useQuery } from '@tanstack/react-query';

export const personRelationshipsKeys = {
  all: ['person-relationships'] as const,
  detail: (personId: string) => [...personRelationshipsKeys.all, personId] as const,
};

/**
 * Relationship data structure returned from the API
 */
export interface RelationshipData {
  _id: string;
  relatedPersonId: string;
  relationshipType: 'parent' | 'child' | 'spouse' | 'sibling';
  relatedPersonName: string;
}

/**
 * Options for usePersonRelationships hook
 */
interface UsePersonRelationshipsOptions {
  personId: string;
  enabled?: boolean;
}

/**
 * Custom hook to fetch person relationships
 * Uses React Query for caching and automatic refetching
 *
 * @param options - Hook options including personId and enabled flag
 * @returns React Query result with relationship data
 */
export function usePersonRelationships(options: UsePersonRelationshipsOptions) {
  const { personId, enabled = true } = options;

  return useQuery<RelationshipData[]>({
    queryKey: personRelationshipsKeys.detail(personId),
    queryFn: async (): Promise<RelationshipData[]> => {
      const response = await fetch(`/api/persons/${personId}/relationships`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch relationships');
      }
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!personId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
