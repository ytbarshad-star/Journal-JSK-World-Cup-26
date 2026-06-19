// supabase/functions/sync-matches/index.ts
// Sync World Cup 2026 matches from football-data.org
// Runs every 6 hours via Supabase cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const COMPETITION_ID = 2000; // FIFA World Cup
const API_BASE = 'https://api.football-data.org/v4';

const FLAG_MAP: Record<string, string> = {
  'Brazil': '🇧🇷', 'Germany': '🇩🇪', 'Argentina': '🇦🇷', 'France': '🇫🇷',
  'Spain': '🇪🇸', 'Portugal': '🇵🇹', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Uruguay': '🇺🇾', 'Mexico': '🇲🇽',
  'USA': '🇺🇸', 'Canada': '🇨🇦', 'Japan': '🇯🇵', 'South Korea': '🇰🇷',
  'Australia': '🇦🇺', 'Morocco': '🇲🇦', 'Senegal': '🇸🇳', 'Ghana': '🇬🇭',
  'Cameroon': '🇨🇲', 'Saudi Arabia': '🇸🇦', 'Iran': '🇮🇷', 'Australia': '🇦🇺',
  'Switzerland': '🇨🇭', 'Denmark': '🇩🇰', 'Poland': '🇵🇱', 'Serbia': '🇷🇸',
  'Ecuador': '🇪🇨', 'Qatar': '🇶🇦', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Tunisia': '🇹🇳',
  'Colombia': '🇨🇴', 'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Venezuela': '🇻🇪',
  'Costa Rica': '🇨🇷', 'Panama': '🇵🇦', 'Honduras': '🇭🇳', 'Guatemala': '🇬🇹',
  'Nigeria': '🇳🇬', 'Egypt': '🇪🇬', 'Algeria': '🇩🇿', 'Ivory Coast': '🇨🇮',
  'Czechia': '🇨🇿', 'Hungary': '🇭🇺', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮',
  'Turkey': '🇹🇷', 'Ukraine': '🇺🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Austria': '🇦🇹',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Finland': '🇫🇮', 'Greece': '🇬🇷',
  'Romania': '🇷🇴', 'Bulgaria': '🇧🇬', 'Ireland': '🇮🇪', 'Albania': '🇦🇱',
  'Bolivia': '🇧🇴', 'Paraguay': '🇵🇾', 'Jamaica': '🇯🇲', 'Trinidad and Tobago': '🇹🇹',
  'Indonesia': '🇮🇩', 'Vietnam': '🇻🇳', 'Thailand': '🇹🇭', 'Malaysia': '🇲🇾',
  'China PR': '🇨🇳', 'India': '🇮🇳', 'New Zealand': '🇳🇿',
};

function getFlag(teamName: string): string {
  return FLAG_MAP[teamName] || '🏳️';
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY')!;

    // Fetch upcoming World Cup 2026 matches (next 30 days)
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await fetch(
      `${API_BASE}/competitions/${COMPETITION_ID}/matches?dateFrom=${today}&dateTo=${future}&status=SCHEDULED`,
      {
        headers: {
          'X-Auth-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      // Fallback: try without status filter
      const fallbackResponse = await fetch(
        `${API_BASE}/competitions/${COMPETITION_ID}/matches?dateFrom=${today}&dateTo=${future}`,
        { headers: { 'X-Auth-Token': apiKey } }
      );
      
      if (!fallbackResponse.ok) {
        throw new Error(`Football API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await fallbackResponse.json();
      await processMatches(supabase, data.matches || []);
    } else {
      const data = await response.json();
      await processMatches(supabase, data.matches || []);
    }

    return new Response(JSON.stringify({ success: true, message: 'Matches synced' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function processMatches(supabase: any, matches: any[]) {
  for (const match of matches) {
    const teamA = match.homeTeam?.name || 'TBD';
    const teamB = match.awayTeam?.name || 'TBD';

    await supabase.from('matches').upsert(
      {
        api_match_id: String(match.id),
        team_a: teamA,
        team_b: teamB,
        team_a_flag: getFlag(teamA),
        team_b_flag: getFlag(teamB),
        match_date: match.utcDate,
        status: match.status,
        team_a_score: match.score?.fullTime?.home ?? null,
        team_b_score: match.score?.fullTime?.away ?? null,
        competition: match.competition?.name || 'FIFA World Cup 2026',
      },
      { onConflict: 'api_match_id' }
    );
  }
}
