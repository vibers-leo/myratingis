import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// === Groq (우선) ===
const groqKey = process.env.GROQ_API_KEY;
const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;
const GROQ_MODEL = "llama-3.3-70b-versatile";

// === Gemini (폴백) ===
const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
const GEMINI_MODEL = "gemini-2.0-flash";

if (!groqKey && !geminiKey) {
  console.warn("AI API 키가 설정되지 않았습니다. (GROQ_API_KEY 또는 GOOGLE_GENERATIVE_AI_API_KEY)");
}

/** AI 키가 하나라도 설정되어 있는지 확인 */
export function hasAIKey(): boolean {
  return !!(groqKey || geminiKey);
}

/** Groq 우선, Gemini 폴백 통합 AI 호출 */
export async function chatCompletion(
  prompt: string,
  options?: { system?: string; maxTokens?: number; temperature?: number; jsonMode?: boolean }
): Promise<string> {
  // 1. Groq 우선 시도
  if (groq) {
    try {
      return await callGroq(prompt, options);
    } catch (error) {
      console.warn("[AI] Groq 호출 실패, Gemini 폴백 시도:", error);
      if (genAI) {
        return await callGemini(prompt, options);
      }
      throw error;
    }
  }

  // 2. Gemini 폴백
  if (genAI) {
    return await callGemini(prompt, options);
  }

  throw new Error("AI API 키가 설정되지 않았습니다.");
}

async function callGroq(
  prompt: string,
  options?: { system?: string; maxTokens?: number; temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

  if (options?.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: prompt });

  const completion = await groq!.chat.completions.create({
    messages,
    model: GROQ_MODEL,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1024,
    ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return completion.choices[0]?.message?.content || "";
}

async function callGemini(
  prompt: string,
  options?: { system?: string; maxTokens?: number; temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const model = genAI!.getGenerativeModel({
    model: GEMINI_MODEL,
    ...(options?.system ? { systemInstruction: options.system } : {}),
    generationConfig: {
      maxOutputTokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
      ...(options?.jsonMode ? { responseMimeType: "application/json" as const } : {}),
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
