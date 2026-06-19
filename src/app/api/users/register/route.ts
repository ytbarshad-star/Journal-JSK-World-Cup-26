// src/app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const age = parseInt(formData.get('age') as string);
    const gender = formData.get('gender') as string;
    const place = formData.get('place') as string;
    const phone = formData.get('phone') as string;
    const photoFile = formData.get('photo') as File | null;

    // Validation
    if (!name?.trim() || !age || !gender || !place?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (age < 5 || age > 100) {
      return NextResponse.json({ error: 'Age must be between 5 and 100' }, { status: 400 });
    }

    if (!['Male', 'Female'].includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone.length < 7) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check duplicate phone
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    // Handle photo upload
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, buffer, {
          contentType: photoFile.type,
          upsert: false,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(uploadData.path);
        photoUrl = urlData.publicUrl;
      }
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        age,
        gender,
        place: place.trim(),
        phone: cleanPhone,
        photo: photoUrl,
        total_points: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }

    const cookie = createSessionCookie(user);
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(cookie.name, cookie.value, cookie.options as any);

    return response;
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
