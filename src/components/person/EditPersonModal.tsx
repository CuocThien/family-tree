'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { RelationshipEntry } from '@/components/person/RelationshipEntry';
import { PersonSearchSelector } from '@/components/person/PersonSearchSelector';
import { RelationshipTypeSelector } from '@/components/person/RelationshipTypeSelector';
import { useManageRelationships } from '@/hooks/useManageRelationships';
import { personFormSchema, type PersonFormInput, type GenderType } from '@/schemas/person';
import { cn } from '@/lib/utils';
import type { IPerson } from '@/types/person';

interface EditPersonModalProps {
  isOpen: boolean;
  person: IPerson;
  treeId: string;
  onClose: () => void;
  onUpdate?: (data: PersonFormInput & { relationships?: any[] }) => Promise<{ success: boolean; error?: string }>;
  existingRelationships?: Array<{ _id: string; relatedPersonId: string; relationshipType: string; relatedPersonName?: string; relatedPersonGender?: string }>;
  isFetchingRelationships?: boolean;
}

export function EditPersonModal({ isOpen, person, treeId, onClose, onUpdate, existingRelationships = [], isFetchingRelationships = false }: EditPersonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<GenderType>(
    (person.gender as GenderType) || 'male'
  );
  const [showRelationshipsSection, setShowRelationshipsSection] = useState(existingRelationships.length > 0);

  // Initialize useManageRelationships with existing relationships
  const initialRelationships = existingRelationships.map((rel) => ({
    relatedPersonId: rel.relatedPersonId,
    relationshipType: rel.relationshipType as any,
    relatedPersonName: rel.relatedPersonName,
    relatedPersonGender: rel.relatedPersonGender as any,
  }));

  const relationshipsManager = useManageRelationships({
    initialRelationships,
    maxRelationships: 10,
  });

  // Sync relationships when existingRelationships changes (e.g., after API fetch completes)
  useEffect(() => {
    if (existingRelationships.length > 0 && !isFetchingRelationships) {
      const mappedRelationships = existingRelationships.map((rel) => ({
        relatedPersonId: rel.relatedPersonId,
        relationshipType: rel.relationshipType as any,
        relatedPersonName: rel.relatedPersonName,
        relatedPersonGender: rel.relatedPersonGender as any,
      }));
      relationshipsManager.syncRelationships(mappedRelationships);
      setShowRelationshipsSection(true);
    }
  }, [existingRelationships, isFetchingRelationships, relationshipsManager]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PersonFormInput>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName || '',
      suffix: person.suffix || '',
      gender: (person.gender as GenderType) || 'male',
      birthDate: person.dateOfBirth ? person.dateOfBirth.toString().split('T')[0] : '',
      deathDate: person.dateOfDeath ? person.dateOfDeath.toString().split('T')[0] : '',
      birthPlace: person.birthPlace || '',
      deathPlace: person.deathPlace || '',
      isDeceased: !!person.dateOfDeath,
      biography: person.biography || '',
      occupation: person.occupation || '',
      nationality: person.nationality || '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: PersonFormInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const submitData = {
        ...data,
        relationships: relationshipsManager.getRelationshipsForSubmit(),
      };
      const result = onUpdate ? await onUpdate(submitData) : { success: true };
      if (result.success) {
        reset();
        onClose();
      } else {
        setError(result.error || 'Failed to update person');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update person');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    reset();
    onClose();
  };

  const genders: { value: GenderType; label: string; icon: string }[] = [
    { value: 'male', label: 'Male', icon: 'male' },
    { value: 'female', label: 'Female', icon: 'female' },
    { value: 'other', label: 'Other', icon: 'person' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#152528] rounded-2xl shadow-2xl border border-[#e7f1f3] dark:border-[#2a3a3d] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e7f1f3] dark:border-[#2a3a3d]">
          <h2 className="text-2xl font-bold text-[#0d191b] dark:text-white">
            Edit Person
          </h2>
          <button onClick={handleClose} className="size-10 rounded-xl hover:bg-[#f0f5f6] dark:hover:bg-[#1f2f32]">
            <MaterialSymbol icon="close" className="text-[#4c8d9a]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name *</label>
              <Input error={errors.firstName?.message} {...register('firstName')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Middle Name</label>
              <Input {...register('middleName')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name *</label>
              <Input error={errors.lastName?.message} {...register('lastName')} />
            </div>
          </div>

          {/* Suffix */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Suffix</label>
            <Input placeholder="e.g. Jr., Sr., III" {...register('suffix')} />
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Gender *</label>
            <div className="flex gap-2">
              {genders.map((gender) => (
                <button
                  key={gender.value}
                  type="button"
                  onClick={() => setSelectedGender(gender.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium',
                    selectedGender === gender.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-[#cfe3e7] dark:border-[#2a3a3d] text-[#0d191b] dark:text-white'
                  )
                }
                >
                  <MaterialSymbol icon={gender.icon as any} className="text-lg" />
                  {gender.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('gender')} value={selectedGender} />
          </div>

          {/* Relationships Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Relationships</label>
              {!showRelationshipsSection && !isFetchingRelationships && (
                <button
                  type="button"
                  onClick={() => setShowRelationshipsSection(true)}
                  className="text-primary text-sm font-bold"
                >
                  Manage
                </button>
              )}
            </div>

            {/* Loading State */}
            {isFetchingRelationships && (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-[#4c8d9a]">Loading relationships...</span>
              </div>
            )}

            {!isFetchingRelationships && showRelationshipsSection && (
              <>
                {/* Existing Relationships List */}
                {relationshipsManager.relationships.length > 0 ? (
                  <div className="space-y-2">
                    {relationshipsManager.relationships.map((rel, index) => (
                      <RelationshipEntry
                        key={rel.tempId}
                        index={index}
                        relatedPersonName={rel.relatedPersonName || 'Unknown'}
                        relationshipType={rel.relationshipType}
                        relatedPersonGender={rel.relatedPersonGender}
                        onRemove={() => relationshipsManager.removeRelationship(rel.tempId)}
                        onEdit={() => relationshipsManager.editRelationship(rel.tempId)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#4c8d9a]">No relationships yet.</p>
                )}

                {/* Add Relationship Button */}
                {relationshipsManager.canAddMore && (
                  <button
                    type="button"
                    onClick={relationshipsManager.startAddRelationship}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-[#cfe3e7] dark:border-[#2a3a3d] hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <MaterialSymbol icon="add" className="text-[#4c8d9a]" />
                    <span className="text-sm font-medium text-[#4c8d9a]">Add Relationship</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Birth Date</label>
              <Input type="date" {...register('birthDate')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Birth Place</label>
              <Input placeholder="e.g. London, UK" {...register('birthPlace')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Death Date</label>
              <Input type="date" {...register('deathDate')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Death Place</label>
              <Input placeholder="e.g. New York, USA" {...register('deathPlace')} />
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Occupation</label>
              <Input {...register('occupation')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nationality</label>
              <Input {...register('nationality')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Biography</label>
              <Textarea rows={4} {...register('biography')} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>

        {/* Person Search Selector */}
        {relationshipsManager.showPersonSelector && (
          <PersonSearchSelector
            treeId={treeId}
            excludePersonIds={[person._id]}
            onSelect={relationshipsManager.selectPerson}
            onClose={relationshipsManager.closePersonSelector}
          />
        )}

        {/* Relationship Type Selector */}
        {relationshipsManager.showTypeSelector && (
          <RelationshipTypeSelector
            onSelect={relationshipsManager.selectRelationshipType}
            onClose={relationshipsManager.closeTypeSelector}
          />
        )}
      </div>
    </div>
  );
}
