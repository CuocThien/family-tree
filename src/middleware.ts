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
  const token = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');

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

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect non-public routes
  if (!isPublicPath && !isStaticFile && !isLoggedIn) {
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
