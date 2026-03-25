import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Use microlink for reliable preview and screenshot
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=true&embed=screenshot.url`;
    
    try {
      const response = await fetch(microlinkUrl, { signal: AbortSignal.timeout(5000) });
      const data = await response.json();

      if (data.status === 'success') {
         return NextResponse.json({
           title: data.data.title,
           description: data.data.description,
           image: data.data.screenshot?.url || data.data.image?.url
         });
      }
    } catch (e) {
      console.warn('Microlink failed:', e);
    }

    // Fallback for fail - return success with empty info to stop client retries or 500 errors
    return NextResponse.json({ title: '', description: '', image: '' });
  } catch (error: any) {
    console.error('OG Preview Error:', error);
    return NextResponse.json({ title: '', description: '', image: '' });
  }
}
