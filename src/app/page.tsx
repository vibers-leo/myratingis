"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChefHat, Star } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

// CSS-only animations for better mobile performance (no framer-motion)
export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen bg-chef-bg text-chef-text overflow-hidden flex flex-col items-center justify-center pt-20 pb-10">
      {/* Background - Dark mode texture */}
      <div className="absolute inset-0 z-0 hidden dark:block bg-[url('/dark-texture-bg.jpg')] bg-cover bg-center bg-fixed">
        <div className="absolute inset-0 bg-[#050505]/90" />
      </div>

      {/* Floating Elements - Hidden on mobile for performance */}
      <div className="hidden md:block absolute top-[15%] left-[15%] w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[120px] animate-pulse" />
      <div className="hidden md:block absolute bottom-[15%] right-[15%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-2 md:px-6 flex flex-col items-center text-center">

        {/* Badge Section */}
        <div className="animate-fade-in-down mb-6 mt-12 md:mt-0 flex items-center gap-2 px-3 md:px-5 py-2 rounded-full border border-chef-border bg-chef-panel/50 backdrop-blur-md shadow-2xl">
          <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-orange-500 fill-orange-500" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] text-orange-500/90">
            Professional Evaluation Stage
          </span>
        </div>

        {/* Logo Section */}
        <div className="animate-fade-in-up mb-6" style={{ animationDelay: '0.1s' }}>
          {theme === 'dark' ? (
            <Image
              src="/logo-white.png"
              alt="제 평가는요?"
              width={480}
              height={192}
              priority
              className="h-14 md:h-20 lg:h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            />
          ) : (
            <Image
              src="/myratingis-logo.png"
              alt="제 평가는요?"
              width={480}
              height={192}
              priority
              className="h-14 md:h-20 lg:h-24 w-auto object-contain brightness-0"
            />
          )}
        </div>

        {/* Subtitle Section */}
        <p
          className="animate-fade-in-up text-xs md:text-base lg:text-lg text-chef-text/50 font-medium max-w-2xl mx-auto leading-relaxed px-4 break-keep mb-12"
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
            className="w-full h-14 md:h-16 bg-chef-text hover:opacity-90 text-chef-bg text-lg md:text-xl font-black shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 bevel-cta border-none rounded-none italic uppercase"
          >
            <Star className="w-5 h-5 md:w-6 md:h-6" />
            평가 참여하기
          </Button>
        </div>

        {/* Secondary Discovery Links */}
        <div
          className="animate-fade-in flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-chef-text/20 pt-8"
          style={{ animationDelay: '0.6s' }}
        >
          <Link href="/about/features" className="hover:text-orange-500 transition-colors">Platform Features</Link>
          <Link href="/faq" className="hover:text-orange-500 transition-colors">User Support &amp; FAQ</Link>
        </div>
      </main>
    </div>
  );
}
