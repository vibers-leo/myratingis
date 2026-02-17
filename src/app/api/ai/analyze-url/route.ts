import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(20000),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[Gemini REST] Error:', res.status, errBody);
    throw new Error(`Gemini API ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'AI 서비스가 현재 사용 불가합니다.',
    }, { status: 200 });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL이 필요합니다.' }, { status: 400 });
    }

    // Validate URL
    let validUrl: string;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      validUrl = parsed.toString();
    } catch {
      return NextResponse.json({ success: false, error: '유효하지 않은 URL입니다.' }, { status: 400 });
    }

    // Fetch page metadata via Microlink
    let pageTitle = '';
    let pageDescription = '';
    let pageImage = '';

    try {
      const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(validUrl)}&meta=true&screenshot=true&embed=screenshot.url`;
      const metaRes = await fetch(microlinkUrl, { signal: AbortSignal.timeout(8000) });
      const metaData = await metaRes.json();
      if (metaData.status === 'success') {
        pageTitle = metaData.data.title || '';
        pageDescription = metaData.data.description || '';
        pageImage = metaData.data.screenshot?.url || metaData.data.image?.url || '';
      }
    } catch (e) {
      console.warn('[analyze-url] Microlink fetch failed:', e);
    }

    // Fetch raw HTML for more context
    let pageText = '';
    try {
      const htmlRes = await fetch(validUrl, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MyRatingIsBot/1.0)',
          'Accept': 'text/html',
        },
      });
      const html = await htmlRes.text();
      pageText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000);
    } catch (e) {
      console.warn('[analyze-url] HTML fetch failed:', e);
    }

    // Build prompt for Gemini
    const prompt = `당신은 프로젝트 평가 플랫폼의 AI 어시스턴트입니다.
아래 정보는 사용자가 평가받고 싶은 MVP(Minimum Viable Product) 웹사이트의 정보입니다.
이 정보를 분석하여, 평가 등록 폼에 들어갈 초안을 JSON 형식으로 작성해주세요.

[웹사이트 정보]
- URL: ${validUrl}
- 제목: ${pageTitle || '(추출 실패)'}
- 설명: ${pageDescription || '(추출 실패)'}
- 페이지 텍스트 내용 (일부): ${pageText || '(추출 실패)'}

[요청 사항]
다음 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요:
{
  "title": "프로젝트 제목 (30자 이내, 한국어)",
  "summary": "프로젝트 소개 (2~3문장, 평가자가 프로젝트를 이해할 수 있도록 핵심 기능과 대상 사용자를 설명. 한국어)",
  "categories": [
    { "label": "평가항목명", "desc": "항목 설명 (15자 이내)" }
  ],
  "questions": [
    "평가자에게 물어볼 질문 (한국어)"
  ]
}

[categories 작성 규칙]
- 이 프로젝트에 맞는 맞춤형 평가 기준 5개를 제안하세요
- 일반적인 기준(기획력, 독창성 등)보다 이 프로젝트의 특성에 맞는 구체적 기준을 만드세요
- 예시: 커피 배달 앱이면 "주문 편의성", "배달 추적 UX", "메뉴 탐색성" 등

[questions 작성 규칙]
- 이 프로젝트에 대해 평가자에게 물어볼 질문 3개를 제안하세요
- 실질적인 피드백을 이끌어낼 수 있는 구체적 질문을 작성하세요

JSON만 출력하세요:`;

    const text = await callGemini(prompt, apiKey);

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      console.error('[analyze-url] JSON parse failed:', text);
      return NextResponse.json({
        success: false,
        error: 'AI 응답을 파싱하지 못했습니다. 다시 시도해주세요.',
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      data: {
        title: parsed.title || pageTitle || '',
        summary: parsed.summary || pageDescription || '',
        categories: Array.isArray(parsed.categories)
          ? parsed.categories.map((c: any, i: number) => ({
              id: `ai-${i + 1}`,
              label: c.label || '',
              desc: c.desc || '',
            }))
          : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        ogImage: pageImage,
        ogTitle: pageTitle,
        ogDescription: pageDescription,
      },
    });
  } catch (error: any) {
    console.error('[analyze-url] Error:', error);
    const msg = error.message || '';
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('Quota');
    return NextResponse.json({
      success: false,
      error: isQuota
        ? 'AI 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
        : 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    }, { status: 200 });
  }
}
