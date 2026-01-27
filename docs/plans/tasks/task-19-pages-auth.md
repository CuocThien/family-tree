# Task 19: Create Authentication Pages

**Phase:** 12 - Pages
**Priority:** High
**Dependencies:** Task 14 (NextAuth), Task 16 (UI Components)
**Estimated Complexity:** Medium

---

## Objective

Implement Login and Register pages based on the design prototypes, with proper form validation, error handling, and OAuth integration.

---

## Design Analysis

### Login Page (`design/login-page.html`)

**Layout:**
- Split-screen on desktop (hero left, form right)
- Single column on mobile (form only)
- Brand logo and tagline on hero side
- "Welcome back" heading
- Email/password form with icons
- Remember me checkbox
- Forgot password link
- OAuth buttons (Google, Facebook)
- "Don't have an account?" link

**UX Observations:**
- Input fields have left icons (mail, lock)
- Password field needs visibility toggle
- Primary CTA has shadow and hover animation
- OAuth buttons are secondary style
- SSL badge at bottom for trust

### Register Page (`design/register-page.html`)

**Layout:**
- Split-screen (form left, hero right)
- Full name, email, password, confirm password
- Terms agreement checkbox
- Feature highlights on hero side
- "Already have an account?" link

**UX Observations:**
- Password strength indicator missing (should add)
- Confirm password validation
- Terms/Privacy links functional
- Hero has feature cards

---

## Implementation Specifications

### Login Page

**File:** `src/app/(auth)/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Hero Section - Hidden on mobile */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-3/5 bg-primary overflow-hidden">
        {/* Background image with gradient overlay */}
        {/* Brand logo and tagline */}
      </div>

      {/* Form Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-24 bg-white dark:bg-background-dark">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          {/* Heading */}
          {/* Error alert */}
          {/* Form */}
          {/* OAuth buttons */}
          {/* Register link */}
        </div>
      </div>
    </div>
  );
}
```

### Register Page

**File:** `src/app/(auth)/register/page.tsx`

```typescript
const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

---

## UX Improvements Over Design

### Login Page Improvements

| Original | Improvement | Reason |
|----------|-------------|--------|
| No password visibility | Add eye icon toggle | Better usability |
| No loading state | Add spinner to button | Feedback |
| No error display | Toast or inline error | User awareness |
| No input validation | Real-time validation | Prevent errors |
| Static OAuth buttons | Loading state on click | Feedback |

### Register Page Improvements

| Original | Improvement | Reason |
|----------|-------------|--------|
| No password strength | Add strength indicator | Security guidance |
| No real-time match | Show match status | Immediate feedback |
| No email check | Check email availability | Prevent duplicate |
| Terms as text | Make links clickable | Accessibility |
| No success state | Show success before redirect | Confirmation |

---

## Edge Cases

### Login Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Invalid credentials | "Invalid email or password" (no specifics) |
| Account locked | "Account locked. Contact support." |
| Unverified email | "Please verify your email first" |
| OAuth failure | "Could not sign in with {provider}" |
| Network error | "Connection error. Please try again." |
| Rate limited | "Too many attempts. Try again in X minutes." |
| Session exists | Redirect to dashboard |
| Callback URL injection | Validate callback is same origin |

### Register Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Email exists | "Email already registered" |
| Weak password | Show specific requirements unmet |
| Password mismatch | Inline error under confirm field |
| Terms not accepted | Cannot submit, highlight checkbox |
| Name too short | "Name must be at least 2 characters" |
| Unicode in name | Allow, trim whitespace |
| Slow network | Show loading, disable form |
| Registration disabled | "Registration currently unavailable" |

---

## Form Validation

### Email Validation

```typescript
const emailValidation = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email too long')
  .transform((email) => email.toLowerCase().trim());
```

### Password Validation

```typescript
const passwordValidation = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128, 'Maximum 128 characters')
  .regex(/[A-Z]/, 'One uppercase letter required')
  .regex(/[a-z]/, 'One lowercase letter required')
  .regex(/[0-9]/, 'One number required')
  .regex(/[^A-Za-z0-9]/, 'One special character required'); // Optional
```

### Password Strength Indicator

```typescript
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-lime-500' },
    { label: 'Strong', color: 'bg-green-500' },
    { label: 'Very Strong', color: 'bg-emerald-500' },
  ];

  return { score, ...levels[Math.min(score, 5)] };
}
```

---

## Accessibility Requirements

| Element | Requirement |
|---------|-------------|
| Form | `aria-labelledby` to heading |
| Inputs | `aria-invalid`, `aria-describedby` to errors |
| Password toggle | `aria-label="Toggle password visibility"` |
| Error messages | `role="alert"` |
| OAuth buttons | Clear accessible names |
| Loading states | `aria-busy="true"` |
| Focus management | Autofocus email, trap in modal |

---

## Security Considerations

| Concern | Implementation |
|---------|----------------|
| Credential enumeration | Generic error messages |
| Brute force | Rate limiting (handled by API) |
| XSS | Sanitize all inputs |
| CSRF | NextAuth handles via tokens |
| Session fixation | NextAuth handles |
| Password exposure | No logging, HTTPS only |
| OAuth state | Verify state parameter |

---

## Testing Strategy

```typescript
describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByLabelText(/toggle password/i));
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('submits form with valid data', async () => {
    const mockSignIn = jest.mocked(signIn);
    mockSignIn.mockResolvedValue({ ok: true, error: null });

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.any(Object));
  });

  it('shows error on invalid credentials', async () => {
    const mockSignIn = jest.mocked(signIn);
    mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' });

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/invalid/i);
  });
});
```

---

## Acceptance Criteria

- [ ] Login page matches design
- [ ] Register page matches design
- [ ] Form validation working
- [ ] Error states displayed
- [ ] Loading states working
- [ ] OAuth buttons functional
- [ ] Password strength indicator (register)
- [ ] Dark mode support
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] All edge cases handled
- [ ] Tests passing
