// src/app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const preview = searchParams.get('preview') === 'true';

    const { data, error } = await supabase
      .from('users')
      .select('id, name, place, photo, total_points')
      .eq('is_blocked', false)
      .order('total_points', { ascending: false })
      .limit(preview ? 5 : limit);

    if (error) throw error;

    const leaderboard = (data || []).map((user: any, idx: number) => ({
      rank: idx + 1,
      ...user,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
