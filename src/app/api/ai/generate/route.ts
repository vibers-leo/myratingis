import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, hasAIKey } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ai/rate-limit";

export async function POST(req: NextRequest) {
  if (!hasAIKey()) {
    return NextResponse.json({
      error: "AI 서비스 점검 중",
      message: "현재 AI 서비스 점검 중입니다."
    }, { status: 200 });
  }

  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { allowed } = checkRateLimit(ip, false);
  if (!allowed) {
    return NextResponse.json({ error: "일일 AI 사용 한도를 초과했습니다." }, { status: 429 });
  }

  try {
    const { type, topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    let system = "";
    let prompt = "";

    if (type === 'lean-canvas') {
        system = "You are a professional Startup Consultant. Always respond with valid JSON only.";
        prompt = `Please generate a Lean Canvas for a service/product idea: "${topic}"

Current Language: Korean (한국어) - **MUST OUTPUT IN KOREAN**

Output the following JSON structure:
{
  "problem": "3 key problems (bullet points using numbers)",
  "customerSegments": "Target customers (bullet points)",
  "uniqueValueProposition": "Single clear, compelling message that states why you are different and worth buying.",
  "solution": "Top 3 features (bullet points)",
  "channels": "Path to customers (bullet points)",
  "revenueStreams": "Revenue model (bullet points)",
  "costStructure": "Customer acquisition costs, distribution costs, hosting, people, etc. (bullet points)",
  "keyMetrics": "Key activities you measure (bullet points)",
  "unfairAdvantage": "Something that cannot be easily copied or bought (bullet points)"
}`;
    } else if (type === 'persona') {
        system = "You are a UX Researcher. Always respond with valid JSON only.";
        prompt = `Please define a detailed target persona for a service/product idea: "${topic}"

Current Language: Korean (한국어) - **MUST OUTPUT IN KOREAN**

Output the following JSON structure:
{
  "name": "Korean Name",
  "age": "e.g., 28세",
  "job": "Specific Job Title",
  "location": "City/District in Korea",
  "quote": "A short, memorable quote representing their pain point.",
  "bio": "A short paragraph (2-3 sentences) describing their lifestyle, personality, and relationship with technology.",
  "goals": ["Goal 1", "Goal 2", "Goal 3"],
  "frustrations": ["Frustration 1", "Frustration 2", "Frustration 3"],
  "brands": ["Brand 1", "Brand 2", "Brand 3", "Brand 4"],
  "mbti": "MBTI Type",
  "imageKeyword": "A single English keyword to search for a stock photo of this person (e.g., 'young asian businessman', 'female student', etc.)"
}`;
    } else if (type === 'assistant') {
        system = "You are a professional Content Writing Assistant. Always respond with valid JSON only.";
        prompt = `Based on the following request: "${topic}", please write a high-quality draft.

Current Language: Korean (한국어) - **MUST OUTPUT IN KOREAN**

Output the following JSON structure:
{
  "title": "Title of the content",
  "content": "Full markdown-formatted content. Use headers, bullet points, and appropriate tone."
}`;
    } else {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    let text = await chatCompletion(prompt, { system, maxTokens: 1024, temperature: 0.7, jsonMode: true });

    // Clean up markdown if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const json = JSON.parse(text);

        if (type === 'persona' && json.imageKeyword) {
            json.image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${json.name}&backgroundColor=b6e3f4`;
        }

        return NextResponse.json(json);
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Text:", text);
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
