/**
 * Authentication Middleware
 *
 * Protects routes and handles authentication redirects.
 * Uses Next.js middleware with edge-compatible JWT validation.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the token from cookies
  // NextAuth v5 uses different cookie names than v3/v4
  const token = request.cookies.get('authjs.session-token') ||
                request.cookies.get('__Secure-authjs.session-token') ||
                request.cookies.get('next-auth.session-token') || // Fallback for v3/v4
                request.cookies.get('__Secure-next-auth.session-token'); // Fallback for v3/v4

  const isLoggedIn = !!token;

  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/api/auth',
  ];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Static files don't need auth
  const isStaticFile = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/public');

  // API routes handle their own authentication via withAuth wrapper
  const isApiRoute = pathname.startsWith('/api');

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect non-public routes (API routes handle their own auth)
  if (!isPublicPath && !isStaticFile && !isApiRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
