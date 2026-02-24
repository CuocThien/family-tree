import { useState, useCallback } from 'react';
import { RelationshipType, PersonRelationshipInput } from '@/schemas/person';
import type { IPerson, Gender } from '@/types/person';

interface RelationshipState extends PersonRelationshipInput {
  tempId: string;
  relatedPersonName?: string;
  relatedPersonGender?: Gender;
}

interface UseManageRelationshipsOptions {
  initialRelationships?: PersonRelationshipInput[];
  maxRelationships?: number;
}

interface UseManageRelationshipsReturn {
  relationships: RelationshipState[];
  isAddingRelationship: boolean;
  editingIndex: number | null;
  showPersonSelector: boolean;
  showTypeSelector: boolean;
  pendingPerson: IPerson | null;
  startAddRelationship: () => void;
  cancelAddRelationship: () => void;
  selectPerson: (person: IPerson) => void;
  selectRelationshipType: (type: RelationshipType) => void;
  removeRelationship: (tempId: string) => void;
  editRelationship: (tempId: string) => void;
  cancelEdit: () => void;
  updateRelationshipType: (tempId: string, type: RelationshipType) => void;
  closePersonSelector: () => void;
  closeTypeSelector: () => void;
  getRelationshipsForSubmit: () => PersonRelationshipInput[];
  canAddMore: boolean;
  syncRelationships: (newRelationships: PersonRelationshipInput[]) => void;
}

export function useManageRelationships({
  initialRelationships = [],
  maxRelationships = 10,
}: UseManageRelationshipsOptions = {}): UseManageRelationshipsReturn {
  const [relationships, setRelationships] = useState<RelationshipState[]>(() =>
    initialRelationships.map((rel, index) => ({
      ...rel,
      tempId: `rel-${Date.now()}-${index}`,
      relatedPersonName: (rel as any).relatedPersonName || '',
      relatedPersonGender: (rel as any).relatedPersonGender,
    }))
  );

  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showPersonSelector, setShowPersonSelector] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [pendingPerson, setPendingPerson] = useState<IPerson | null>(null);

  const canAddMore = relationships.length < maxRelationships;

  const startAddRelationship = useCallback(() => {
    if (!canAddMore) return;
    setIsAddingRelationship(true);
    setShowPersonSelector(true);
  }, [canAddMore]);

  const cancelAddRelationship = useCallback(() => {
    setIsAddingRelationship(false);
    setPendingPerson(null);
    setShowPersonSelector(false);
    setShowTypeSelector(false);
  }, []);

  const selectPerson = useCallback((person: IPerson) => {
    setPendingPerson(person);
    setShowPersonSelector(false);
    setShowTypeSelector(true);
  }, []);

  const removeRelationship = useCallback((tempId: string) => {
    setRelationships((prev) => prev.filter((rel) => rel.tempId !== tempId));
  }, []);

  const editRelationship = useCallback((tempId: string) => {
    const index = relationships.findIndex((rel) => rel.tempId === tempId);
    if (index !== -1) {
      setEditingIndex(index);
      setShowTypeSelector(true);
    }
  }, [relationships]);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setShowTypeSelector(false);
  }, []);

  const updateRelationshipType = useCallback((tempId: string, type: RelationshipType) => {
    setRelationships((prev) =>
      prev.map((rel) =>
        rel.tempId === tempId ? { ...rel, relationshipType: type } : rel
      )
    );
    setEditingIndex(null);
    setShowTypeSelector(false);
  }, []);

  const selectRelationshipType = useCallback((type: RelationshipType) => {
    if (editingIndex !== null) {
      const tempId = relationships[editingIndex].tempId;
      updateRelationshipType(tempId, type);
    } else if (pendingPerson) {
      const newRelationship: RelationshipState = {
        tempId: `rel-${Date.now()}`,
        relatedPersonId: pendingPerson._id,
        relationshipType: type,
        relatedPersonName: `${pendingPerson.firstName} ${pendingPerson.lastName}`,
        relatedPersonGender: pendingPerson.gender,
      };

      setRelationships((prev) => [...prev, newRelationship]);
      cancelAddRelationship();
    }
  }, [editingIndex, pendingPerson, relationships, updateRelationshipType, cancelAddRelationship]);

  const closePersonSelector = useCallback(() => {
    setShowPersonSelector(false);
    if (!pendingPerson) {
      cancelAddRelationship();
    }
  }, [pendingPerson, cancelAddRelationship]);

  const closeTypeSelector = useCallback(() => {
    setShowTypeSelector(false);
    if (editingIndex !== null) {
      cancelEdit();
    } else if (!pendingPerson) {
      cancelAddRelationship();
    }
  }, [editingIndex, pendingPerson, cancelEdit, cancelAddRelationship]);

  const getRelationshipsForSubmit = useCallback((): PersonRelationshipInput[] => {
    return relationships.map(({ relatedPersonId, relationshipType }) => ({
      relatedPersonId,
      relationshipType,
    }));
  }, [relationships]);

  const syncRelationships = useCallback((newRelationships: PersonRelationshipInput[]) => {
    setRelationships(newRelationships.map((rel, index) => ({
      ...rel,
      tempId: `rel-${Date.now()}-${index}`,
      relatedPersonName: (rel as any).relatedPersonName || '',
      relatedPersonGender: (rel as any).relatedPersonGender,
    })));
  }, []);

  return {
    relationships,
    isAddingRelationship,
    editingIndex,
    showPersonSelector,
    showTypeSelector,
    pendingPerson,
    startAddRelationship,
    cancelAddRelationship,
    selectPerson,
    selectRelationshipType,
    removeRelationship,
    editRelationship,
    cancelEdit,
    updateRelationshipType,
    closePersonSelector,
    closeTypeSelector,
    getRelationshipsForSubmit,
    canAddMore,
    syncRelationships,
  };
}
