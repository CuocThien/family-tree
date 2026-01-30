/**
 * NextAuth Configuration
 *
 * Main authentication configuration for the Family Tree application.
 * Supports credentials (email/password), Google OAuth, and Facebook OAuth.
 *
 * This is for NextAuth v5 (auth.ts).
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import bcrypt from 'bcryptjs';
import { rateLimits } from './rateLimit';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Credentials Provider (Email/Password)
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const email = (credentials.email as string).toLowerCase();

        // Check rate limit based on email
        const rateLimitResult = rateLimits.login.check(email);
        if (!rateLimitResult.success) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        // Lazy import to avoid Edge Runtime issues
        const { container } = await import('@/lib/di');
        const user = await container.userRepository.findByEmailWithPassword(email);

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if user has password (OAuth users may not)
        if (!user.password) {
          throw new Error('Please sign in with your social account');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Reset rate limit on successful login
        rateLimits.login.reset(email);

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.profile.name,
          image: user.profile.avatar,
          isVerified: user.isVerified,
        };
      },
    }),

    // Google OAuth Provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified,
        };
      },
    }),

    // Facebook OAuth Provider
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
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
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
    newUser: '/onboarding',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.isVerified = (user as any).isVerified;
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

    async signIn({ user, account }) {
      // Handle OAuth account linking could be done here
      // For now, we'll allow all sign ins
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Handle callbackUrl from signIn()
      // If url is empty or equals baseUrl, redirect to dashboard
      if (!url || url === baseUrl) {
        return `${baseUrl}/dashboard`;
      }
      // If url is a relative path (from callbackUrl), use it
      if (url.startsWith('/')) {
        return url;
      }
      // If url is from the same origin, use it
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch {
        // If URL parsing fails, treat as relative path
      }
      // Default to dashboard after successful sign-in
      return `${baseUrl}/dashboard`;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign in event
      console.log(`User ${user.email} signed in via ${account?.provider}`);

      if (isNewUser) {
        // Send welcome email - lazy import to avoid Edge Runtime issues
        try {
          const { container } = await import('@/lib/di');
          if (user.email) {
            await container.emailService.sendWelcomeEmail(user.email, user.name || 'User');
          }
        } catch (error) {
          console.error('Failed to send welcome email:', error);
          // Don't block sign-in if email fails
        }
      }
    },

    async signOut(params) {
      // Log sign out
      const token = params as any;
      if (token && token.email) {
        console.log(`User ${token.email} signed out`);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
});
