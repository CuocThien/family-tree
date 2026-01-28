'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/store/uiStore';
import { Camera, Badge, TreePine } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500).optional(),
});

const preferencesSchema = z.object({
  defaultVisibility: z.enum(['private', 'public']),
  measurementUnit: z.enum(['metric', 'imperial']),
  openCollaboration: z.boolean(),
});

type ProfileData = z.infer<typeof profileSchema>;
type PreferencesData = z.infer<typeof preferencesSchema>;

interface ProfileSectionProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.name || '',
      email: user.email || '',
      bio: '',
    },
  });

  const preferencesForm = useForm<PreferencesData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      defaultVisibility: 'private',
      measurementUnit: 'metric',
      openCollaboration: true,
    },
  });

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const profileData = profileForm.getValues();
      const preferencesData = preferencesForm.getValues();

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, preferences: preferencesData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Personal Information */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Badge className="text-primary" size={20} />
          Personal Information
        </h2>

        <div className="space-y-8">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar src={user.image || undefined} alt={user.name || 'User'} size="xl" />
              <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Camera size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-lg">Profile Picture</p>
              <p className="text-sm text-[#4c8d9a]">PNG, JPG or GIF. Max 5MB.</p>
              <div className="flex gap-3 mt-2">
                <button className="text-xs font-bold text-primary hover:underline">
                  Upload New
                </button>
                <button className="text-xs font-bold text-red-500 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          </div>

          <hr className="border-[#e7f1f3] dark:border-white/10" />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Display Name"
              {...profileForm.register('displayName')}
              error={profileForm.formState.errors.displayName?.message}
            />
            <Input
              label="Contact Email"
              type="email"
              {...profileForm.register('email')}
              error={profileForm.formState.errors.email?.message}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Short Bio"
                rows={3}
                {...profileForm.register('bio')}
                placeholder="Tell us about yourself and your genealogy interests..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tree Preferences */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <TreePine className="text-primary" size={20} />
          Tree Preferences
        </h2>

        <div className="space-y-6">
          {/* Default Visibility */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold">Default Visibility</p>
              <p className="text-sm text-[#4c8d9a]">
                Control who can see your family trees by default.
              </p>
            </div>
            <div className="flex bg-[#e7f1f3] dark:bg-white/10 p-1 rounded-xl">
              <button
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  preferencesForm.watch('defaultVisibility') === 'private'
                    ? 'bg-white dark:bg-white/20 shadow-sm'
                    : 'text-[#4c8d9a]'
                }`}
                onClick={() => preferencesForm.setValue('defaultVisibility', 'private')}
                type="button"
              >
                Private
              </button>
              <button
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  preferencesForm.watch('defaultVisibility') === 'public'
                    ? 'bg-white dark:bg-white/20 shadow-sm'
                    : 'text-[#4c8d9a]'
                }`}
                onClick={() => preferencesForm.setValue('defaultVisibility', 'public')}
                type="button"
              >
                Public
              </button>
            </div>
          </div>

          <hr className="border-[#e7f1f3] dark:border-white/10" />

          {/* Measurement Units */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold">Measurement Units</p>
              <p className="text-sm text-[#4c8d9a]">
                Used for displaying distances and map data.
              </p>
            </div>
            <Select
              value={preferencesForm.watch('measurementUnit')}
              onChange={(value) =>
                preferencesForm.setValue('measurementUnit', value as 'metric' | 'imperial')
              }
              options={[
                { value: 'metric', label: 'Metric (km, m)' },
                { value: 'imperial', label: 'Imperial (mi, ft)' },
              ]}
            />
          </div>

          <hr className="border-[#e7f1f3] dark:border-white/10" />

          {/* Open Collaboration */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Open Collaboration</p>
              <p className="text-sm text-[#4c8d9a]">
                Allow others to request to join your tree edits.
              </p>
            </div>
            <Toggle
              checked={preferencesForm.watch('openCollaboration')}
              onChange={(checked) => preferencesForm.setValue('openCollaboration', checked)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="ghost">Cancel</Button>
        <Button onClick={handleSave} loading={isSaving}>
          Save Changes
        </Button>
      </div>
    </>
  );
}
