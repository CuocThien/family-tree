/**
 * NextAuth API Route Handler
 *
 * Handles all NextAuth authentication requests.
 * This file is required by NextAuth.js for App Router.
 */

import { handlers } from '@/lib/auth';

export const { GET, POST} = handlers;
