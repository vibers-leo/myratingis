import Link from 'next/link';

export default function TossProjectsPage() {
  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <h2 className="mb-1 text-[20px] font-bold text-gray-900">프로젝트 목록</h2>
      <p className="mb-6 text-[14px] text-gray-500">
        평가를 기다리는 프로젝트들
      </p>

      {/* 빈 상태 */}
      <div className="flex flex-1 flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
          📋
        </div>
        <p className="mb-1 text-[16px] font-semibold text-gray-900">
          준비 중이에요
        </p>
        <p className="mb-6 text-center text-[14px] leading-relaxed text-gray-500">
          곧 다양한 프로젝트의<br />
          평가를 시작할 수 있어요
        </p>
        <Link
          href="/toss"
          className="rounded-xl bg-amber-500 px-6 py-3 text-[14px] font-semibold text-white transition-colors active:bg-amber-600"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
