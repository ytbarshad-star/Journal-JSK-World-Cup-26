// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.trim().length < 7) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Phone number not registered' }, { status: 404 });
    }

    if (user.is_blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Contact admin.' }, { status: 403 });
    }

    const cookie = createSessionCookie(user);
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(cookie.name, cookie.value, cookie.options as any);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
