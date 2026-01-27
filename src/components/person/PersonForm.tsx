'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

const personFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  biography: z.string().optional(),
});

export type PersonFormData = z.infer<typeof personFormSchema>;

export interface PersonFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PersonFormData) => void | Promise<void>;
  defaultValues?: Partial<PersonFormData>;
  title?: string;
  description?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
] as const;

export function PersonForm({
  open,
  onClose,
  onSubmit,
  defaultValues,
  title = 'Add Person',
  description = 'Enter the details for this person',
  submitLabel = 'Add Person',
  isSubmitting = false,
}: PersonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      dateOfDeath: '',
      gender: 'unknown',
      biography: '',
      ...defaultValues,
    },
  });

  const handleFormSubmit = async (data: PersonFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="First Name *"
            error={errors.firstName?.message}
            {...register('firstName')}
            disabled={isSubmitting}
          />
          <Input
            label="Middle Name"
            error={errors.middleName?.message}
            {...register('middleName')}
            disabled={isSubmitting}
          />
          <Input
            label="Last Name *"
            error={errors.lastName?.message}
            {...register('lastName')}
            disabled={isSubmitting}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date of Birth"
            type="date"
            error={errors.dateOfBirth?.message}
            hint="Optional"
            {...register('dateOfBirth')}
            disabled={isSubmitting}
          />
          <Input
            label="Date of Death"
            type="date"
            error={errors.dateOfDeath?.message}
            hint="Optional - leave blank if living"
            {...register('dateOfDeath')}
            disabled={isSubmitting}
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold text-[#0d191b] dark:text-white mb-2">
            Gender
          </label>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all',
                  'border border-[#e7f1f3] dark:border-white/10',
                  'hover:bg-[#e7f1f3] dark:hover:bg-white/5',
                  'has-[:checked]:bg-[#13c8ec] has-[:checked]:text-white has-[:checked]:border-[#13c8ec]'
                )}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register('gender')}
                  disabled={isSubmitting}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>
          )}
        </div>

        {/* Biography */}
        <div>
          <label className="block text-sm font-semibold text-[#0d191b] dark:text-white mb-2">
            Biography
          </label>
          <textarea
            {...register('biography')}
            disabled={isSubmitting}
            rows={4}
            className={cn(
              'block w-full rounded-xl border-none bg-[#e7f1f3] dark:bg-white/5',
              'px-4 py-3 text-[#0d191b] dark:text-white',
              'placeholder:text-[#4c8d9a]',
              'focus:ring-2 focus:ring-[#13c8ec] focus:bg-white dark:focus:bg-white/10',
              'transition-all resize-none'
            )}
            placeholder="Add a biography or notes about this person..."
          />
        </div>

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
            type="submit"
            loading={isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

PersonForm.displayName = 'PersonForm';
