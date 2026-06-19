// supabase/functions/check-results/index.ts
// Check match results and calculate points
// Runs every 15 minutes via Supabase cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const API_BASE = 'https://api.football-data.org/v4';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY')!;

    // Get all active/recent matches that haven't been processed
    const { data: activeMatches } = await supabase
      .from('matches')
      .select('*')
      .in('status', ['SCHEDULED', 'IN_PLAY', 'LIVE', 'PAUSED', 'FINISHED'])
      .eq('results_processed', false)
      .gte('match_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!activeMatches || activeMatches.length === 0) {
      return new Response(JSON.stringify({ message: 'No active matches' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let updated = 0;
    let pointsCalculated = 0;

    for (const match of activeMatches) {
      try {
        const response = await fetch(
          `${API_BASE}/matches/${match.api_match_id}`,
          { headers: { 'X-Auth-Token': apiKey } }
        );

        if (!response.ok) continue;

        const data = await response.json();
        const apiMatch = data;

        const homeScore = apiMatch.score?.fullTime?.home ?? null;
        const awayScore = apiMatch.score?.fullTime?.away ?? null;
        const status = apiMatch.status;

        // Determine winner
        let winnerTeam = null;
        if (status === 'FINISHED' && homeScore !== null && awayScore !== null) {
          if (homeScore > awayScore) winnerTeam = match.team_a;
          else if (awayScore > homeScore) winnerTeam = match.team_b;
          else winnerTeam = 'Draw';
        }

        // Update match
        await supabase
          .from('matches')
          .update({
            status,
            team_a_score: homeScore,
            team_b_score: awayScore,
            winner_team: winnerTeam,
          })
          .eq('id', match.id);

        updated++;

        // If finished, calculate points
        if (status === 'FINISHED' && homeScore !== null && awayScore !== null) {
          await supabase.rpc('update_prediction_points', { p_match_id: match.id });
          pointsCalculated++;
        }
      } catch (matchError) {
        console.error(`Error processing match ${match.id}:`, matchError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated, 
        pointsCalculated,
        message: `Updated ${updated} matches, calculated points for ${pointsCalculated}` 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Check results error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
