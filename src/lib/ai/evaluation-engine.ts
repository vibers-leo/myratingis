// src/lib/ai/evaluation-engine.ts — AI 6축 프로젝트 평가 엔진
import { chatCompletion, hasAIKey } from "./client";

/** 6축 평가 축 정의 */
export const EVALUATION_AXES = [
  { key: "ui_ux", label: "UI/UX 디자인", description: "사용자 인터페이스와 경험의 질" },
  { key: "tech_depth", label: "기술 깊이", description: "기술 스택의 복잡도와 구현 수준" },
  { key: "marketability", label: "시장성", description: "상업적 잠재력과 시장 적합성" },
  { key: "originality", label: "독창성", description: "아이디어의 참신함과 차별화" },
  { key: "completeness", label: "완성도", description: "프로젝트의 완성 수준과 안정성" },
  { key: "scalability", label: "확장성", description: "성장 가능성과 확장 용이성" },
] as const;

export type AxisKey = (typeof EVALUATION_AXES)[number]["key"];

/** 축별 평가 결과 */
export interface AxisEvaluation {
  key: AxisKey;
  label: string;
  score: number; // 0-5
  feedback: string; // 한국어 2-3문장
}

/** 전체 평가 결과 */
export interface EvaluationResult {
  axes: AxisEvaluation[];
  totalScore: number; // 6축 평균 (0-5)
  improvements: string[]; // 상위 3개 개선 제안
  summary: string; // 전체 요약 (한국어 3-4문장)
  evaluatedAt: string; // ISO 날짜
}

/** 프로젝트 데이터 입력 */
export interface ProjectInput {
  title: string;
  description?: string | null;
  url?: string | null;
  techStack?: string[] | null;
  summary?: string | null;
  category?: string | null;
}

/**
 * AI를 활용한 6축 프로젝트 평가
 * Groq 우선, Gemini 폴백, AI 키 없으면 휴리스틱 폴백
 */
