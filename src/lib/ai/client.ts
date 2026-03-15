import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn("GROQ_API_KEY is not set in environment variables.");
}

export const groq = new Groq({ apiKey: apiKey || "" });

// 기본 모델: Llama 3.3 70B (무료, 빠름, 한국어 지원)
export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function chatCompletion(
  prompt: string,
  options?: { system?: string; maxTokens?: number; temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

  if (options?.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: prompt });

  const completion = await groq.chat.completions.create({
    messages,
    model: DEFAULT_MODEL,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1024,
    ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return completion.choices[0]?.message?.content || "";
}
