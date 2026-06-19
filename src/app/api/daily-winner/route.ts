// src/app/api/daily-winner/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get yesterday's winner
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_winners')
      .select(`
        *,
        user:users(id, name, place, photo, total_points)
      `)
      .eq('date', targetDate)
      .single();

    if (error || !data) {
      return NextResponse.json({ winner: null });
    }

    return NextResponse.json({ winner: data });
  } catch (err) {
    return NextResponse.json({ winner: null });
  }
}
