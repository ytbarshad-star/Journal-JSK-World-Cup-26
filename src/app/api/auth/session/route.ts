// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Refresh user data from DB
    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.id)
      .single();

    return NextResponse.json({ user: user || null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