export async function evaluateProject(
  projectData: ProjectInput
): Promise<EvaluationResult> {
  // AI 키가 없으면 휴리스틱 평가
  if (!hasAIKey()) {
    return heuristicEvaluation(projectData);
  }

  const prompt = buildEvaluationPrompt(projectData);
  const systemPrompt = `당신은 프로젝트 평가 전문가입니다. 창작자의 프로젝트를 공정하고 건설적으로 평가합니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

  try {
    const raw = await chatCompletion(prompt, {
      system: systemPrompt,
      maxTokens: 2048,
      temperature: 0.4,
      jsonMode: true,
    });

    const parsed = JSON.parse(raw);
    return normalizeAIResponse(parsed);
  } catch (error) {
    console.error("[AI 평가] AI 호출 실패, 휴리스틱 폴백:", error);
    return heuristicEvaluation(projectData);
  }
}

/** AI 프롬프트 생성 */
function buildEvaluationPrompt(data: ProjectInput): string {
  const techInfo = data.techStack?.length
    ? `기술 스택: ${data.techStack.join(", ")}`
    : "기술 스택: 정보 없음";

  return `다음 프로젝트를 6개 축으로 평가해주세요.

## 프로젝트 정보
- 제목: ${data.title}
- 요약: ${data.summary || "없음"}
- 설명: ${data.description || "없음"}
- URL: ${data.url || "없음"}
- ${techInfo}
- 카테고리: ${data.category || "미분류"}

## 평가 축 (각 0~5점, 소수점 1자리)
1. ui_ux: UI/UX 디자인 품질
2. tech_depth: 기술 깊이와 구현 수준
3. marketability: 시장성과 상업적 잠재력
4. originality: 아이디어의 독창성
5. completeness: 프로젝트 완성도
6. scalability: 확장성과 성장 가능성

## 응답 형식 (JSON)
{
  "axes": [
    { "key": "ui_ux", "score": 3.5, "feedback": "한국어 2-3문장 피드백" },
    { "key": "tech_depth", "score": 4.0, "feedback": "한국어 2-3문장 피드백" },
    { "key": "marketability", "score": 3.0, "feedback": "한국어 2-3문장 피드백" },
    { "key": "originality", "score": 4.5, "feedback": "한국어 2-3문장 피드백" },
    { "key": "completeness", "score": 3.5, "feedback": "한국어 2-3문장 피드백" },
    { "key": "scalability", "score": 3.0, "feedback": "한국어 2-3문장 피드백" }
  ],
  "improvements": ["개선 제안 1", "개선 제안 2", "개선 제안 3"],
  "summary": "전체 요약 3-4문장 한국어"
}`;
}

/** AI 응답 정규화 */
function normalizeAIResponse(parsed: Record<string, unknown>): EvaluationResult {
  const axes: AxisEvaluation[] = EVALUATION_AXES.map((axis) => {
    const found = (parsed.axes as Record<string, unknown>[])?.find(
      (a: Record<string, unknown>) => a.key === axis.key
    );
    return {
      key: axis.key,
      label: axis.label,
      score: Math.min(5, Math.max(0, Number(found?.score ?? 2.5))),
      feedback: String(found?.feedback || `${axis.label}에 대한 평가 정보가 부족합니다.`),
    };
  });

  const totalScore =
    Math.round((axes.reduce((sum, a) => sum + a.score, 0) / axes.length) * 10) / 10;

  const improvements = Array.isArray(parsed.improvements)
    ? (parsed.improvements as string[]).slice(0, 3)
    : ["프로젝트 설명을 더 상세하게 작성해보세요."];

  return {
    axes,
    totalScore,
    improvements,
    summary: String(parsed.summary || "평가가 완료되었습니다."),
    evaluatedAt: new Date().toISOString(),
  };
}

/** AI 키 없을 때 휴리스틱 평가 (폴백) */
function heuristicEvaluation(data: ProjectInput): EvaluationResult {
  const hasDescription = !!data.description && data.description.length > 50;
  const hasUrl = !!data.url;
  const hasTech = !!data.techStack && data.techStack.length > 0;
  const hasSummary = !!data.summary && data.summary.length > 10;

  // 정보 충실도 기반 점수 계산
  const infoScore =
    (hasDescription ? 1 : 0) + (hasUrl ? 1 : 0) + (hasTech ? 1 : 0) + (hasSummary ? 1 : 0);
  const baseScore = 1.5 + infoScore * 0.7; // 1.5 ~ 4.3

  const axes: AxisEvaluation[] = EVALUATION_AXES.map((axis) => {
    let score = baseScore;
    let feedback = "";

    switch (axis.key) {
      case "ui_ux":
        score = hasUrl ? baseScore + 0.3 : baseScore - 0.5;
        feedback = hasUrl
          ? "URL이 제공되어 실제 서비스를 확인할 수 있습니다. 상세한 평가를 위해 AI 평가를 활성화해주세요."
          : "서비스 URL이 없어 UI/UX를 직접 확인할 수 없습니다. URL을 추가해주세요.";
        break;
      case "tech_depth":
        score = hasTech ? baseScore + 0.5 : baseScore - 0.3;
        feedback = hasTech
          ? `${data.techStack!.join(", ")}를 사용하고 있습니다. 기술 스택의 다양성이 돋보입니다.`
          : "기술 스택 정보가 없습니다. 사용한 기술을 명시하면 더 정확한 평가가 가능합니다.";
        break;
      case "marketability":
        score = baseScore;
        feedback = "시장성 평가를 위해 타겟 사용자와 비즈니스 모델 정보가 필요합니다. AI 평가를 활성화하면 더 정확한 분석이 가능합니다.";
        break;
      case "originality":
        score = baseScore + 0.2;
        feedback = hasDescription
          ? "프로젝트 설명을 기반으로 기본 평가를 진행했습니다. AI 평가를 통해 유사 프로젝트와의 차별점을 분석할 수 있습니다."
          : "프로젝트 설명이 부족하여 독창성을 판단하기 어렵습니다.";
        break;
      case "completeness":
        score = hasUrl && hasDescription ? baseScore + 0.3 : baseScore - 0.3;
        feedback = hasUrl
          ? "실서비스 URL이 있어 배포된 상태로 보입니다. 완성도가 기본 수준 이상입니다."
          : "서비스 URL이 없어 완성도를 판단하기 어렵습니다. 배포 후 URL을 추가해주세요.";
        break;
      case "scalability":
        score = hasTech ? baseScore + 0.2 : baseScore - 0.2;
        feedback = "확장성 평가를 위해 아키텍처와 기술 스택 정보가 필요합니다. AI 평가를 활성화하면 더 상세한 분석이 가능합니다.";
        break;
    }

    return {
      key: axis.key,
      label: axis.label,
      score: Math.round(Math.min(5, Math.max(0, score)) * 10) / 10,
      feedback,
    };
  });

  const totalScore =
    Math.round((axes.reduce((sum, a) => sum + a.score, 0) / axes.length) * 10) / 10;

  return {
    axes,
    totalScore,
    improvements: [
      !hasDescription ? "프로젝트 설명을 50자 이상으로 상세하게 작성해보세요." : "프로젝트 설명에 핵심 가치와 차별점을 더 강조해보세요.",
      !hasUrl ? "실서비스 URL을 추가하면 UI/UX와 완성도를 더 정확히 평가할 수 있습니다." : "사용자 피드백을 수집하여 UX를 지속적으로 개선해보세요.",
      !hasTech ? "사용한 기술 스택을 명시하면 기술 깊이 평가가 가능합니다." : "확장성을 위해 마이크로서비스나 모듈화를 고려해보세요.",
    ],
    summary: `기본 휴리스틱 평가 결과입니다. ${hasDescription ? "프로젝트 설명이 제공되어 있어 " : ""}${hasUrl ? "실서비스가 배포되어 있으며 " : ""}${hasTech ? `${data.techStack!.join(", ")} 기술을 활용하고 있습니다. ` : ""}AI API 키를 설정하면 더 상세하고 정확한 6축 평가를 받을 수 있습니다.`,
    evaluatedAt: new Date().toISOString(),
  };
}
