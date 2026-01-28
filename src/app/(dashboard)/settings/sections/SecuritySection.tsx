'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/store/uiStore';
import { Shield, Lock, Mail } from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const emailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type PasswordData = z.infer<typeof passwordSchema>;
type EmailData = z.infer<typeof emailSchema>;

export function SecuritySection() {
  const toast = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const emailForm = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    },
  });

  const handlePasswordChange = async (data: PasswordData) => {
    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailChange = async (data: EmailData) => {
    setIsChangingEmail(true);

    try {
      const response = await fetch('/api/user/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail: data.newEmail,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change email');
      }

      toast.success('Verification email sent. Please check your inbox.');
      emailForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Lock className="text-primary" size={20} />
          Change Password
        </h2>

        <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
          <Input
            label="Current Password"
            type="password"
            {...passwordForm.register('currentPassword')}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            label="New Password"
            type="password"
            {...passwordForm.register('newPassword')}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            label="Confirm New Password"
            type="password"
            {...passwordForm.register('confirmPassword')}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={isChangingPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* Change Email */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Mail className="text-primary" size={20} />
          Change Email
        </h2>

        <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="space-y-6">
          <Input
            label="New Email Address"
            type="email"
            {...emailForm.register('newEmail')}
            error={emailForm.formState.errors.newEmail?.message}
          />
          <Input
            label="Confirm Password"
            type="password"
            {...emailForm.register('password')}
            error={emailForm.formState.errors.password?.message}
            hint="Enter your current password to confirm the email change"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={isChangingEmail}>
              Change Email
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
