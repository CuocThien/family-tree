'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { RelationshipType } from '@/types/relationship';

const relationshipTypes: DropdownOption[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
];

export interface RelationshipPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (type: RelationshipType, personId: string) => void | Promise<void>;
  toPersonId?: string;
  excludePersonIds?: string[];
  availablePersons?: Array<{ _id: string; firstName: string; lastName: string }>;
  title?: string;
  description?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function RelationshipPicker({
  open,
  onClose,
  onPick,
  toPersonId,
  excludePersonIds = [],
  availablePersons = [],
  title = 'Add Relationship',
  description = 'Select the relationship type and person',
  submitLabel = 'Add Relationship',
  isSubmitting = false,
}: RelationshipPickerProps) {
  const [selectedType, setSelectedType] = useState<RelationshipType | ''>('');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [errors, setErrors] = useState<{ type?: string; person?: string }>({});

  const filteredPersons = availablePersons.filter(
    (p) => p._id !== toPersonId && !excludePersonIds.includes(p._id)
  );

  const personOptions: DropdownOption[] = filteredPersons.map((person) => ({
    value: person._id,
    label: `${person.firstName} ${person.lastName}`,
  }));

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    if (!selectedType) {
      newErrors.type = 'Please select a relationship type';
    }

    if (!selectedPersonId) {
      newErrors.person = 'Please select a person';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onPick(selectedType as RelationshipType, selectedPersonId);

    // Reset form
    setSelectedType('');
    setSelectedPersonId('');
    setErrors({});
  };

  const handleClose = () => {
    setSelectedType('');
    setSelectedPersonId('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Relationship Type */}
        <div>
          <label className="block text-sm font-semibold text-[#0d191b] dark:text-white mb-2">
            Relationship Type *
          </label>
          <Dropdown
            options={relationshipTypes}
            value={selectedType}
            onChange={(value) => {
              setSelectedType(value as RelationshipType);
              setErrors((prev) => ({ ...prev, type: undefined }));
            }}
            placeholder="Select relationship type"
          />
          {errors.type && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.type}
            </p>
          )}
        </div>

        {/* Person Selection */}
        <div>
          <label className="block text-sm font-semibold text-[#0d191b] dark:text-white mb-2">
            Select Person *
          </label>
          <Dropdown
            options={personOptions}
            value={selectedPersonId}
            onChange={(value) => {
              setSelectedPersonId(value);
              setErrors((prev) => ({ ...prev, person: undefined }));
            }}
            placeholder="Select a person"
          />
          {errors.person && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.person}
            </p>
          )}
        </div>

        {/* No persons available message */}
        {filteredPersons.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-[#4c8d9a]">
              No other persons available in this tree. Add more people first.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={filteredPersons.length === 0}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

RelationshipPicker.displayName = 'RelationshipPicker';
