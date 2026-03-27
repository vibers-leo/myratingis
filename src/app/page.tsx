"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChefHat, Star, ArrowRight, Sparkles, Users, BarChart3 } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen bg-chef-bg text-chef-text overflow-hidden flex flex-col">
      {/* Background — Dark mode texture */}
      <div className="absolute inset-0 z-0 hidden dark:block bg-[url('/dark-texture-bg.jpg')] bg-cover bg-center bg-fixed">
        <div className="absolute inset-0 bg-[#050505]/90" />
      </div>

      {/* Ambient glow — Desktop only */}
      <div className="hidden md:block absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-orange-600/[0.04] rounded-full blur-[150px]" />
      <div className="hidden md:block absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px]" />

      {/* Hero Section */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center pt-28 md:pt-20 pb-16">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 flex flex-col items-center text-center">

          {/* Badge */}
          <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-chef-border bg-chef-panel/60 backdrop-blur-md double-bezel">
            <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-500/90">
              전문 평가 플랫폼
            </span>
          </div>

          {/* Logo */}
          <div className="mb-8">
            {theme === "dark" ? (
              <Image
                src="/logo-white.png"
                alt="제 평가는요?"
                width={480}
                height={192}
                priority
                className="h-16 md:h-22 lg:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              />
            ) : (
              <Image
                src="/myratingis-logo.png"
                alt="제 평가는요?"
                width={480}
                height={192}
                priority
                className="h-16 md:h-22 lg:h-28 w-auto object-contain brightness-0"
              />
            )}
          </div>

          {/* Subtitle */}
          <p className="text-sm md:text-base lg:text-lg text-chef-text/50 font-medium max-w-xl mx-auto leading-relaxed px-4 break-keep mb-10">
            전문평가위원과 잠재고객의 날카로운 시선으로
            <br className="hidden md:block" />
            여러분의 프로젝트가 가진 진짜 가치를 증명해 드립니다.
          </p>

          {/* Cloche Illustration */}
          <div className="relative w-44 h-44 md:w-56 md:h-56 lg:w-72 lg:h-72 mb-12">
            <Image
              src="/review/cloche-cover.png"
              alt="Cloche"
              width={320}
              height={320}
              sizes="(max-width: 768px) 176px, (max-width: 1024px) 224px, 288px"
              className="w-full h-full object-contain filter drop-shadow-[0_12px_40px_rgba(234,88,12,0.18)]"
              priority
            />
          </div>

          {/* CTA Buttons — Premium */}
          <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-4 mb-8">
            <Button
              onClick={() => router.push("/project/upload")}
              className="w-full h-14 md:h-16 cta-premium text-white text-lg md:text-xl font-black flex items-center justify-center gap-2.5 border-none rounded-xl italic uppercase tracking-wide"
            >
              <ChefHat className="w-5 h-5 md:w-6 md:h-6" />
              평가 의뢰하기
            </Button>
            <Button
              onClick={() => router.push("/projects")}
              className="w-full h-14 md:h-16 bg-chef-text hover:opacity-90 text-chef-bg text-lg md:text-xl font-black flex items-center justify-center gap-2.5 bevel-cta border-none rounded-xl italic uppercase tracking-wide"
            >
              <Star className="w-5 h-5 md:w-6 md:h-6" />
              평가 참여하기
            </Button>
          </div>

          {/* Secondary Links */}
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-chef-text/20 pt-4">
            <Link href="/about/features" className="hover:text-orange-500 transition-colors">
              서비스 소개
            </Link>
            <Link href="/faq" className="hover:text-orange-500 transition-colors">
              고객 지원 · FAQ
            </Link>
          </div>
        </div>
      </main>

      {/* Value Proposition Strip */}
      <section className="relative z-10 w-full border-t border-chef-border bg-chef-panel/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Sparkles,
                title: "6가지 전문 평가 지표",
                desc: "기획력부터 심미성까지, 다면 평가로 프로젝트의 진짜 가치를 수치화합니다.",
              },
              {
                icon: Users,
                title: "비회원도 즉시 참여",
                desc: "링크 하나로 누구나 평가에 참여할 수 있어, 더 넓은 피드백을 받을 수 있습니다.",
              },
              {
                icon: BarChart3,
                title: "데이터 기반 리포트",
                desc: "수집된 평가를 자동으로 분석하여, 실행 가능한 인사이트를 제공합니다.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="double-bezel rounded-xl bg-chef-card p-6 md:p-8 flex flex-col gap-4 group hover:border-orange-500/20"
              >
                <div className="w-11 h-11 rounded-lg bg-orange-600/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-lg font-black text-chef-text tracking-tight break-keep">
                  {item.title}
                </h3>
                <p className="text-sm text-chef-text/50 font-medium leading-relaxed break-keep">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom micro-CTA */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/about/features"
              className="inline-flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest hover:gap-3 transition-all"
            >
              모든 기능 살펴보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
