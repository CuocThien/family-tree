'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = result.error;
        // Map error messages to user-friendly messages
        if (errorMessage.includes('verify')) {
          setError('Please verify your email address');
        } else if (errorMessage.includes('social')) {
          setError('Please sign in with your social account');
        } else {
          setError('Invalid email or password');
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setError(`Could not sign in with ${provider}. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Hero Section - Hidden on mobile */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-[#13c8ec] to-[#0d8fa8] overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-center items-center w-full h-full px-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="white" strokeWidth="4" />
              <path d="M32 16V32L44 44" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <circle cx="32" cy="32" r="6" fill="white" />
            </svg>
          </div>

          {/* Tagline */}
          <h1 className="text-4xl xl:text-5xl font-bold mb-4 text-center">
            Connect Your Family Story
          </h1>
          <p className="text-xl text-white/90 text-center max-w-md">
            Preserve memories, celebrate heritage, and build your family tree together.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-24 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="#13c8ec" strokeWidth="4" />
              <path d="M32 16V32L44 44" stroke="#13c8ec" strokeWidth="4" strokeLinecap="round" />
              <circle cx="32" cy="32" r="6" fill="#13c8ec" />
            </svg>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0d191b] dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-[#4c8d9a] dark:text-gray-400">
              Sign in to continue to your family tree
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              role="alert"
            >
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={20} />}
              error={errors.email?.message}
              disabled={isLoading}
              autoComplete="email"
              aria-required="true"
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                leftIcon={<Lock size={20} />}
                error={errors.password?.message}
                disabled={isLoading}
                autoComplete="current-password"
                aria-required="true"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[2.3rem] text-[#4c8d9a] hover:text-[#13c8ec] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-gray-300 text-[#13c8ec] focus:ring-[#13c8ec] focus:ring-offset-0"
                />
                <span className="text-sm text-[#4c8d9a] dark:text-gray-400">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-[#13c8ec] hover:text-[#0d8fa8] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-[#4c8d9a] dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="w-full"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleOAuthSignIn('facebook')}
              disabled={isLoading}
              className="w-full"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Sign in with Facebook
            </Button>
          </div>

          {/* Register Link */}
          <p className="mt-8 text-center text-sm text-[#4c8d9a] dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#13c8ec] hover:text-[#0d8fa8] transition-colors"
            >
              Sign up
            </Link>
          </p>

          {/* SSL Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#4c8d9a] dark:text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secured with SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
