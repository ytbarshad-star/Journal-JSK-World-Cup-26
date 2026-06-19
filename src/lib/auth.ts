// src/lib/auth.ts
import { cookies } from 'next/headers';
import { User } from '@/types';

const SESSION_COOKIE = 'wc26_session';
const ADMIN_COOKIE = 'wc26_admin';

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    return session as User;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE);
  return adminCookie?.value === process.env.ADMIN_SECRET_KEY;
}

export function createSessionCookie(user: User): { name: string; value: string; options: object } {
  return {
    name: SESSION_COOKIE,
    value: JSON.stringify(user),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    },
  };
}

export function createAdminCookie(): { name: string; value: string; options: object } {
  return {
    name: ADMIN_COOKIE,
    value: process.env.ADMIN_SECRET_KEY || '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    },
  };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;
