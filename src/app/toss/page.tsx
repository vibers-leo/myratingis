import Link from 'next/link';

export default function TossHomePage() {
  return (
    <div className="flex flex-1 flex-col px-5 py-8">
      {/* 히어로 */}
      <div className="mb-10 mt-4">
        <h1 className="mb-3 text-[26px] font-bold leading-tight text-gray-900">
          나의 프로젝트,<br />
          솔직한 평가를 받아보세요
        </h1>
        <p className="text-[15px] leading-relaxed text-gray-500">
          크리에이터와 개발자를 위한<br />
          프로젝트 평가 플랫폼
        </p>
      </div>

      {/* 기능 카드 */}
      <div className="mb-8 space-y-3">
        <Link
          href="/toss/projects"
          className="flex items-center gap-4 rounded-2xl bg-gray-50 p-5 transition-colors active:bg-gray-100"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white text-lg">
            ⭐
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-gray-900">프로젝트 목록</p>
            <p className="mt-0.5 text-[13px] text-gray-500">
              평가할 프로젝트를 찾아보세요
            </p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
      </div>

      {/* CTA */}
      <div className="mt-auto pb-4">
        <Link
          href="/toss/projects"
          className="flex w-full items-center justify-center rounded-xl bg-amber-500 py-4 text-[16px] font-semibold text-white transition-colors active:bg-amber-600"
        >
          시작하기
        </Link>
      </div>
    </div>
  );
}
