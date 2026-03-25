// src/components/TopHeader.tsx

"use client";

import Link from "next/link";

export function TopHeader() {
  return (
    <div className="w-full min-h-[40px] flex items-center bg-[#16A34A] text-white z-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-2 w-full flex items-center justify-center">
        <p className="text-xs md:text-sm font-black tracking-widest uppercase italic">
          <span className="text-orange-400">MYRATINGIS</span> BETA TESTING
        </p>
      </div>
    </div>
  );
}

export default TopHeader;
