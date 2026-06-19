// supabase/functions/daily-winner/index.ts
// Calculate daily winner - runs every night at 23:59 UAE time

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Calculate for yesterday in UAE timezone (UTC+4)
    const now = new Date();
    const uaeOffset = 4 * 60; // UAE is UTC+4
    const uaeNow = new Date(now.getTime() + uaeOffset * 60000);
    const yesterday = new Date(uaeNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toISOString().split('T')[0];

    await supabase.rpc('calculate_daily_winner', { target_date: targetDate });

    return new Response(
      JSON.stringify({ success: true, message: `Daily winner calculated for ${targetDate}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
