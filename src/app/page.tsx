"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChefHat, Star } from "lucide-react";

// CSS-only animations for better mobile performance (no framer-motion)
export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Background - Pure CSS (no heavy image) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,165,0,0.03) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.02) 0%, transparent 50%)`,
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      {/* Floating Elements - Hidden on mobile for performance */}
      <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="hidden md:block absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center space-y-12">
        {/* Badge - CSS animation */}
        <div className="animate-fade-in-down flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-orange-400 fill-orange-400" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
            Professional Evaluation Stage
          </span>
        </div>

        {/* Logo - CSS animation */}
        <div className="animate-fade-in-up pt-2 md:pt-4" style={{ animationDelay: '0.1s' }}>
          <Image 
            src="/myratingis-logo.png" 
            alt="제 평가는요?" 
            width={400}
            height={160}
            quality={100}
            className="h-12 md:h-16 lg:h-20 w-auto object-contain brightness-0 invert"
            priority
          />
        </div>

        {/* Subtitle - CSS animation */}
        <p 
          className="animate-fade-in-up text-xs md:text-base lg:text-lg text-white/60 font-medium max-w-4xl mx-auto leading-relaxed px-4 break-keep"
          style={{ animationDelay: '0.2s' }}
        >
          전문평가위원과 잠재고객의 날카로운 시선으로<br />
          여러분의 프로젝트가 가진 진짜 가치를 증명해 드립니다.
        </p>

        {/* Cloche Illustration - CSS animation */}
        <div 
          className="animate-scale-in relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80"
          style={{ animationDelay: '0.3s' }}
        >
          <Image 
            src="/review/cloche-cover.png" 
            alt="Cloche" 
            width={320}
            height={320}
            sizes="(max-width: 768px) 192px, (max-width: 1024px) 256px, 320px"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_30px_rgba(255,165,0,0.2)]"
            priority
          />
        </div>

        {/* CTA Buttons - CSS animation */}
        <div 
          className="animate-fade-in-up flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-4"
          style={{ animationDelay: '0.4s' }}
        >
          <Button
            onClick={() => router.push("/project/upload")}
            className="w-full h-14 md:h-16 bg-orange-600 hover:bg-orange-500 text-white text-lg md:text-xl font-black shadow-[0_20px_40px_-15px_rgba(234,88,12,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 bevel-cta border-none rounded-none italic uppercase"
          >
            <ChefHat className="w-5 h-5 md:w-6 md:h-6" />
            평가 의뢰하기
          </Button>
          <Button
            onClick={() => router.push("/projects")}
            className="w-full h-14 md:h-16 bg-white hover:bg-gray-100 text-gray-900 text-lg md:text-xl font-black shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 bevel-cta border-none rounded-none italic uppercase"
          >
            <Star className="w-5 h-5 md:w-6 md:h-6" />
            평가 참여하기
          </Button>
        </div>

        {/* Secondary Discovery Links */}
        <div 
          className="animate-fade-in flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 pt-8"
          style={{ animationDelay: '0.6s' }}
        >
          <Link href="/about/features" className="hover:text-orange-500 transition-colors">Platform Features</Link>
          <Link href="/faq" className="hover:text-orange-500 transition-colors">User Support &amp; FAQ</Link>
        </div>
      </main>
    </div>
  );
}
