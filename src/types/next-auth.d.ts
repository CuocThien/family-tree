/**
 * NextAuth Type Extensions
 *
 * Extends NextAuth types to include custom properties for our application.
 * These declarations augment the NextAuth module types.
 */

import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extended Session interface with custom user properties.
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    };
  }

  /**
   * Extended User interface returned from providers.
   */
  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    isVerified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface with custom token properties.
   */
  interface JWT {
    id: string;
    email: string;
    name: string;
    picture?: string;
    provider?: string;
  }
}
