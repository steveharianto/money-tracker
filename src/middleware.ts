import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is authenticated
  const isAuthenticated = !!session;
  const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/setup';

  // Redirect to login if accessing a protected page without authentication
  if (!isAuthenticated && !isAuthPage) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to home if accessing auth pages while authenticated
  if (isAuthenticated && isAuthPage) {
    const redirectUrl = new URL('/', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Add public routes (login and setup pages) that don't require authentication
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 