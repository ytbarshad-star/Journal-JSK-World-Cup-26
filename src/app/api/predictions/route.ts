// src/app/api/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        match:matches(*)
      `)
      .eq('user_id', session.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ predictions: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { match_id, predicted_team_a_score, predicted_team_b_score } = await req.json();

    if (match_id === undefined || predicted_team_a_score === undefined || predicted_team_b_score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const scoreA = parseInt(predicted_team_a_score);
    const scoreB = parseInt(predicted_team_b_score);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
      return NextResponse.json({ error: 'Invalid scores' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if match exists and is still open
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if match has started
    if (new Date() >= new Date(match.match_date)) {
      return NextResponse.json({ error: 'Predictions are locked for this match' }, { status: 403 });
    }

    if (!['SCHEDULED', 'TIMED'].includes(match.status)) {
      return NextResponse.json({ error: 'Match is not accepting predictions' }, { status: 403 });
    }

    // Check for existing prediction
    const { data: existing } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', session.id)
      .eq('match_id', match_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You already predicted this match' }, { status: 409 });
    }

    // Insert prediction
    const { data: prediction, error: insertError } = await supabase
      .from('predictions')
      .insert({
        user_id: session.id,
        match_id,
        predicted_team_a_score: scoreA,
        predicted_team_b_score: scoreB,
        points_awarded: 0,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 });
    }

    return NextResponse.json({ success: true, prediction });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
