'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long')
      .trim(),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  // Auto-sign in after successful registration
  useEffect(() => {
    if (success && credentials) {
      const timer = setTimeout(async () => {
        try {
          const signInResult = await signIn('credentials', {
            email: credentials.email,
            password: credentials.password,
            redirect: false,
          });

          if (signInResult?.ok) {
            // Sign-in successful, redirect to dashboard
            router.push('/dashboard');
            router.refresh();
          } else {
            router.push('/login?registered=true');
          }
        } catch {
          window.location.href = '/login?registered=true';
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [success, credentials]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.fullName.trim(),
          email: data.email.toLowerCase().trim(),
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'Email already exists') {
          setError('An account with this email already exists');
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Store credentials for auto sign-in
      setCredentials({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });
      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-[#f6f8f8] dark:bg-[#101f22]">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="size-20 rounded-full bg-[#13c8ec]/10 flex items-center justify-center">
              <svg
                className="h-10 w-10 text-[#13c8ec]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#0d191b] dark:text-white mb-2">
            Account created successfully!
          </h2>
          <p className="text-[#4c8d9a]">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#f6f8f8] dark:bg-[#101f22]">
      {/* Form Section */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-4 text-[#13c8ec]">
            <div className="size-10">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h1 className="text-[#0d191b] dark:text-white text-2xl font-black leading-tight tracking-tight">
              AncestryHub
            </h1>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-3xl font-black tracking-tight text-[#0d191b] dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-base text-[#4c8d9a]">
              Join thousands of genealogists discovering their family history.
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

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Full Name */}
            <div>
              <label
                className="block text-sm font-bold text-[#0d191b] dark:text-white"
                htmlFor="full-name"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="full-name"
                  type="text"
                  placeholder="John Doe"
                  disabled={isLoading}
                  className="block w-full rounded-xl border-none bg-[#e7f1f3] dark:bg-white/10 px-4 py-3 text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a] focus:ring-2 focus:ring-[#13c8ec] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={errors.fullName ? 'true' : undefined}
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500" role="alert">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-sm font-bold text-[#0d191b] dark:text-white"
                htmlFor="email"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  className="block w-full rounded-xl border-none bg-[#e7f1f3] dark:bg-white/10 px-4 py-3 text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a] focus:ring-2 focus:ring-[#13c8ec] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-bold text-[#0d191b] dark:text-white"
                htmlFor="password"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="block w-full rounded-xl border-none bg-[#e7f1f3] dark:bg-white/10 px-4 py-3 text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a] focus:ring-2 focus:ring-[#13c8ec] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : undefined}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="block text-sm font-bold text-[#0d191b] dark:text-white"
                htmlFor="confirm-password"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="block w-full rounded-xl border-none bg-[#e7f1f3] dark:bg-white/10 px-4 py-3 text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a] focus:ring-2 focus:ring-[#13c8ec] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={errors.confirmPassword ? 'true' : undefined}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300 text-[#13c8ec] focus:ring-[#13c8ec]"
                  aria-invalid={errors.acceptTerms ? 'true' : undefined}
                  {...register('acceptTerms')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="text-[#4c8d9a]">
                  I agree to the{' '}
                  <Link href="/terms" className="font-semibold text-[#13c8ec] hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-semibold text-[#13c8ec] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-red-500" role="alert">
                {errors.acceptTerms.message}
              </p>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-[#13c8ec] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#13c8ec]/25 hover:bg-[#13c8ec]/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Start My Journey'}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p className="mt-10 text-center text-sm text-[#4c8d9a]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#13c8ec] hover:underline">
              Log in instead
            </Link>
          </p>
        </div>
      </div>

      {/* Hero Section - Visible on desktop */}
      <div className="hidden lg:relative lg:block lg:w-1/2">
        <div className="absolute inset-0 h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-[#13c8ec]/80 to-[#101f22]/90 z-10"></div>
          <div
            className="h-full w-full bg-center bg-no-repeat bg-cover"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBgp1sAjHdn6Of5xdrLidr8B5jdS2UshwUq2iuwN0xOaFedYnT7Lb9TDToZc6crAIYohSqQbtZ_3Ut9qqjEnWSmg4ijmQaHQcczxnCZ65D2OWcSf4kvsAZNq-BGGDOkPjbi3-gYNFyNRwRRC65mdQgBk4vCgRC-bj6-766SbRMcNmkNhHCgEmhuNsUBkYSHYHxElc5PlWLNMKn0huxriGOsSzbclY7E4WjNfS7WN8kFEm4XMfLqvm54GPQsfKjnM3X_UXDb_Nt94yY')",
            }}
          ></div>
        </div>
        <div className="relative z-20 flex h-full flex-col items-center justify-center px-12 text-center text-white">
          <div className="max-w-md">
            <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              Your History Awaits
            </span>
            <h2 className="text-4xl font-black leading-tight tracking-tight mb-6">
              Discover the stories that made you who you are.
            </h2>
            <p className="text-lg text-white/80 font-medium">
              Build your family tree, search billions of historical records, and connect with
              distant relatives through DNA matching.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-4 text-left">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
                <span className="material-symbols-outlined text-[#13c8ec] mb-2">
                  account_tree
                </span>
                <p className="text-sm font-bold">Smart Trees</p>
                <p className="text-xs text-white/60">Dynamic visualization of lineages</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
                <span className="material-symbols-outlined text-[#13c8ec] mb-2">
                  genetics
                </span>
                <p className="text-sm font-bold">DNA Analysis</p>
                <p className="text-xs text-white/60">Find biological connections</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
