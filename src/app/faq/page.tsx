"use client";

import React from "react";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { motion } from "framer-motion";
import { 
  ChevronDown, 
  HelpCircle, 
  MessageCircle, 
  Globe, 
  UserPlus, 
  Zap, 
  ShieldCheck,
  Star
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function FAQPage() {
  const router = useRouter();

  const faqs = [
    {
      category: "서비스 이용",
      items: [
        {
          q: "비회원도 평가에 참여할 수 있나요?",
          a: "네! 제 평가는요?는 높은 접근성을 위해 공유된 링크를 통한 비회원 참여를 공식 지원합니다. 로그인 없이도 미슐랭 정밀 진단과 스티커 투표 등 모든 평가 기능을 이용하실 수 있습니다.",
          icon: Globe
        },
        {
          q: "비회원으로 평가했다가 나중에 가입하면 기록이 사라지나요?",
          a: "아니요! 시스템이 브라우저의 기록(Guest ID)을 자동으로 감지합니다. 동일한 브라우저에서 가입하거나 로그인하는 순간, 이전에 비회원으로 남겼던 모든 평가와 코멘트가 새 계정으로 즉시 통합됩니다.",
          icon: UserPlus
        },
        {
          q: "평가를 의뢰하려면 로그인이 꼭 필요한가요?",
          a: "네, 평가를 의뢰하시는 창작자 분은 프로젝트 관리와 리포트 확인을 위해 계정이 필요합니다. 의뢰된 프로젝트는 DB에 안전하게 저장되어 실시간으로 피드백을 수집하게 됩니다.",
          icon: Zap
        }
      ]
    },
    {
      category: "평가 시스템",
      items: [
        {
          q: "미슐랭 정밀 진단은 무엇인가요?",
          a: "기획력, 독창성, 심미성 등 프로젝트의 핵심 가치를 5점 척도로 평가하는 다면 분석 시스템입니다. 축적된 데이터는 시각화된 레이더 차트 리포트로 제공됩니다.",
          icon: Star
        },
        {
          q: "내 프로젝트를 외부에 공유해도 안전한가요?",
          a: "네, 모든 프로젝트는 암호화된 고유 ID를 통해 관리됩니다. 작성자는 언제든 프로젝트의 공개 여부를 설정할 수 있으며, 불필요한 노출을 제어할 수 있는 관리 도구를 제공합니다.",
          icon: ShieldCheck
        },
        {
          q: "평가 참여 시 혜택이 있나요?",
          a: "로그인 후 평가에 참여하시면 활동 포인트가 지급됩니다. 이 포인트는 추후 서비스 내 프리미엄 기능 이용이나 배지 획득 등에 사용될 예정입니다.",
          icon: Zap
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen chef-bg-page selection:bg-orange-500/30">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
         <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
            <HelpCircle className="w-[600px] h-[600px] text-chef-text" />
         </div>
      </div>

      <main className="max-w-4xl mx-auto px-2 md:px-6 pt-24 md:pt-32 relative z-10">
        <div className="text-center space-y-4 mb-10 md:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white rounded-full text-xs font-bold shadow-lg shadow-orange-500/20"
          >
            고객 안내
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-4xl font-bold text-chef-text leading-tight"
          >
            자주 묻는 질문
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-chef-text opacity-60 font-medium max-w-xl mx-auto"
          >
            질문이 있으신가요? 제 평가는요? 사용에 관한 가장 빈번한 질문들을 모았습니다. <br/>
            찾으시는 질문이 없다면 고객 지원으로 문의해주세요.
          </motion.p>
        </div>

        <div className="space-y-10 md:space-y-16">
          {faqs.map((category, idx) => (
            <motion.section 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-chef-text border-l-4 border-orange-500 pl-4 py-1">
                {category.category}
              </h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                {category.items.map((item, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`item-${idx}-${i}`} 
                    className="border-none bg-chef-card/30 backdrop-blur-sm px-3 md:px-6 rounded-2xl border border-chef-border/10 overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 md:py-6">
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-chef-panel rounded-xl flex items-center justify-center text-orange-500 shrink-0 border border-chef-border/50">
                           <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <span className="text-sm md:text-base font-bold text-chef-text tracking-tight group-hover:text-orange-500 transition-colors">
                          {item.q}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 pt-2 pl-10 md:pl-14">
                      <p className="text-sm text-chef-text opacity-70 font-medium leading-relaxed max-w-2xl whitespace-pre-wrap">
                        {item.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.section>
          ))}
        </div>

        {/* Footer CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-16 md:mt-32 p-6 md:p-12 bg-chef-text text-chef-bg rounded-2xl md:rounded-[3rem] text-center space-y-6 shadow-2xl"
        >
           <h3 className="text-xl md:text-2xl font-bold tracking-tight">더 궁금한 점이 있으신가요?</h3>
           <p className="text-chef-bg opacity-60 font-medium max-w-sm mx-auto">
              도움이 더 필요하신가요? 저희 팀이 영업일 기준 24시간 이내에 답변을 드립니다.
           </p>
           <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => router.push('/contact')} className="h-11 md:h-14 px-6 md:px-10 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm md:text-base transition-all scale-100 hover:scale-105 active:scale-95 shadow-xl shadow-orange-600/20">
                 1:1 문의하기
              </Button>
              <Button variant="outline" onClick={() => router.push('/about/features')} className="h-11 md:h-14 px-6 md:px-10 rounded-2xl border-chef-bg/20 text-chef-bg hover:bg-chef-bg/10 font-black text-sm md:text-base">
                 기능 살펴보기
              </Button>
           </div>
        </motion.div>
      </main>
    </div>
  );
}
