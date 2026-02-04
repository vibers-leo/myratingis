"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Star, Info, Target, Zap, Lightbulb, TrendingUp, Sparkles, MessageSquareQuote } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';

export interface MichelinRatingRef {
  submit: () => Promise<boolean>;
  isValid: () => boolean;
}

interface MichelinRatingProps {
  projectId: string;
  ratingId?: string; 
  isDemo?: boolean; 
  activeCategoryIndex?: number;
  guestId?: string;
  onChange?: (scores: Record<string, number>) => void;
}

const DEFAULT_CATEGORIES = [
  { id: 'score_1', label: '기획력', icon: Lightbulb, color: '#f59e0b', desc: '논리적 구조와 의도', sticker: '/review/s1.png' },
  { id: 'score_2', label: '독창성', icon: Target, color: '#10b981', desc: '차별화된 컨셉', sticker: '/review/s3.png' }, // Swapped to match hexagonal flow better
  { id: 'score_3', label: '심미성', icon: Sparkles, color: '#8b5cf6', desc: '시각적 아름다움', sticker: '/review/s2.png' },
  { id: 'score_4', label: '완성도', icon: Zap, color: '#3b82f6', desc: '구현 품질과 마감', sticker: '/review/s2.png' },
  { id: 'score_5', label: '상업성', icon: TrendingUp, color: '#ef4444', desc: '시장 경쟁력', sticker: '/review/s4.png' },
  { id: 'score_6', label: '편의성', icon: Info, color: '#ec4899', desc: '사용자 경험', sticker: '/review/s1.png' },
];

const ICON_MAP: Record<string, any> = {
  Lightbulb, Zap, Target, TrendingUp, Star, Info, Sparkles, MessageSquareQuote
};

