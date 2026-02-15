"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { ChefHat, Star, Sparkles, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

function IntroContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  
  const [project, setProject] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (!projectId) {
      router.push('/');
      return;
    }

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('Project')
          .select('*')
          .eq('project_id', Number(projectId))
          .single();

        if (error) throw error;
        setProject(data);
        setIsDataLoaded(true);
      } catch (e) {
        console.error("Failed to load project", e);
        router.push('/');
      }
    };

    fetchProject();
  }, [projectId, router]);

  const handleStartReview = () => {
    setIsOpening(true);
    // Add a delay for the animation
    setTimeout(() => {
      router.push(`/review/viewer?projectId=${projectId}`);
    }, 1200);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/review/review-bg.jpeg')] bg-cover bg-center opacity-30 mix-blend-soft-light" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-transparent to-[#050505]" />
      </div>

      <AnimatePresence mode="wait">
        {!isOpening ? (
          <motion.div
            key="cloche-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full space-y-12"
          >
            {/* Project Info Header */}
            <div className="space-y-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mx-auto w-fit"
              >
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                  Mission: Expert Diagnostic
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-7xl font-black tracking-tighter"
              >
                제 평가는<span className="text-orange-500 italic">요?</span>
              </motion.h1>
              
              {isDataLoaded ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl md:text-3xl font-bold text-white/90 px-6">
                    "{project?.summary || "심사위원을 기다리는 새로운 창작물"}"
                  </h2>
                  <p className="text-[10px] md:text-xs text-white/20 max-w-lg mx-auto font-black uppercase tracking-[0.4em] italic">
                    Unknown Dish Under the Cloche
                  </p>
                </motion.div>
              ) : (
                <div className="h-20 flex items-center justify-center">
                   <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* The Cloche (Interactive Illustration) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.4, type: "spring" }}
              className="relative group cursor-pointer"
              onClick={isDataLoaded ? handleStartReview : undefined}
            >
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image 
                src="/review/cloche-cover.png" 
                alt="Cloche"
                width={384}
                height={384}
                className="w-64 h-64 md:w-96 md:h-96 object-contain filter drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10 transition-transform group-hover:-translate-y-4 duration-500"
                priority
              />
              
              {/* Floating Helper Text */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-black tracking-[0.4em] text-white/30 uppercase"
              >
                Click to Open Cloche
              </motion.div>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button 
                disabled={!isDataLoaded}
                onClick={handleStartReview}
                className="h-20 px-16 rounded-xl bg-white text-black hover:bg-orange-500 hover:text-white text-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 group"
              >
                <Rocket className="w-8 h-8 group-hover:animate-bounce" />
                평가 시작하기
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="cloche-animation"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center overflow-hidden"
          >
            {/* Cloche Lifting Animation */}
            <motion.div
              initial={{ y: 0, scale: 1 }}
              animate={{ y: -800, scale: 2, opacity: 0, rotate: -5 }}
              transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
            >
              <Image 
                src="/review/cloche-cover.png"
                alt="Cloche Animation"
                width={384}
                height={384}
                className="w-96 h-96 object-contain"
              />
            </motion.div>
            {/* Shockwave / Glow effect */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute w-64 h-64 bg-orange-500/30 rounded-full blur-[100px]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Icons */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden opacity-20">
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 60, ease: "linear" }} className="w-full h-full border border-white/5 rounded-full scale-150" />
         <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }} className="w-full h-full border border-white/5 rounded-full scale-125" />
      </div>
    </main>
  );
}

export default function IntroPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#050505] flex items-center justify-center"><ChefHat size={40} className="text-orange-500 animate-pulse" /></div>}>
      <IntroContent />
    </Suspense>
  );
}
