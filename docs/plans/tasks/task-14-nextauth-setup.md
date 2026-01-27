# Task 14: Set Up NextAuth.js

**Phase:** 7 - Authentication
**Priority:** Critical
**Dependencies:** Task 05 (Database Connection), Task 08 (Service Interfaces)
**Estimated Complexity:** High

---

## Objective

Configure NextAuth.js for authentication with credentials (email/password), OAuth providers (Google, Facebook), and session management with MongoDB adapter.

---

## Requirements

### Functional Requirements

1. Email/password authentication (credentials provider)
2. Google OAuth provider
3. Facebook OAuth provider
4. MongoDB session storage
5. JWT tokens for API authentication
6. Password reset flow
7. Email verification flow
8. Remember me functionality

### Non-Functional Requirements

1. Secure session handling
2. CSRF protection
3. Rate limiting on login attempts
4. Secure password hashing (bcrypt)
5. Token expiration handling
6. OAuth state verification

---

## Implementation Specifications

### NextAuth Configuration

**File:** `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import bcrypt from 'bcryptjs';
import { getMongoClient } from '@/lib/db/connection';
import { container } from '@/lib/di/container';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(getMongoClient()),

  providers: [
    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const userRepository = container.userRepository;
        const user = await userRepository.findByEmail(credentials.email.toLowerCase());

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.password) {
          throw new Error('Please sign in with your social account');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        if (!user.isVerified) {
          throw new Error('Please verify your email address');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          isVerified: profile.email_verified,
        };
      },
    }),

    // Facebook OAuth Provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
    newUser: '/onboarding',
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.picture = session.image;
      }

      // Add OAuth provider info
      if (account) {
        token.provider = account.provider;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // Handle OAuth account linking
      if (account?.provider !== 'credentials') {
        const userRepository = container.userRepository;
        const existingUser = await userRepository.findByEmail(user.email!);

        if (existingUser && !existingUser.oauthProviders?.includes(account!.provider)) {
          // Link OAuth account to existing user
          await userRepository.update(existingUser._id, {
            $addToSet: { oauthProviders: account!.provider },
          });
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // Ensure redirects stay on same origin
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign in event
      console.log(`User ${user.email} signed in via ${account?.provider}`);

      if (isNewUser) {
        // Send welcome email
        const emailService = container.emailService;
        await emailService.sendWelcomeEmail(user.email!);
      }
    },

    async signOut({ token }) {
      // Log sign out
      console.log(`User ${token.email} signed out`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
```

### API Route Handler

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Type Extensions

**File:** `src/types/next-auth.d.ts`

```typescript
import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    isVerified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    picture?: string;
    provider?: string;
  }
}
```

### Password Reset API

**File:** `src/app/api/auth/reset-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { container } from '@/lib/di/container';

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const userRepository = container.userRepository;
    const user = await userRepository.findByEmail(email.toLowerCase());

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset email will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await userRepository.update(user._id, {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpiry: resetTokenExpiry,
    });

    // Send reset email
    const emailService = container.emailService;
    await emailService.sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({ message: 'If an account exists, a reset email will be sent' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Email Verification API

**File:** `src/app/api/auth/verify-email/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { container } from '@/lib/di/container';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const userRepository = container.userRepository;
  const user = await userRepository.findByVerificationToken(tokenHash);

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
  }

  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    return NextResponse.redirect(new URL('/login?error=token-expired', request.url));
  }

  await userRepository.update(user._id, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  });

  return NextResponse.redirect(new URL('/login?verified=true', request.url));
}
```

---

## Auth Middleware

**File:** `src/middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;

    // Redirect authenticated users away from auth pages
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public paths
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true;
        }

        // API routes that don't need auth
        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        // All other paths require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

---

## Security Considerations

### Password Requirements

```typescript
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // Optional but recommended
};

function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be at most ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return errors;
}
```

### Rate Limiting

```typescript
// src/lib/rateLimit.ts
import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number; // milliseconds
  maxRequests: number;
}

const rateLimiters = new Map<string, LRUCache<string, number>>();

export function rateLimit(key: string, options: RateLimitOptions) {
  let cache = rateLimiters.get(key);
  if (!cache) {
    cache = new LRUCache<string, number>({
      max: 10000,
      ttl: options.interval,
    });
    rateLimiters.set(key, cache);
  }

  return {
    check: (identifier: string): { success: boolean; remaining: number } => {
      const current = cache!.get(identifier) || 0;
      if (current >= options.maxRequests) {
        return { success: false, remaining: 0 };
      }
      cache!.set(identifier, current + 1);
      return { success: true, remaining: options.maxRequests - current - 1 };
    },
  };
}

// Usage in auth API
const loginRateLimit = rateLimit('login', {
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
});
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Invalid credentials | Generic "Invalid email or password" message |
| Account locked | "Account locked. Contact support." |
| Unverified email | "Please verify your email first" |
| OAuth account exists | Offer to link accounts |
| Expired reset token | "Reset link has expired. Request a new one." |
| Concurrent sessions | Allow, track in database |
| Token refresh failure | Redirect to login |
| OAuth provider down | Show error, offer credentials login |
| Missing OAuth profile data | Use defaults, prompt to complete |
| CSRF token mismatch | Reject request, log attempt |

---

## Environment Variables

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Email (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
EMAIL_FROM=noreply@familytree.app
```

---

## Testing Strategy

```typescript
describe('Authentication', () => {
  describe('Credentials Login', () => {
    it('should login with valid credentials', async () => {
      const result = await signIn('credentials', {
        email: 'test@example.com',
        password: 'Password123',
        redirect: false,
      });
      expect(result?.ok).toBe(true);
    });

    it('should reject invalid password', async () => {
      const result = await signIn('credentials', {
        email: 'test@example.com',
        password: 'wrongpassword',
        redirect: false,
      });
      expect(result?.error).toBe('Invalid email or password');
    });

    it('should reject unverified email', async () => {
      const result = await signIn('credentials', {
        email: 'unverified@example.com',
        password: 'Password123',
        redirect: false,
      });
      expect(result?.error).toContain('verify your email');
    });
  });

  describe('Password Reset', () => {
    it('should send reset email for valid user', async () => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(response.ok).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should not reveal if email exists', async () => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      });
      expect(response.ok).toBe(true);
      // Same response for non-existent emails
    });
  });
});
```

---

## Acceptance Criteria

- [ ] NextAuth.js configured
- [ ] Credentials provider working
- [ ] Google OAuth working
- [ ] Facebook OAuth working
- [ ] MongoDB adapter configured
- [ ] JWT session strategy working
- [ ] Password reset flow complete
- [ ] Email verification flow complete
- [ ] Rate limiting implemented
- [ ] Middleware protecting routes
- [ ] Type extensions defined
- [ ] Tests passing
- [ ] Security best practices followed
