// src/app/api/ai/evaluate/route.ts — AI 6축 평가 API
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateProject, type EvaluationResult } from "@/lib/ai/evaluation-engine";

/**
 * POST /api/ai/evaluate
 * 프로젝트 ID를 받아 AI 6축 평가를 수행하고 결과를 DB에 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: "project_id가 필요합니다." },
        { status: 400 }
      );
    }

    // 프로젝트 조회
    const project = await prisma.projects.findUnique({
      where: { id: project_id },
      select: {
        id: true,
        title: true,
        description: true,
        summary: true,
        site_url: true,
        custom_data: true,
        category_id: true,
        project_fields: {
          include: { fields: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 기술 스택 추출 (custom_data에서)
    const customData = project.custom_data as Record<string, unknown> | null;
    const techStack = Array.isArray(customData?.tech_stack)
      ? (customData.tech_stack as string[])
      : [];

    // AI 평가 실행
    const evaluation: EvaluationResult = await evaluateProject({
      title: project.title,
      description: project.description,
      summary: project.summary,
      url: project.site_url,
      techStack,
      category: project.project_fields?.[0]?.fields?.name || null,
    });

    // ai_evaluations 테이블에 저장 (raw SQL — Prisma 스키마에 아직 없을 수 있으므로)
    await saveEvaluation(project_id, evaluation);

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("[AI 평가 API] 오류:", error);
    return NextResponse.json(
      { error: "평가 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * ai_evaluations 테이블에 평가 결과 저장
 * 테이블이 없으면 자동 생성
 */
async function saveEvaluation(
  projectId: string,
  evaluation: EvaluationResult
) {
  // 테이블 생성 (이미 존재하면 무시)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ai_evaluations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      axes JSONB NOT NULL DEFAULT '[]',
      total_score DECIMAL(3,1) NOT NULL DEFAULT 0,
      improvements JSONB NOT NULL DEFAULT '[]',
      summary TEXT,
      evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // 인덱스 생성 (이미 존재하면 무시)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_ai_evaluations_project
    ON ai_evaluations(project_id)
  `);

  // 기존 평가가 있으면 업데이트, 없으면 삽입 (UPSERT)
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO ai_evaluations (project_id, axes, total_score, improvements, summary, evaluated_at)
    VALUES ($1::uuid, $2::jsonb, $3, $4::jsonb, $5, $6::timestamptz)
    ON CONFLICT (project_id)
    DO UPDATE SET
      axes = EXCLUDED.axes,
      total_score = EXCLUDED.total_score,
      improvements = EXCLUDED.improvements,
      summary = EXCLUDED.summary,
      evaluated_at = EXCLUDED.evaluated_at
    `,
    projectId,
    JSON.stringify(evaluation.axes),
    evaluation.totalScore,
    JSON.stringify(evaluation.improvements),
    evaluation.summary,
    evaluation.evaluatedAt
  );

  // unique 제약 추가 (이미 존재하면 무시)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_evaluations_project_id_key'
      ) THEN
        ALTER TABLE ai_evaluations ADD CONSTRAINT ai_evaluations_project_id_key UNIQUE (project_id);
      END IF;
    END $$
  `);
}
