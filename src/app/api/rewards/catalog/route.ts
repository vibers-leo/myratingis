import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');

    let query = supabaseAdmin
      .from('reward_items')
      .select('*')
      .eq('is_active', true)
      .order('point_cost', { ascending: true });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, items: data || [] });
  } catch (error: any) {
    console.error('[Catalog GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
