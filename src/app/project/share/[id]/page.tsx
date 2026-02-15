"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowRight, Share2, ChefHat } from 'lucide-react';
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ProjectSharePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/review/viewer?projectId=${projectId}`;
      setShareUrl(url);
    }
  }, [projectId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("평가 링크가 복사되었습니다!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/review/review-bg.jpeg')] bg-cover bg-center opacity-10 mix-blend-overlay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative z-10 w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 text-center space-y-10 shadow-2xl"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-xl mb-6">
            <Share2 size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            평가 의뢰가<br /><span className="text-orange-500">생성되었습니다</span>
          </h1>
          <p className="text-white/40 font-medium leading-relaxed">
            이제 아래 링크를 공유하여<br />
            전문가와 동료들에게 냉철한 평가를 요청해보세요.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-1 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center pl-6 pr-2 py-2 gap-4">
             <div className="flex-1 overflow-hidden">
               <p className="text-xs text-white/40 font-bold truncate text-left">{shareUrl}</p>
             </div>
             <Button 
               onClick={handleCopy}
               className="h-12 px-6 bevel-sm border-none bg-white text-black font-black hover:bg-gray-200 transition-colors"
             >
               {copied ? <Check size={18} /> : <Copy size={18} />}
             </Button>
          </div>
          <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
            Scan QR Code or Copy Link
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
           <Button 
             variant="outline" 
             onClick={() => router.push(`/report/${projectId}`)}
             className="h-16 bevel-section border-white/10 bg-transparent text-white hover:bg-white/5 font-bold"
           >
             결과 리포트 미리보기
           </Button>
           <Button 
             onClick={() => router.push(`/review/viewer?projectId=${projectId}`)}
             className="h-16 bevel-section bg-orange-600 hover:bg-orange-500 text-white font-black"
           >
             내 프로젝트 평가하기 <ArrowRight className="ml-2 w-4 h-4" />
           </Button>
        </div>
      </motion.div>

      <footer className="mt-12 text-white/20 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
        <ChefHat size={14} /> MyRatingIs Evaluation System
      </footer>
    </div>
  );
}
