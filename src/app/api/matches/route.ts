// src/app/api/matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'upcoming24h';

    let query = supabase.from('matches').select('*').order('match_date', { ascending: true });

    if (filter === 'upcoming24h') {
      const now = new Date().toISOString();
      const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      query = query
        .gte('match_date', now)
        .lte('match_date', in24h)
        .in('status', ['SCHEDULED', 'TIMED']);
    } else if (filter === 'live') {
      query = query.in('status', ['IN_PLAY', 'LIVE', 'PAUSED']);
    } else if (filter === 'recent') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.eq('status', 'FINISHED').gte('match_date', oneDayAgo);
    } else if (filter === 'all') {
      // All matches
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ matches: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
