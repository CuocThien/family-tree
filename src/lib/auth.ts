/**
 * NextAuth Configuration
 *
 * Main authentication configuration for the Family Tree application.
 * Supports credentials (email/password), Google OAuth, and Facebook OAuth.
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import bcrypt from 'bcryptjs';
import { container } from '@/lib/di';
import { getContainer } from '@/lib/di/instance';

export const authOptions: NextAuthOptions = {
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

        const di = getContainer();
        const userRepository = di.userRepository;

        if (!userRepository) {
          throw new Error('User repository not available');
        }

        const user = await userRepository.findByEmailWithPassword(credentials.email.toLowerCase());

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if user has password (OAuth users may not)
        if (!(user as any).password) {
          throw new Error('Please sign in with your social account');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          (user as any).password
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        if (!user.isVerified) {
          throw new Error('Please verify your email address');
        }

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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
        token.isVerified = (user as any).isVerified;
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
      // Handle OAuth account linking could be done here
      // For now, we'll allow all sign ins
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
        if (emailService && user.email) {
          await emailService.sendWelcomeEmail(user.email, user.name || 'User');
        }
      }
    },

    async signOut({ token }) {
      // Log sign out
      console.log(`User ${token.email} signed out`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
