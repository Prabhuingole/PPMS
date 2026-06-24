import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exempt public paths and static assets
  const isExempt = 
    pathname.startsWith('/login') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/setup-account') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/favicon.ico';

  if (isExempt) {
    return NextResponse.next();
  }

  // Retrieve tokens from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const isAuthenticated = request.cookies.get('is_authenticated')?.value === 'true';

  // If no valid authentication exists, redirect to login
  if (!authToken && !isAuthenticated) {
    console.log(`[Middleware] No valid authentication found for path: ${pathname}. Redirecting to /login`);
    const loginUrl = new URL('/login', request.url);
    // Optionally preserve the redirect URL
    // loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists - proceed. 
  // IMPORTANT: We do not validate roles here. 
  // Role-based protection remains enforced by app/[role]/layout.tsx
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
