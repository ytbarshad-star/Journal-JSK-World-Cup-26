// src/app/api/users/stats/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get rank
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, total_points')
      .eq('is_blocked', false)
      .order('total_points', { ascending: false });

    const rank = (allUsers || []).findIndex((u: any) => u.id === session.id) + 1;

    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.id)
      .single();

    // Get prediction stats
    const { data: predictions } = await supabase
      .from('predictions')
      .select('id, points_awarded, match:matches(status)')
      .eq('user_id', session.id);

    const total_predictions = predictions?.length || 0;
    const correct_predictions = predictions?.filter((p: any) => (p.points_awarded || 0) > 0).length || 0;

    return NextResponse.json({
      user,
      stats: {
        rank: rank || total_predictions + 1,
        total_points: user?.total_points || 0,
        total_predictions,
        correct_predictions,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
