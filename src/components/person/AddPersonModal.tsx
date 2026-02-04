'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { addPersonToTreeSchema, type AddPersonToTreeInput, type GenderType, type RelationshipType } from '@/schemas/person';
import { cn } from '@/lib/utils';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeId: string;
  connectToPersonId?: string;
  connectToName?: string;
  defaultRelationship?: RelationshipType;
  onCreate?: (data: AddPersonToTreeInput) => Promise<{ success: boolean; error?: string }>;
}

export function AddPersonModal({
  isOpen,
  onClose,
  treeId,
  connectToPersonId,
  connectToName,
  defaultRelationship,
  onCreate,
}: AddPersonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<GenderType>('male');
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipType>(
    defaultRelationship || 'child'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AddPersonToTreeInput>({
    resolver: zodResolver(addPersonToTreeSchema),
    defaultValues: {
      gender: 'male',
      isDeceased: false,
    },
  });

  const isDeceased = watch('isDeceased');
  const deathDate = watch('deathDate');

  // Auto-set isDeceased to true when death date is entered
  useEffect(() => {
    if (deathDate && deathDate !== '' && !isDeceased) {
      // Use setValue to update the checkbox without triggering re-render
      // The form will be submitted with the correct isDeceased value
    }
  }, [deathDate, isDeceased]);

  // Auto-update isDeceased in form data before submission
  const onSubmit = async (data: AddPersonToTreeInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const submitData = {
        ...data,
        isDeceased: !!data.deathDate || data.isDeceased,
      };
      const result = onCreate
        ? await onCreate({
            ...submitData,
            connectToPersonId,
            relationshipType: connectToPersonId ? selectedRelationship : undefined,
          })
        : { success: true };

      if (result.success) {
        reset();
        onClose();
      } else {
        setError(result.error || 'Failed to add person');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add person');
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

  const relationships: { value: RelationshipType; label: string; icon: string }[] = [
    { value: 'parent', label: 'Parent', icon: 'north' },
    { value: 'child', label: 'Child', icon: 'south' },
    { value: 'spouse', label: 'Spouse', icon: 'favorite' },
    { value: 'sibling', label: 'Sibling', icon: 'group' },
  ];

  // Don't render modal if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-dark/30 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Side Panel */}
      <aside className="relative right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#152528] shadow-2xl flex flex-col z-20 overflow-y-auto border-l border-[#e7f1f3] dark:border-[#2a3a3d]">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 p-6 border-b border-[#e7f1f3] dark:border-[#2a3a3d]">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#0d191b] dark:text-white text-2xl font-black leading-tight tracking-[-0.033em]">
              Add New Member
            </h2>
            {connectToName && (
              <p className="text-[#4c8d9a] text-sm font-normal leading-normal">
                Connecting to <span className="font-bold text-[#0d191b] dark:text-primary">{connectToName}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center rounded-xl size-10 hover:bg-[#f0f5f6] dark:hover:bg-[#1f2f32] transition-colors"
          >
            <MaterialSymbol icon="close" className="text-[#4c8d9a]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6 flex-1">
          {/* Error Display */}
          {error && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#0d191b] dark:text-white text-lg font-bold leading-tight">
              Identity
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <p className="text-[#0d191b] dark:text-white text-sm font-medium">First Name</p>
                <Input
                  placeholder="e.g. Emily"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
              </label>
              <label className="flex flex-col gap-2">
                <p className="text-[#0d191b] dark:text-white text-sm font-medium">Last Name</p>
                <Input
                  placeholder="e.g. Smith"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </label>
            </div>
          </div>

          {/* Gender Selection */}
          <div className="flex flex-col gap-4">
            <p className="text-[#0d191b] dark:text-white text-sm font-medium">Gender</p>
            <div className="flex gap-2">
              {genders.map((gender) => (
                <label key={gender.value} className="flex flex-1 items-center justify-center">
                  <input
                    type="radio"
                    className="sr-only"
                    {...register('gender')}
                    value={gender.value}
                    checked={selectedGender === gender.value}
                    onChange={() => setSelectedGender(gender.value)}
                  />
                  <span
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer',
                      selectedGender === gender.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[#cfe3e7] dark:border-[#2a3a3d] hover:bg-[#f8fbfc] dark:hover:bg-[#1a2e32] text-[#0d191b] dark:text-white'
                    )
                    }
                  >
                    <MaterialSymbol
                      icon={gender.icon as any}
                      className={cn(
                        'text-[20px]',
                        selectedGender === gender.value ? 'text-primary' : 'text-[#4c8d9a]'
                      )}
                    />
                    {gender.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Relationship Selection */}
          {connectToPersonId && (
            <div className="flex flex-col gap-4">
              <p className="text-[#0d191b] dark:text-white text-sm font-medium">
                Relationship to {connectToName}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {relationships.map((rel) => (
                  <button
                    key={rel.value}
                    type="button"
                    onClick={() => setSelectedRelationship(rel.value)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all',
                      selectedRelationship === rel.value
                        ? 'border-primary bg-primary/5'
                        : 'border-[#cfe3e7] dark:border-[#2a3a3d] hover:border-primary'
                    )
                  }
                  >
                    <div
                      className={cn(
                        'size-8 rounded-full flex items-center justify-center',
                        selectedRelationship === rel.value
                          ? 'bg-primary'
                          : 'bg-[#f0f5f6] dark:bg-[#2a3a3d]'
                      )
                    }
                    >
                      <MaterialSymbol
                        icon={rel.icon as any}
                        className={cn(
                          'text-sm',
                          selectedRelationship === rel.value ? 'text-white' : 'text-[#4c8d9a]'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        selectedRelationship === rel.value ? 'font-bold' : ''
                      )}
                    >
                      {rel.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Details Toggle */}
          <div className="border-t border-[#e7f1f3] dark:border-[#2a3a3d] pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-primary text-sm font-bold"
            >
              <MaterialSymbol icon={showAdvanced ? 'remove_circle' : 'add_circle'} />
              {showAdvanced ? 'Hide' : 'Add more details'} (Birth, Place, Occupation)
            </button>
          </div>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <p className="text-[#0d191b] dark:text-white text-sm font-medium">Birth Date</p>
                  <Input
                    type="date"
                    error={errors.birthDate?.message}
                    {...register('birthDate')}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <p className="text-[#0d191b] dark:text-white text-sm font-medium">Birth Place</p>
                  <Input
                    placeholder="e.g. London, UK"
                    {...register('birthPlace')}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <p className="text-[#0d191b] dark:text-white text-sm font-medium">Death Date</p>
                  <Input
                    type="date"
                    error={errors.deathDate?.message}
                    {...register('deathDate')}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <p className="text-[#0d191b] dark:text-white text-sm font-medium">Death Place</p>
                  <Input
                    placeholder="e.g. New York, USA"
                    {...register('deathPlace')}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <p className="text-[#0d191b] dark:text-white text-sm font-medium">Occupation</p>
                <Input
                  placeholder="e.g. Teacher"
                  {...register('occupation')}
                />
              </label>

              <label className="flex flex-col gap-2">
                <p className="text-[#0d191b] dark:text-white text-sm font-medium">Biography</p>
                <Textarea
                  placeholder="Life story and achievements..."
                  rows={4}
                  {...register('biography')}
                />
              </label>
            </div>
          )}

          {/* Deceased Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox rounded text-primary focus:ring-primary border-[#cfe3e7] dark:border-[#2a3a3d] size-5"
              {...register('isDeceased')}
            />
            <span className="text-sm text-[#0d191b] dark:text-white font-medium">
              Person is deceased
            </span>
          </label>
        </form>

        {/* Footer Actions */}
        <div className="mt-auto p-6 border-t border-[#e7f1f3] dark:border-[#2a3a3d] flex flex-col gap-3">
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Adding...
              </>
            ) : (
              'Add to Family Tree'
            )}
          </Button>
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            className="w-full"
            disabled={isSubmitting}
          >
            Cancel and Go Back
          </Button>
        </div>
      </aside>
    </div>
  );
}
