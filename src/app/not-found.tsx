"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  console.log("[NotFound Page] Rendering custom 404...");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
      <div className="space-y-6 max-w-lg">
        {/* 404 Typo Art */}
        <h1 className="text-[150px] font-black text-slate-100 leading-none select-none">
          404
        </h1>
        
        <div className="-mt-12 space-y-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-slate-500 text-lg">
            요청하신 페이지가 삭제되었거나, 이름이 변경되었거나,<br className="hidden md:block" />
            일시적으로 사용할 수 없습니다.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <ArrowLeft size={18} className="mr-2" />
            이전 페이지
          </Button>
          <Link href="/">
            <Button className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all">
              <Home size={18} className="mr-2" />
              메인으로 이동
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
