'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { DashboardNavbar } from '@/components/dashboard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { cn } from '@/lib/utils';
import type { ITree } from '@/types/tree';

interface NewTreeContentProps {
  userId: string;
}

type VisibilityType = 'private' | 'family' | 'public';

interface CreateTreeData {
  name: string;
  description?: string;
  visibility: VisibilityType;
  allowCollaborators: boolean;
}

export function NewTreeContent({ userId }: NewTreeContentProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<VisibilityType>('private');

  const [formData, setFormData] = useState<CreateTreeData>({
    name: '',
    description: '',
    visibility: 'private',
    allowCollaborators: false,
  });

  const createTreeMutation = useMutation({
    mutationFn: async (data: CreateTreeData) => {
      const response = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          privacy: data.visibility,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tree');
      }

      return response.json().then((res) => res.data);
    },
    onSuccess: (tree: ITree) => {
      router.push(`/dashboard/trees/${tree._id}`);
    },
    onError: (error: Error) => {
      setErrors({ form: error.message });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tree name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Tree name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tree name must not exceed 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    createTreeMutation.mutate(formData);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <DashboardNavbar />

      <main className="max-w-3xl mx-auto px-4 md:px-10 lg:px-40 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center justify-center size-10 rounded-xl hover:bg-[#e7f1f3] dark:hover:bg-[#1e2f32] transition-colors text-[#4c8d9a]"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#0d191b] dark:text-white tracking-tight">
              Create New Family Tree
            </h1>
            <p className="text-base text-[#4c8d9a] mt-1">
              Start documenting your family heritage
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#152528] rounded-2xl shadow-sm border border-[#e7f1f3] dark:border-[#2a3a3d] p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Tree Name */}
            <div className="space-y-3">
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-[#0d191b] dark:text-white uppercase tracking-wider">
                <MaterialSymbol icon="account_tree" className="text-lg text-primary" />
                Tree Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="e.g., Smith Family Tree"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-[#4c8d9a]">
                3-100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-[#0d191b] dark:text-white uppercase tracking-wider">
                <MaterialSymbol icon="description" className="text-lg text-primary" />
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Brief description of your family tree..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={errors.description}
                disabled={isSubmitting}
              />
              <p className="text-xs text-[#4c8d9a]">
                Optional, max 500 characters
              </p>
            </div>

            {/* Visibility */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-[#0d191b] dark:text-white uppercase tracking-wider">
                <MaterialSymbol icon="visibility" className="text-lg text-primary" />
                Who can view this tree?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: 'private' as const, label: 'Private', description: 'Only you can view', icon: 'lock' },
                  { value: 'family' as const, label: 'Family', description: 'Invite family members', icon: 'group' },
                  { value: 'public' as const, label: 'Public', description: 'Anyone with link', icon: 'public' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: option.value })}
                    disabled={isSubmitting}
                    className={cn(
                      'relative p-5 rounded-xl border-2 transition-all text-left',
                      visibility === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-[#e7f1f3] dark:border-[#2a3a3d] hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'size-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        visibility === option.value ? 'bg-primary' : 'bg-[#e7f1f3] dark:bg-[#2a3a3d]'
                      )}>
                        <MaterialSymbol
                          icon={option.icon}
                          className={cn(
                            visibility === option.value ? 'text-white' : 'text-[#4c8d9a]'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-semibold text-sm',
                          visibility === option.value ? 'text-primary' : 'text-[#0d191b] dark:text-white'
                        )}>
                          {option.label}
                        </p>
                        <p className="text-xs text-[#4c8d9a] mt-0.5">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    {visibility === option.value && (
                      <div className="absolute top-3 right-3">
                        <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                          <MaterialSymbol icon="check" className="text-white text-sm" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Error */}
            {errors.form && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <MaterialSymbol icon="error" className="text-red-500 text-xl flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.form}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#e7f1f3] dark:border-[#2a3a3d]">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
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
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Tree...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <MaterialSymbol icon="add" />
                    Create Tree
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <MaterialSymbol icon="info" className="text-blue-500 text-2xl flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>You can add people, relationships, and photos to your tree</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Invite family members to collaborate on your tree</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Export your tree as PDF to share with others</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

NewTreeContent.displayName = 'NewTreeContent';
