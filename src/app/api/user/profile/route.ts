import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    const body = await req.json();
    
    // Sanitize payload
    const { id, ...dataToUpdate } = body;
    const updatePayload = {
        updated_at: new Date().toISOString(),
        nickname: body.nickname, 
        username: body.nickname, 
        gender: body.gender,
        age_group: body.age_group,
        occupation: body.occupation,
        expertise: body.expertise ? (typeof body.expertise === 'object' ? body.expertise : { fields: [] }) : { fields: [] },
    };

    console.log('[API] Updating Profile:', user.id, updatePayload);

    // 1. Use Upsert for most robust profile management
    const { error: upsertError } = await supabase
       .from('profiles')
       .upsert({
           id: user.id,
           ...updatePayload
       }, { onConflict: 'id' });

    if (upsertError) {
        console.error('[API] Profile Update failed:', upsertError);
        throw upsertError;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[API] Profile Update Error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
