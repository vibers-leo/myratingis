"use client";

import React, { useState } from "react";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { motion } from "framer-motion";
import { 
  Zap, 
  ChefHat, 
  Star, 
  Target, 
  BarChart3, 
  Share2, 
  Layers, 
  Fingerprint,
  ChevronRight,
  ArrowRight,
  Hand
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MichelinRating } from "@/components/MichelinRating";
import { FeedbackPoll } from "@/components/FeedbackPoll";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faLock } from "@fortawesome/free-solid-svg-icons";

function InteractivePreview() {
   const [activeTab, setActiveTab] = useState<'rating'|'poll'|'proposal'>('rating');

   return (
      <div className="max-w-5xl mx-auto my-32 px-6">
         <div className="text-center mb-16 space-y-4">
            <span className="px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-widest inline-block">체험하기</span>
            <h2 className="text-3xl md:text-5xl font-black text-chef-text tracking-tighter italic uppercase">
               피드백 도구 <span className="text-orange-500">미리보기</span>
            </h2>
            <p className="text-chef-text opacity-50 max-w-lg mx-auto">실제 프로젝트에 적용될 피드백 기능들을 직접 체험해보세요.</p>
         </div>

         <div className="bg-chef-card rounded-xl shadow-2xl border border-chef-border/50 overflow-hidden dark:border-slate-800">
            {/* Tabs */}
            <div className="flex border-b border-chef-border/10 overflow-x-auto scrollbar-hide bg-gray-50/50 dark:bg-slate-900/50">
               {[
                  { id: 'rating', label: '미슐랭 평점 ⭐️', desc: '전문적인 다면 평가' },
                  { id: 'poll', label: '스티커 투표 🗳️', desc: '직관적인 반응 수집' },
                  { id: 'proposal', label: '종합 평가 📝', desc: '상세한 피드백 작성' },
               ].map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex-1 min-w-[140px] py-8 px-4 text-center transition-all relative group ${
                        activeTab === tab.id 
                           ? 'bg-chef-card text-chef-text' 
                           : 'hover:bg-chef-card/50 text-chef-text opacity-40 hover:opacity-80'
                     }`}
                  >
                     <div className={`text-lg font-black mb-1.5 italic uppercase ${activeTab === tab.id ? 'text-orange-500' : 'text-chef-text'}`}>
                        {tab.label}
                     </div>
                     <div className="text-[10px] font-bold tracking-widest uppercase opacity-60">{tab.desc}</div>
                     {activeTab === tab.id && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>}
                  </button>
               ))}
            </div>

            {/* Content Area */}
            <div className="p-8 md:p-16 bg-chef-bg min-h-[500px] flex items-center justify-center relative">
               <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
               
               {activeTab === 'rating' && (
                  <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center gap-6">
                     <div className="w-full bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800">
                        <MichelinRating projectId="demo" isDemo={true} />
                     </div>
                     <p className="text-center text-xs text-chef-text opacity-40 font-mono text-[10px] tracking-widest uppercase">* 체험 모드: 데이터는 저장되지 않습니다 (Demo)</p>
                  </div>
               )}
               {activeTab === 'poll' && (
                  <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 transform scale-110 origin-center my-10">
                     <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800">
                        <FeedbackPoll 
                           projectId="demo" 
                           initialCounts={{ launch: 120, research: 45, more: 12 }} 
                           isDemo={true} 
                        />
                     </div>
                     <div className="text-center bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                        <p className="font-black text-orange-900 dark:text-orange-400 mb-2 uppercase text-xs tracking-widest">💡 인사이트 분석 (Insight Analysis)</p>
                        <p className="text-sm text-chef-text opacity-70 leading-relaxed font-medium">
                           "당장 쓸게요!"가 압도적으로 많습니다.<br/>
                           <span className="text-orange-600 dark:text-orange-400 font-bold underline decoration-2 underline-offset-2">출시(Launch)</span>를 최우선으로 고려하세요.
                        </p>
                     </div>
                  </div>
               )}
               {activeTab === 'proposal' && (
                  <div className="w-full max-w-lg text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="bg-white dark:bg-slate-900 p-10 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-pink-500"></div>
                        <div className="mb-8 w-20 h-20 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto text-3xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                           💌
                        </div>
                        <h3 className="text-2xl font-black text-chef-text mb-3 italic uppercase tracking-tight">종합 평가 의견</h3>
                        <p className="text-chef-text opacity-50 mb-8 text-sm leading-relaxed">
                           단순한 별점을 넘어선,<br/>
                           전문가의 시선이 담긴 <span className="font-bold text-orange-600 dark:text-orange-400">심도 있는 종합 평가</span>를 작성합니다.
                        </p>
                        
                        <div className="space-y-3">
                           <input disabled placeholder="한 줄 총평 (Demo)" className="w-full px-4 py-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-sm cursor-not-allowed opacity-60 font-medium" />
                           <textarea disabled placeholder="상세 평가 의견을 작성해주세요..." rows={3} className="w-full px-4 py-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-sm cursor-not-allowed opacity-60 resize-none font-medium" />
                           <Button onClick={() => toast.success("[데모] 평가가 제출되었습니다!")} className="w-full h-14 rounded-xl bg-chef-text text-chef-bg font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                               평가 제출하기
                           </Button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

export default function FeaturesPage() {
  const router = useRouter();

  const features = [
    {
      id: "expert-audit",
      icon: Star,
      title: "전문가 검증 리포트",
      tag: "Professional Grade",
      desc: "전문가의 시각으로 프로젝트를 정밀 분석합니다. 기획력, 독창성, 심미성 등 6가지 핵심 지표를 통해 당신의 작업물이 가진 진정한 가치를 정량화하여 제공합니다.",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      id: "guest-flow",
      icon: ChefHat,
      title: "장벽 없는 비회원 평가",
      tag: "Zero Barrier",
      desc: "평가 참여의 허들을 완전히 제거했습니다. 링크를 받은 누구나 가입 절차 없이 즉시 평가를 시작할 수 있으며, 고유의 식별 기술을 통해 중복 참여를 방지합니다.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      id: "data-merging",
      icon: Fingerprint,
      title: "스마트 데이터 통합",
      tag: "Continuity",
      desc: "비회원 시절의 모든 활동 데이터는 소중히 보관됩니다. 추후 가입하거나 로그인하는 즉시, 과거의 평가 기록들이 새 계정으로 자동 통합되어 나만의 인사이트 자산이 됩니다.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      id: "sticker-poll",
      icon: Target,
      title: "인터랙티브 스티커 판정",
      tag: "Real Reaction",
      desc: "단순한 별점을 넘어선 직관적인 반응 수집 도구입니다. 커스텀 스티커를 통해 프로젝트에 대한 시장의 즉각적이고 리얼한 반응을 한눈에 확인할 수 있습니다.",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 selection:bg-orange-500/30 transition-colors duration-300">
      <main className="pt-32 pb-32">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 mb-32">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10"
                >
                   <Zap className="text-orange-500 w-4 h-4" />
                   <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest italic">서비스 비전</span>
                </motion.div>
                
                <motion.h1 
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase leading-[0.9]"
                >
                  평가의 기준을 <br/> <span className="text-orange-500">다시 쓰다</span>
                </motion.h1>

                <motion.p 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                   className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-lg leading-relaxed"
                >
                  제 평가는요?는 크리에이터의 성장을 위한 마침표를 찍습니다. 
                  단순한 피드백을 넘어, 데이터 기반의 정밀 분석과 
                  매끄러운 사용자 경험을 결합한 혁신적인 평가 솔루션입니다.
                </motion.p>

                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 }}
                   className="flex gap-4 pt-4"
                >
                   <Button onClick={() => router.push('/project/upload')} className="h-16 px-10 min-w-[280px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg shadow-2xl shadow-orange-600/30 gap-3 group transition-all hover:scale-105 active:scale-95">
                      평가 의뢰하기 <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                   </Button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4, type: "spring" }}
                className="relative aspect-square md:aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 rotate-2 hover:rotate-0 transition-all duration-700"
              >
                 <Image 
                   src="/review/a1.jpeg" 
                   alt="Feature Hero" 
                   fill
                   priority
                   className="object-cover brightness-90 grayscale hover:grayscale-0 transition-all duration-700 scale-105 hover:scale-100 placeholder-image" 
                   sizes="(max-width: 768px) 100vw, 50vw"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                 
                 <div className="absolute bottom-8 left-8 text-white">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">추천 프로젝트</p>
                    <p className="text-3xl font-black italic">차세대 디자인</p>
                 </div>
              </motion.div>
           </div>
        </div>

        {/* Feature Grid Section */}
        <div className="bg-gray-50 dark:bg-slate-900/50 py-32 border-y border-gray-100 dark:border-slate-800/50">
           <div className="max-w-7xl mx-auto px-6">
              <div className="mb-20 space-y-4">
                 <h2 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] italic">핵심 기능</h2>
                 <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">혁신적인 기능으로 <br/> 가치를 증명합니다</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {features.map((f, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
                     className="bg-white dark:bg-slate-900 p-10 rounded-xl space-y-6 hover:shadow-xl transition-all hover:-translate-y-2 border border-gray-100 dark:border-slate-800 hover:border-orange-500/20"
                   >
                      <div className={`w-14 h-14 ${f.bgColor} ${f.color} rounded-2xl flex items-center justify-center`}>
                         <f.icon className="w-7 h-7" />
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <span className="text-[10px] font-black text-orange-500 opacity-80 uppercase tracking-widest">{f.tag}</span>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic break-keep">{f.title}</h3>
                         </div>
                         <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                            {f.desc}
                         </p>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>

        {/* Moved Interactive Preview Section Here */}
        <InteractivePreview />

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto px-6 mt-40">
           <div className="text-center space-y-10">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase leading-[0.9]">
                지금 당신의 <br/> <span className="text-orange-500">가치</span>를 증명하세요
              </h2>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto">
                더 이상 수동적인 업로드에 그치지 마세요. 
                전문가의 진단과 리얼한 시장 반응을 통해 다음 단계로 도약하세요.
              </p>
              <div className="flex justify-center pt-8">
                  <Button onClick={() => router.push('/signup')} className="h-20 px-16 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white dark:hover:text-white font-black text-xl shadow-2xl gap-4 transition-all hover:scale-105 active:scale-95 group">
                    무료로 시작하기 <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
