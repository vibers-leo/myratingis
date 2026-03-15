import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processUserQuery } from "@/lib/ai/search-service";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { hasAIKey } from "@/lib/ai/client";

export async function POST(req: NextRequest) {
  if (!hasAIKey()) {
    return NextResponse.json({
      error: "AI 서비스 점검 중",
      answer: "현재 AI 서비스 점검 중입니다.",
      results: []
    }, { status: 200 });
  }

  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { allowed } = checkRateLimit(ip, false);
  if (!allowed) {
    return NextResponse.json({
      error: "일일 AI 사용 한도 초과",
      answer: "일일 AI 사용 한도를 초과했습니다. 내일 다시 이용해주세요.",
      results: []
    }, { status: 429 });
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { message, category, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 2. Process AI Request (Agent)
    const agentResponse = await processUserQuery(message, category);

    // 3. Database Persistence (Only if logged in)
    let currentSessionId = sessionId;

    if (user) {
      // 3.1 Create Session if needed
      if (!currentSessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('ai_chat_sessions')
          .insert({
            user_id: user.id,
            tool_type: category,
            title: message.slice(0, 30)
          })
          .select('id')
          .single();

        if (sessionError) {
            console.error('Session Create Error:', sessionError);
        } else {
            currentSessionId = sessionData.id;
        }
      }

      // 3.2 Save User Message
      if (currentSessionId) {
        await supabase.from('ai_chat_messages').insert({
          session_id: currentSessionId,
          role: 'user',
          content: message
        });

        // 3.3 Save Assistant Message
        await supabase.from('ai_chat_messages').insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: agentResponse.answer,
            tool_data: agentResponse.results
        });
      }
    }

    return NextResponse.json({
      sessionId: currentSessionId,
      answer: agentResponse.answer,
      results: agentResponse.results
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
