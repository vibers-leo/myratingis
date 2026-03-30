// api/upload/route.ts — 클라이언트 → NCP 이미지 서버 프록시
import { NextRequest, NextResponse } from "next/server";

const IMAGE_SERVER = "http://49.50.138.93:8091";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `파일 크기 초과 (최대 ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `허용되지 않는 파일 형식: ${file.type}` },
        { status: 400 }
      );
    }

    // NCP 서버로 그대로 전달
    const res = await fetch(`${IMAGE_SERVER}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `업로드 실패: ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: `서버 오류: ${String(error)}` },
      { status: 500 }
    );
  }
}