export const MichelinRating = React.forwardRef<MichelinRatingRef, MichelinRatingProps>(
  ({ projectId, ratingId, isDemo = false, activeCategoryIndex, guestId, onChange }, ref) => {
  const { user } = useAuth();
  const [projectData, setProjectData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [averages, setAverages] = useState<Record<string, number>>({});
  const [totalAvg, setTotalAvg] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const currentTotalAvg = useMemo(() => {
    const activeScores = Object.values(scores);
    if (activeScores.length === 0) return 0;
    const sum = activeScores.reduce((a, b) => a + b, 0);
    return Number((sum / activeScores.length).toFixed(1));
  }, [scores]);

  useEffect(() => {
    if (onChange) onChange(scores);
  }, [scores, onChange]);

  const fetchRatingData = async () => {
    if (isDemo) return;
    try {
      const headers: any = {};
      if (user) headers['X-Firebase-UID'] = user.uid;
      
      let url = `/api/projects/${projectId}/rating`;
      if (guestId) url += `?guest_id=${guestId}`;

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (data.success && data.project) {
        setProjectData(data.project);
        
        let rawCustom = data.project.custom_data;
        if (typeof rawCustom === 'string') {
          try { rawCustom = JSON.parse(rawCustom); } catch (e) { rawCustom = {}; }
        }
        
        // 1. Robust Category Search (Checking all potential paths)
        const customCategories = 
            rawCustom?.audit_config?.categories || 
            rawCustom?.categories || 
            rawCustom?.custom_categories || 
            data.project.categories; 
        
        if (customCategories && Array.isArray(customCategories) && customCategories.length > 0) {
          console.log(`[MichelinRating] Loaded ${customCategories.length} custom categories`);
          const custom = customCategories.map((c: any, idx: number) => ({
            id: c.id || `score_${idx + 1}`,
            label: c.label || c.name || `지표 ${idx + 1}`,
            icon: ICON_MAP[c.icon] || Target,
            color: c.color || DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].color,
            desc: c.desc || c.description || '',
            sticker: c.sticker || DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].sticker
          }));
          setCategories(custom);
          
          const initialScores: Record<string, number> = {};
          custom.forEach((c: any) => {
            // Default to 3 (middle value) for better UX, unless user has already rated
            initialScores[c.id] = data.myRating ? Number(data.myRating[c.id] || 3) : 3;
          });
          setScores(initialScores);
        } else {
          console.log(`[MichelinRating] Using Default Categories (4 items)`);
          setCategories(DEFAULT_CATEGORIES);
          const initial: Record<string, number> = {};
          DEFAULT_CATEGORIES.forEach(c => {
             // Default to 3 (middle value) for better UX, unless user has already rated
             initial[c.id] = data.myRating ? Number(data.myRating[c.id] || 3) : 3;
          });
          setScores(initial);
        }
        
        setAverages(data.averages || {});
        setTotalAvg(data.totalAvg || 0);
        setTotalCount(data.totalCount || 0);

        if (ratingId) {
          const { data: specificRating, error: sError } = await (supabase as any)
            .from('ProjectRating')
            .select('*')
            .eq('id', Number(ratingId))
            .single();
          
          if (!sError && specificRating) {
            const updatedScores: Record<string, number> = {};
            const cats = (customCategories && Array.isArray(customCategories)) ? customCategories : DEFAULT_CATEGORIES;
            cats.forEach((c: any) => {
               updatedScores[c.id] = Number(specificRating[c.id] || 3);
            });
            setScores(updatedScores);
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      console.error("[MichelinRating] Failed to load ratings:", e);
    }
  };

  useEffect(() => {
    if (projectId) {
        fetchRatingData();
    }
    else if (isDemo) {
        const initial: Record<string, number> = {};
        DEFAULT_CATEGORIES.forEach(c => initial[c.id] = 3);
        setScores(initial);
    }
  }, [projectId, guestId, user]);

  const isAllRated = () => {
    return categories.every(cat => (scores[cat.id] || 0) > 0);
  };

  const handleRatingSubmit = async (): Promise<boolean> => {
    if (!isAllRated()) {
        toast.error("아직 평가하지 않은 항목이 있습니다.", {
            description: "차트의 점을 드래그하거나 슬라이더를 조절하여 점수를 매겨주세요!"
        });
        return false;
    }
    return true;
  };

  React.useImperativeHandle(ref, () => ({
    submit: handleRatingSubmit,
    isValid: isAllRated
  }));

  const CHART_SIZE = 400; 
  const CENTER = CHART_SIZE / 2;
  const RADIUS = 140; 
  
  const valueToPoint = (val: number, index: number, total: number) => {
      const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
      const INNER_RADIUS = 12; 
      const r = INNER_RADIUS + (val / 5) * (RADIUS - INNER_RADIUS);
      return {
          x: CENTER + r * Math.cos(angle),
          y: CENTER + r * Math.sin(angle)
      };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault();
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = CHART_SIZE / rect.width;
      const scaleY = CHART_SIZE / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      
      const vX = mouseX - CENTER;
      const vY = mouseY - CENTER;
      const mouseAngle = Math.atan2(vY, vX);
      
      let normalizedAngle = (mouseAngle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      
      let closestIdx = 0;
      let minDiff = Infinity;
      
      categories.forEach((_, i) => {
          const axisAngle = (Math.PI * 2 * i) / categories.length;
          let diff = Math.abs(normalizedAngle - axisAngle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < minDiff) {
              minDiff = diff;
              closestIdx = i;
          }
      });

      const targetId = categories[closestIdx].id;
      setDraggingCategory(targetId);
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      handlePointerMove(e, targetId); 
  };

  const handlePointerMove = (e: React.PointerEvent<Element>, categoryId?: string) => {
      const targetId = categoryId || draggingCategory;
      if (!targetId || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = CHART_SIZE / rect.width;
      const scaleY = CHART_SIZE / rect.height;
      
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const index = categories.findIndex(c => c.id === targetId);
      if (index === -1) return;

      const angle = (Math.PI * 2 * index) / categories.length - Math.PI / 2;
      const axisX = Math.cos(angle);
      const axisY = Math.sin(angle);
      
      const vX = mouseX - CENTER;
      const vY = mouseY - CENTER;
      
      let projLen = vX * axisX + vY * axisY;
      
      const INNER_RADIUS = 12;
      let rawScore = ((projLen - INNER_RADIUS) / (RADIUS - INNER_RADIUS)) * 5;
      
      if (rawScore > 5) rawScore = 5;
      if (rawScore < 0) rawScore = 0;
      
      setScores(prev => ({ ...prev, [targetId]: Number(rawScore.toFixed(1)) }));
      setIsEditing(true);
  };

  const handlePointerUp = (e: React.PointerEvent<Element>) => {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      setDraggingCategory(null);
  };

  const getPolygonPoints = (scale: number) => { 
      const val = scale * 5;
      return categories.map((_, i) => {
          const p = valueToPoint(val, i, categories.length);
          return `${p.x},${p.y}`;
      }).join(" ");
  };

  const myPoints = categories.map((c, i) => {
      const p = valueToPoint(scores[c.id] || 0, i, categories.length);
      return `${p.x},${p.y}`;
  }).join(" ");

  const avgPoints = categories.map((c, i) => {
      const p = valueToPoint(averages[c.id] || 0, i, categories.length);
      return `${p.x},${p.y}`;
  }).join(" ");
  
  const axes = categories.map((c, i) => {
      const INNER_RADIUS = 12;
      const start = {
          x: CENTER + INNER_RADIUS * Math.cos((Math.PI * 2 * i) / categories.length - Math.PI / 2),
          y: CENTER + INNER_RADIUS * Math.sin((Math.PI * 2 * i) / categories.length - Math.PI / 2)
      };
      const end = valueToPoint(5, i, categories.length);
      return (
          <line 
            key={c.id} 
            x1={start.x} 
            y1={start.y} 
            x2={end.x} 
            y2={end.y} 
            stroke="#e5e5e5" 
            strokeWidth="1" 
            strokeDasharray="4 4" 
          />
      );
  });

  const handles = categories.map((c, i) => {
      const p = valueToPoint(scores[c.id] || 0, i, categories.length);
      const isActive = draggingCategory === c.id;
      
      return (
          <g key={c.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={40} 
                fill="transparent"
                className="cursor-pointer touch-none"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 10 : 6}
                fill={c.color || '#f59e0b'}
                stroke="white"
                strokeWidth={isActive ? 3 : 2}
                className={cn("pointer-events-none transition-all duration-150 ease-out", isActive && "filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]")}
              />
              {isActive && (
                <circle
                   cx={p.x}
                   cy={p.y}
                   r={18}
                   fill="none"
                   stroke={c.color || '#f59e0b'}
                   strokeWidth={1}
                   strokeDasharray="4 2"
                   className="animate-spin-slow pointer-events-none"
                />
              )}
             {(() => {
                const labelPos = valueToPoint(6.2, i, categories.length);
                return (
                    <text 
                        x={labelPos.x} 
                        y={labelPos.y} 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        className="text-[10px] sm:text-[11px] font-black fill-chef-text uppercase tracking-tighter opacity-70 pointer-events-none"
                    >
                        {c.label}
                    </text>
                );
             })()}
          </g>
      );
  });

  const activeCategory = typeof activeCategoryIndex === 'number' ? categories[activeCategoryIndex] : null;

  if (activeCategory) {
    return (
      <div className="w-full space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
         <div className="flex flex-col items-center gap-6">
           <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-chef-text text-chef-bg flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-500">
                 {activeCategory.sticker ? (
                   <Image src={activeCategory.sticker} alt={activeCategory.label} width={80} height={80} className="object-contain" />
                 ) : (
                   React.createElement(activeCategory.icon || Target, { className: "w-12 h-12" })
                 )}
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-chef-card rounded-full shadow-lg border border-chef-border flex items-center justify-center font-black text-chef-text">
                {activeCategoryIndex! + 1}
              </div>
           </div>
           <div className="text-center">
              <h4 className="text-3xl font-black text-chef-text uppercase tracking-tighter mb-2">{activeCategory.label}</h4>
              <p className="text-chef-text opacity-40 font-bold uppercase tracking-widest text-xs">{activeCategory.desc}</p>
           </div>
        </div>

        <div className="bg-chef-card rounded-[3rem] p-10 border border-chef-border shadow-xl space-y-8">
            <div className="flex justify-between items-end relative">
               <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                     <Star key={i} className={cn("w-6 h-6 transition-all duration-300", (scores[activeCategory.id] || 0) >= i ? "text-amber-400 fill-current scale-110" : "text-chef-text opacity-5")} />
                  ))}
               </div>
               <div className="text-right">
                  <span className={cn("text-7xl font-black tabular-nums tracking-tighter transition-all", (scores[activeCategory.id] || 0) > 0 ? "opacity-100 scale-105" : "opacity-20")} style={{ color: activeCategory.color || '#f59e0b' }}>
                     {(scores[activeCategory.id] || 0).toFixed(1)}
                  </span>
                  <p className="text-[10px] font-black text-chef-text opacity-20 uppercase tracking-widest">Score / 5.0</p>
               </div>
            </div>

            <div className="relative h-12 flex items-center group/slider">
                <div className="absolute inset-x-0 h-4 bg-chef-panel border border-chef-border rounded-full overflow-hidden shadow-inner">
                   <div 
                     className="h-full transition-all duration-100 ease-out shadow-[0_0_20px_rgba(245,158,11,0.3)]" 
                     style={{ 
                       width: `${((scores[activeCategory.id] || 0) / 5) * 100}%`,
                       backgroundColor: activeCategory.color || '#f59e0b'
                     }} 
                   />
                </div>
               <input 
                  type="range" 
                  min="0" 
                  max="5" 
                  step="0.1" 
                  value={scores[activeCategory.id] || 0} 
                  onChange={(e) => { 
                    setScores(prev => ({ ...prev, [activeCategory.id]: parseFloat(e.target.value) })); 
                    setIsEditing(true); 
                  }} 
                  className="absolute inset-x-0 w-full h-12 appearance-none bg-transparent cursor-pointer z-20 michelin-slider" 
               />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden group">
      <div className="flex flex-col gap-12 items-center w-full min-h-[460px]">
        <div className="relative w-full max-w-[400px] aspect-square flex justify-center items-center py-10 select-none touch-none">
            {mounted ? (
                <svg 
                    ref={svgRef}
                    viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`} 
                    className="w-full h-full drop-shadow-xl overflow-visible"
                    onPointerDown={handlePointerDown}
                    onPointerMove={(e) => draggingCategory && handlePointerMove(e)}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <polygon points={getPolygonPoints(1.0)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <polygon points={getPolygonPoints(0.8)} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <polygon points={getPolygonPoints(0.6)} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <polygon points={getPolygonPoints(0.4)} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <polygon points={getPolygonPoints(0.2)} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    {axes}
                    {totalAvg > 0 && (
                        <polygon points={avgPoints} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.2} className="text-chef-text" />
                    )}
                    <polygon 
                        points={myPoints} 
                        fill="#f59e0b" 
                        fillOpacity={0.2} 
                        stroke="#f59e0b" 
                        strokeWidth={4}
                        className="transition-all duration-75"
                    />
                    {handles}
                </svg>
            ) : (
                <div className="w-full h-full bg-chef-panel/20 animate-pulse rounded-full" />
            )}
           
           <div className="absolute top-0 right-0 p-2 pointer-events-none">
              <div className="bg-chef-card/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-chef-border flex flex-col items-end transition-transform hover:scale-105">
                <span className="text-4xl font-black text-chef-text tabular-nums leading-none mb-1">{currentTotalAvg.toFixed(1)}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-3 h-3 ${currentTotalAvg >= i ? 'text-amber-400 fill-current' : 'text-chef-text opacity-10'}`} />
                  ))}
                </div>
              </div>
           </div>
        </div>
        
        <p className="text-chef-text opacity-40 font-bold uppercase tracking-widest text-[10px] animate-pulse">
            Tip: 차트의 꼭지점을 드래그하여 점수를 조정여보세요!
        </p>

        <div className="w-full space-y-8 max-w-lg">
          <div className="grid grid-cols-1 gap-8">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-3 group/item">
                <div className="flex justify-between items-end px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-chef-text text-chef-bg flex items-center justify-center shadow-lg transition-transform group-hover/item:scale-110">
                      {React.createElement(cat.icon || Target, { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <p className="text-sm font-black text-chef-text uppercase tracking-tight">{cat.label}</p>
                      <p className="text-[10px] text-chef-text opacity-40 font-bold uppercase">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: cat.color || '#f59e0b' }}>
                      {(scores[cat.id] || 0) > 0 ? (scores[cat.id] || 0).toFixed(1) : "0.0"}
                    </span>
                    <p className="text-[8px] font-black text-chef-text opacity-20 uppercase tracking-widest">Score</p>
                  </div>
                </div>
                
                  <div className="relative h-6 flex items-center group/slider-box">
                    <div className="absolute inset-x-0 h-2 bg-chef-panel border border-chef-border rounded-full shadow-inner overflow-hidden">
                      <div 
                        className="h-full transition-all duration-100 ease-out opacity-60" 
                        style={{ 
                          width: `${((scores[cat.id] || 0) / 5) * 100}%`,
                          backgroundColor: cat.color || '#f59e0b'
                        }} 
                      />
                    </div>
                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none items-center">
                      {[0, 1, 2, 3, 4, 5].map(v => (
                        <div key={v} className={cn("w-[2px] h-2 transition-colors", (scores[cat.id] || 0) >= v ? "bg-white/40" : "bg-chef-text/10")} />
                      ))}
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="5" 
                      step="0.1" 
                      value={scores[cat.id] || 0} 
                      onChange={(e) => { 
                        setScores(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) })); 
                        setIsEditing(true); 
                      }} 
                      className="w-full h-4 appearance-none bg-transparent cursor-pointer z-10 michelin-slider-small" 
                    />
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium italic">
         <Info className="w-4 h-4 flex-shrink-0" />
         <p>평가 완료 시 작가에게 분석 레포트 데이터가 전달됩니다.</p>
      </div>
    </div>
  );
});

MichelinRating.displayName = 'MichelinRating';
