export type QuestionType = 'textarea' | 'short_text' | 'single_choice' | 'multiple_choice' | 'likert';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  likertScale?: 5 | 7;
  likertLabels?: [string, string];
}

export type AnswerValue = string | string[] | number;

/**
 * 기존 string[] 형식의 질문을 Question[] 형식으로 정규화합니다.
 * 하위 호환성을 위해 기존 프로젝트도 정상 동작합니다.
 */
export function normalizeQuestions(raw: any): Question[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((q: any, i: number) => {
    if (typeof q === 'string') {
      return {
        id: `legacy_${i}`,
        type: 'textarea' as QuestionType,
        text: q,
        required: true,
      };
    }
    return q as Question;
  });
}

/** 새 질문 생성 시 고유 ID를 생성합니다. */
export function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/** 질문 유형의 한글 라벨을 반환합니다. */
export function getQuestionTypeLabel(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    textarea: '서술형',
    short_text: '단답형',
    single_choice: '단일 선택',
    multiple_choice: '복수 선택',
    likert: '만족도 척도',
  };
  return labels[type];
}

/** 새 빈 질문을 생성합니다. */
export function createEmptyQuestion(type: QuestionType = 'textarea'): Question {
  const base: Question = {
    id: generateQuestionId(),
    type,
    text: '',
    required: true,
  };
  if (type === 'single_choice' || type === 'multiple_choice') {
    base.options = ['', ''];
  }
  if (type === 'likert') {
    base.likertScale = 5;
    base.likertLabels = ['매우 불만족', '매우 만족'];
  }
  return base;
}
