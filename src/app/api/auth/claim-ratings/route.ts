import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guest_id } = await req.json();
    if (!guest_id) {
      return NextResponse.json({ error: 'Guest ID required' }, { status: 400 });
    }

    // 1. Find all ratings belonging to this guest_id
    // guest_id 컬럼은 text 타입이므로 직접 쿼리 가능
    const { data: guestRatings } = await (supabaseAdmin as any)
      .from('ProjectRating')
      .select('id, project_id')
      .eq('guest_id', guest_id);

    if (guestRatings && guestRatings.length > 0) {
      for (const rating of guestRatings) {
        // Check if user already has a rating for this project via RPC
        const { data: userRatings } = await supabaseAdmin
          .rpc('get_user_rating', {
            p_project_id: rating.project_id,
            p_user_id: user.id,
            p_guest_id: null
          });

        const userRating = userRatings?.[0] || null;

        if (userRating) {
          // User already has a rating, delete the guest one
          await (supabaseAdmin as any)
            .from('ProjectRating')
            .delete()
            .eq('id', rating.id);
        } else {
          // Claim the guest rating
          await (supabaseAdmin as any)
            .from('ProjectRating')
            .update({
              user_id: user.id,
              guest_id: null
            })
            .eq('id', rating.id);
        }
      }
    }

    // 2. Same for Comments
    await supabaseAdmin
      .from('Comment')
      .update({ user_id: user.id })
      .eq('guest_id', guest_id);

    return NextResponse.json({ success: true, merged_count: guestRatings?.length || 0 });

  } catch (error: any) {
    console.error('[API] Claim Ratings Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
