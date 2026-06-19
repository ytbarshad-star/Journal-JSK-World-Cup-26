// src/app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession, createSessionCookie } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await req.formData();
    const place = formData.get('place') as string;
    const photoFile = formData.get('photo') as File | null;

    const supabase = createAdminClient();
    const updates: any = {};

    if (place?.trim()) updates.place = place.trim();

    if (photoFile && photoFile.size > 0) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${session.id}_${Date.now()}.${fileExt}`;
      const arrayBuffer = await photoFile.arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, new Uint8Array(arrayBuffer), {
          contentType: photoFile.type,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(uploadData.path);
        updates.photo = urlData.publicUrl;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    const cookie = createSessionCookie(user);
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(cookie.name, cookie.value, cookie.options as any);

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
