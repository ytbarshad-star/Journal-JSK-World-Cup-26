// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('users')
      .select('*, predictions:predictions(count)')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,place.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ users: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, action, points } = await req.json();
    const supabase = createAdminClient();

    if (action === 'block') {
      await supabase.from('users').update({ is_blocked: true }).eq('id', id);
    } else if (action === 'unblock') {
      await supabase.from('users').update({ is_blocked: false }).eq('id', id);
    } else if (action === 'edit_points') {
      await supabase.from('users').update({ total_points: parseInt(points) }).eq('id', id);
    } else if (action === 'reset_points') {
      await supabase.from('users').update({ total_points: 0 }).eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await req.json();
    const supabase = createAdminClient();
    await supabase.from('users').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
