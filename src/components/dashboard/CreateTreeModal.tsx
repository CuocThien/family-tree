'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { treeFormSchema, type TreeFormInput } from '@/schemas/tree';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface CreateTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (data: TreeFormInput) => Promise<{ success: boolean; error?: string; data?: unknown }>;
}

type VisibilityType = 'private' | 'family' | 'public';

export function CreateTreeModal({ isOpen, onClose, onCreate }: CreateTreeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityType>('private');
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TreeFormInput>({
    resolver: zodResolver(treeFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      description: '',
      visibility: 'private',
      allowCollaborators: false,
    },
  });

  const onSubmit = async (data: TreeFormInput) => {
    setIsSubmitting(true);
    try {
      if (onCreate) {
        const result = await onCreate({ ...data, visibility });
        if (result.success) {
          showToast('Tree created successfully!', 'success');
          reset();
          onClose();
        } else {
          showToast(result.error || 'Failed to create tree', 'error');
        }
      }
    } catch {
      showToast('Failed to create tree', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Create New Family Tree"
      description="Start documenting your family heritage"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tree Name */}
        <Input
          label="Tree Name"
          required
          placeholder="e.g., Smith Family Tree"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Brief description of your family tree..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        {/* Visibility */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-[#0d191b] dark:text-white">
            Who can view this tree?
          </label>
          <div className="space-y-2">
            {[
              { value: 'private', label: 'Private', description: 'Only you can view' },
              { value: 'family', label: 'Family', description: 'Invite family members' },
              { value: 'public', label: 'Public', description: 'Anyone with link' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisibility(option.value as VisibilityType)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                  visibility === option.value
                    ? 'border-[#13c8ec] bg-[#13c8ec]/5'
                    : 'border-[#e7f1f3] dark:border-white/10 hover:border-[#13c8ec]/50'
                )}
              >
                <div>
                  <p className="font-semibold text-[#0d191b] dark:text-white">{option.label}</p>
                  <p className="text-sm text-[#4c8d9a]">{option.description}</p>
                </div>
                <div
                  className={cn(
                    'size-5 rounded-full border-2 flex items-center justify-center',
                    visibility === option.value
                      ? 'border-[#13c8ec] bg-[#13c8ec]'
                      : 'border-[#cbd5e1]'
                  )}
                >
                  {visibility === option.value && (
                    <div className="size-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Allow Collaborators Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#e7f1f3] dark:bg-white/5">
          <div>
            <p className="font-semibold text-[#0d191b] dark:text-white">
              Allow Collaborators
            </p>
            <p className="text-sm text-[#4c8d9a]">
              Let family members add and edit people
            </p>
          </div>
          <Toggle
            checked={!!watch('allowCollaborators')}
            onChange={(checked) => setValue('allowCollaborators', checked)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Tree'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
