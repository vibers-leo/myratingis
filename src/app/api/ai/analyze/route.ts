import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, hasAIKey } from '@/lib/ai/client';
import { checkRateLimit } from '@/lib/ai/rate-limit';

export async function POST(req: NextRequest) {
  if (!hasAIKey()) {
    return NextResponse.json({
      success: false,
      analysis: "AI 서비스가 현재 점검 중입니다.",
      error: "API Key missing"
    }, { status: 200 });
  }

  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { allowed } = checkRateLimit(ip, false);
  if (!allowed) {
    return NextResponse.json({
      success: false,
      analysis: "일일 AI 사용 한도를 초과했습니다.",
    }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { scores, projectTitle, category } = body;

    if (!scores) {
        return NextResponse.json({ success: false, error: 'Scores are required' }, { status: 400 });
    }

    const { score_1, score_2, score_3, score_4 } = scores;

    const prompt = `
[프로젝트 정보]
- 제목: ${projectTitle || '제목 미상'}
- 카테고리: ${category || '일반'}

[평가 점수 (5.0 만점)]
1. 기획력 (Logic & Intent): ${score_1}
2. 완성도 (Detail & Finish): ${score_2}
3. 독창성 (Originality): ${score_3}
4. 상업성 (Market Value): ${score_4}

위 평가 데이터를 바탕으로, 창작자에게 전하는 한 줄의 강렬한 통찰과 구체적인 조언을 작성해주세요.
- 한국어 기준 1~2문장 내외 (공백 포함 150자 이내)
- 가장 높은 점수를 칭찬하거나, 가장 낮은 점수에 대한 보완점을 지적
- 반드시 존댓말 사용`;

    const system = `당신은 'MyRatingIs Michelin'이라는 권위 있는 예술/디자인 평가 시스템의 수석 인스펙터입니다. 정중하면서도 날카로운 전문가의 어조로 응답합니다.`;

    try {
      const text = await chatCompletion(prompt, { system, maxTokens: 256, temperature: 0.7 });

      return NextResponse.json({
          success: true,
          analysis: text
      });
    } catch (apiError: any) {
      console.error('[Groq API Error]', apiError);
      return NextResponse.json({
        success: false,
        analysis: "데이터를 분석하는 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        error: apiError.message
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('[AI Analysis Route Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
