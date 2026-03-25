// 에러 메시지 한글화 및 사용자 친화적 변환

interface ErrorMessages {
  [key: string]: string;
}

// Supabase Auth 에러
const authErrors: ErrorMessages = {
  "Invalid login credentials": "아이디 또는 비밀번호가 일치하지 않습니다.",
  "Email not confirmed": "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.",
  "User already registered": "이미 가입된 이메일입니다.",
  "Password should be at least 6 characters": "비밀번호는 최소 6자 이상이어야 합니다.",
  "Unable to validate email address: invalid format": "올바른 이메일 형식이 아닙니다.",
  "Signup requires a valid password": "비밀번호를 입력해주세요.",
  "refresh_token_not_found": "로그인이 만료되었습니다. 다시 로그인해주세요.",
  "Token expired": "세션이 만료되었습니다. 다시 로그인해주세요.",
  "invalid_grant": "인증 정보가 유효하지 않습니다. 다시 로그인해주세요.",
  "User not found": "사용자를 찾을 수 없습니다.",
  "Email rate limit exceeded": "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
};

// Supabase Database 에러
const dbErrors: ErrorMessages = {
  "duplicate key value": "이미 존재하는 데이터입니다.",
  "violates foreign key constraint": "연결된 데이터가 존재하지 않습니다.",
  "violates not-null constraint": "필수 항목을 입력해주세요.",
  "permission denied": "권한이 없습니다.",
  "row-level security": "접근 권한이 없습니다.",
};

// 네트워크 에러
const networkErrors: ErrorMessages = {
  "Failed to fetch": "네트워크 연결을 확인해주세요.",
  "Network request failed": "네트워크 오류가 발생했습니다.",
  "timeout": "요청 시간이 초과되었습니다. 다시 시도해주세요.",
  "ECONNREFUSED": "서버에 연결할 수 없습니다.",
};

// 파일 업로드 에러
const uploadErrors: ErrorMessages = {
  "Payload too large": "파일 크기가 너무 큽니다. (최대 10MB)",
  "The resource already exists": "같은 이름의 파일이 이미 존재합니다.",
  "Invalid file type": "지원하지 않는 파일 형식입니다.",
  "mime type": "지원하지 않는 파일 형식입니다.",
};

/**
 * 에러 메시지를 사용자 친화적인 한글로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return "알 수 없는 오류가 발생했습니다.";

  let message = "";
  
  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; error_description?: string };
    message = err.message || err.error_description || JSON.stringify(error);
  }

  // 모든 에러 사전에서 검색
  const allErrors = { ...authErrors, ...dbErrors, ...networkErrors, ...uploadErrors };
  
  for (const [key, value] of Object.entries(allErrors)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // 매칭되는 에러가 없으면 기본 메시지
  if (message.length > 100) {
    return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return message || "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
}

/**
 * API 응답 에러 처리
 */
export function handleApiError(response: Response): never {
  const errorMessages: { [key: number]: string } = {
    400: "잘못된 요청입니다.",
    401: "로그인이 필요합니다.",
    403: "접근 권한이 없습니다.",
    404: "요청한 내용을 찾을 수 없습니다.",
    409: "이미 존재하는 데이터입니다.",
    413: "파일 크기가 너무 큽니다.",
    429: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    500: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    502: "서버가 일시적으로 이용 불가능합니다.",
    503: "서비스를 일시적으로 이용할 수 없습니다.",
  };

  throw new Error(errorMessages[response.status] || `오류가 발생했습니다. (${response.status})`);
}
