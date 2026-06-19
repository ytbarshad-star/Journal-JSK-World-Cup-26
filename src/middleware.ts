// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_USER_ROUTES = ['/dashboard', '/predictions', '/leaderboard', '/profile'];
const PROTECTED_ADMIN_ROUTES = ['/admin/dashboard'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect user routes
  if (PROTECTED_USER_ROUTES.some((route) => pathname.startsWith(route))) {
    const session = req.cookies.get('wc26_session');
    if (!session) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Protect admin routes
  if (PROTECTED_ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    const adminSession = req.cookies.get('wc26_admin');
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/predictions/:path*',
    '/leaderboard/:path*',
    '/profile/:path*',
    '/admin/dashboard/:path*',
  ],
};
