// src/app/api/matches/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Trigger Supabase edge function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const response = await fetch(`${supabaseUrl}/functions/v1/sync-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
