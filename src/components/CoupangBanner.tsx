'use client';

export default function CoupangBanner() {
  return (
    <div className="w-full py-2 text-center text-xs text-gray-400">
      <a
        href="https://link.coupang.com/a/AF4011706"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="hover:text-gray-600 transition-colors"
      >
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </a>
    </div>
  );
}
