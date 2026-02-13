"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { MyRatingIsHeader } from '@/components/MyRatingIsHeader';
import { ChefHat, Star, Eye, MessageSquare, Clock, ArrowRight, Sparkles, Heart, Bookmark, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { OptimizedImage } from '@/components/ui/optimized-image';
// Supabase Client (타입 체크 우회)
import { supabase } from '@/lib/supabase/client';

// Lazy loaded modals for performance
const InquiryModal = dynamic(() => import('@/components/InquiryModal').then(mod => mod.InquiryModal), { ssr: false });
const CollectionModal = dynamic(() => import('@/components/CollectionModal').then(mod => mod.CollectionModal), { ssr: false });

interface ProjectClientProps {
  initialProjects?: any[];
  initialTotal?: number;
}

export default function ProjectsClient({ initialProjects = [], initialTotal = 0 }: ProjectClientProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [projects, setProjects] = useState<any[]>(initialProjects);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Modals state
  const [inquiryModal, setInquiryModal] = useState<{open: boolean, project: any}>({ open: false, project: { title: "", user_id: "" } });
  const [collectionModal, setCollectionModal] = useState<{open: boolean, project: any}>({ open: false, project: { title: "" } });

  useEffect(() => {
    fetchProjects();
  }, [user, activeFilter]); 

  const fetchProjects = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch Projects Base Data from Supabase
      const { data: rawProjects, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('visibility', 'public')
        .limit(50);

      if (error) throw error;
      if (!rawProjects) {
        setProjects([]);
        return;
      }

      // 2. Filter & Parallel Process Enrichment
      const enrichedProjects = await Promise.all(rawProjects.map(async (data: any) => {
          // Initial Check
          const isAudit = data.custom_data?.audit_config || data.audit_deadline || data.type === 'audit';
          if (!isAudit) return null;

          // Determine Rating Count (Supabase에서는 이미 트리거로 관리됨)
          let realRatingCount = data.evaluations_count || 0;

          // User Interaction (Parallel)
          let isLiked = false;
          let hasRated = false;

          if (user) {
              try {
                  const [likeResult, evalResult] = await Promise.all([
                      // 좋아요 여부 확인
                      (supabase as any)
                        .from('project_likes')
                        .select('id')
                        .eq('project_id', data.id)
                        .eq('user_id', user.id)
                        .single(),
                      // 평가 여부 확인
                      (supabase as any)
                        .from('evaluations')
                        .select('id')
                        .eq('project_id', data.id)
                        .eq('user_id', user.id)
                        .limit(1)
                        .single()
                  ]);

                  isLiked = !likeResult.error && !!likeResult.data;
                  hasRated = !evalResult.error && !!evalResult.data;
              } catch(e) {
                  // 에러 무시 (데이터 없을 수 있음)
              }
          }

          // View Count Correction (Wayo) - Supabase 버전
          if (data.title?.includes("와요") && ((data.views_count || 0) < 135)) {
              // Fire and forget update
              (supabase as any)
                .from('projects')
                .update({ views_count: 135 })
                .eq('id', data.id)
                .then(() => {})
                .catch(() => {});
              data.views_count = 135;
          }

          return {
              project_id: data.id,
              ...data,
              is_liked: isLiked,
              has_rated: hasRated,
              likes_count: data.likes_count || 0,
              views_count: data.views_count || 0,
              rating_count: realRatingCount,
              User: { username: data.author_email?.split('@')[0] || "Unknown" },
              createdAt: data.created_at ? new Date(data.created_at) : new Date()
          };
      }));

      // 3. Filter Nulls & Sort
      const validProjects = enrichedProjects.filter(p => p !== null);

      if (activeFilter === 'popular') {
          validProjects.sort((a, b) => (b.views_count + b.likes_count * 5) - (a.views_count + a.likes_count * 5));
      } else {
          // Default: Latest
          validProjects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      setProjects(validProjects);
    } catch (e) {
      console.error("Failed to fetch audit projects", e);
      toast.error("프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Social Actions
  const handleLike = async (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    if (!isAuthenticated || !user) {
        toast.error("로그인이 필요합니다.");
        return;
    }

    const originalLiked = project.is_liked;
    const originalCount = project.likes_count || 0;

    // Optimistic Update
    setProjects(prev => prev.map(p =>
        p.project_id === project.project_id
            ? { ...p, is_liked: !originalLiked, likes_count: originalLiked ? originalCount - 1 : originalCount + 1 }
            : p
    ));

    try {
        if (originalLiked) {
            // Unlike - Supabase에서 삭제
            const { error } = await (supabase as any)
              .from('project_likes')
              .delete()
              .eq('project_id', project.project_id)
              .eq('user_id', user.id);

            if (error) throw error;

            // 트리거가 자동으로 likes_count를 감소시킴
        } else {
            // Like - Supabase에 추가
            const { error } = await (supabase as any)
              .from('project_likes')
              .insert({
                project_id: project.project_id,
                user_id: user.id
              });

            if (error) throw error;

            // 트리거가 자동으로 likes_count를 증가시킴
        }

        // 성공 시 최신 데이터로 갱신 (선택적)
        fetchProjects(true);
    } catch (err) {
        console.error("Like error", err);
        // Revert
        setProjects(prev => prev.map(p =>
            p.project_id === project.project_id
                ? { ...p, is_liked: originalLiked, likes_count: originalCount }
                : p
        ));
        toast.error("요청 처리에 실패했습니다.");
    }
  };

  const handleBookmark = async (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    toast.info("북마크 기능은 준비 중입니다.");
  };

  const handleInquiry = async (e: React.MouseEvent, project: any) => {
     e.stopPropagation();
     toast.info("1:1 문의 기능은 준비 중입니다.");
  };

  const onCollectionSuccess = () => {
      // Placeholder
  };

  const handleProjectRoute = (p: any) => {
    if (p.has_rated) {
      router.push(`/report/${p.project_id}`);
    } else {
      router.push(`/review/viewer?projectId=${p.project_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-orange-600/10 border border-orange-600/20 rounded-full w-fit">
                 <ChefHat className="w-4 h-4 text-orange-600" />
                 <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Ongoing Audit Requests</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-chef-text tracking-tighter italic uppercase">
                평가 참여하기
              </h1>
              <p className="text-chef-text opacity-40 font-bold max-w-xl text-lg">
                도전하는 창작자들의 다양한 프로젝트를 만나보세요.<br />
                당신의 소중한 의견이 창작자에게 큰 힘이 됩니다.
              </p>
           </div>

           <div className="flex bg-chef-panel p-1 rounded-sm border border-chef-border">
              {['all', 'popular', 'latest'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    activeFilter === f ? "bg-chef-text text-chef-bg shadow-lg" : "text-chef-text opacity-30 hover:opacity-100"
                  )}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>

        {/* Auth Inducement Banner */}
        {!isAuthenticated && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 p-8 rounded-[2rem] bg-gradient-to-r from-orange-600 to-orange-500 text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <ChefHat size={120} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="text-center md:text-left space-y-2">
                  <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-2 justify-center md:justify-start">
                     <Sparkles className="w-6 h-6" /> Join the Kitchen
                  </h3>
                  <p className="text-white/80 font-bold">로그인하고 셰프가 되어 프로젝트를 평가해보세요. <br className="hidden md:block" />참여 시 다양한 리워드와 전문성 배지가 제공됩니다.</p>
               </div>
               <div className="flex gap-3">
                  <Button onClick={() => router.push('/login')} variant="secondary" className="h-14 px-8 rounded-2xl font-black bg-white text-orange-600 hover:bg-white/90">로그인하기</Button>
                  <Button onClick={() => router.push('/signup')} variant="outline" className="h-14 px-8 rounded-2xl font-black border-2 border-white text-white bg-transparent hover:bg-white/10">회원가입</Button>
               </div>
            </div>
          </motion.div>
        )}

        {/* Project Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length > 0 ? (
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {projects.map((p) => {
              const auditConfig = p.custom_data?.audit_config;
              const showCumulative = auditConfig?.is_public_results === true;

              return (
                <motion.div 
                  key={p.project_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 4 }}
                  className="group relative flex flex-col md:flex-row gap-8 bg-chef-card border border-chef-border p-6 md:p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                   {/* Left: Thumbnail Section */}
                   <div 
                     className="w-full md:w-80 aspect-video md:aspect-[16/10] rounded-3xl overflow-hidden bg-chef-panel shrink-0 border border-chef-border relative cursor-pointer group"
                     onClick={() => handleProjectRoute(p)}
                   >
                      {(() => {
                        const getSmartThumbnail = () => {
                            // 1. If explicit thumbnail exists and is not a placeholder
                            if (p.thumbnail_url && !p.thumbnail_url.includes('placeholder')) {
                                // Apply optimization proxy if it's a Supabase URL
                                if (p.thumbnail_url.includes('supabase.co/storage/v1/object/public')) {
                                    return `https://wsrv.nl/?url=${encodeURIComponent(p.thumbnail_url)}&w=800&q=80&output=webp`;
                                }
                                return p.thumbnail_url;
                            }
                            
                            // 2. If site_url or legacy mediaA exists, try to get OG image via microlink
                            const targetUrl = p.site_url || p.custom_data?.audit_config?.mediaA;
                            if (targetUrl && typeof targetUrl === 'string' && (targetUrl.startsWith('http') || targetUrl.includes('.'))) {
                                const finalUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
                                const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(finalUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
                                // Proxy Microlink too to ensure it's resized
                                return `https://wsrv.nl/?url=${encodeURIComponent(microlinkUrl)}&w=800&q=80&output=webp`;
                            }
                            
                            // 3. Fallback
                            return null;
                        };
                        const SmartThumb = getSmartThumbnail();
                        
                        return SmartThumb ? (
                        <OptimizedImage 
                          src={SmartThumb} 
                          alt={p.title} 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-105" 
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-chef-panel to-chef-card opacity-30">
                          <ChefHat className="w-12 h-12" />
                        </div>
                      );
                      })()}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                         <ArrowRight className="text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" size={32} />
                      </div>
                      
                      {p.has_rated && (
                        <div className="absolute top-3 left-3 px-3 py-1 bg-green-600/90 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest z-10">
                          Completed
                        </div>
                      )}
                   </div>

                   {/* Middle: Content Section */}
                   <div className="flex-1 flex flex-col justify-center min-w-0 py-2">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="px-3 py-1 bg-orange-600/10 text-orange-600 text-[8px] font-black uppercase tracking-widest rounded-full">{p.category_name || "New Project"}</span>
                         <span className="text-[10px] text-chef-text opacity-20 font-black italic">by {p.User?.username || "Unknown"}</span>
                      </div>
                      
                       <h3 
                        className="text-2xl md:text-3xl font-black text-chef-text tracking-tighter truncate mb-2 hover:text-orange-500 cursor-pointer transition-colors"
                        onClick={() => handleProjectRoute(p)}
                      >
                         {p.title}
                      </h3>
                      
                      <p className="text-sm md:text-md text-chef-text opacity-40 font-medium line-clamp-2 mb-6 leading-relaxed">
                         {p.summary || p.description || p.content_text?.substring(0, 100) + '...'}
                      </p>

                      <div className="flex items-center gap-6 mt-auto">
                        <div className="flex items-center gap-1.5 ">
                           <Eye className="w-3.5 h-3.5 text-chef-text opacity-20" />
                           <span className="text-[10px] font-black text-chef-text opacity-40 uppercase tracking-widest">Views {p.views_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                           <span className="text-[10px] font-black text-chef-text opacity-40 uppercase tracking-widest">Audits {p.rating_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                           <Clock className="w-3.5 h-3.5 text-chef-text opacity-20" />
                           <span className="text-[10px] font-black text-chef-text opacity-40 uppercase tracking-widest leading-none">
                            {p.audit_deadline 
                                ? (p.audit_deadline.toDate 
                                    ? p.audit_deadline.toDate().toLocaleDateString() 
                                    : new Date(p.audit_deadline).toLocaleDateString())
                                : "Ongoing"}
                           </span>
                        </div>
                      </div>
                   </div>

                   {/* Right: Actions Section */}
                   <div className="flex flex-col justify-center gap-3 shrink-0 pt-4 md:pt-0 md:border-l md:border-chef-border md:pl-8 md:w-56">
                      
                      {/* Social Actions (New) */}
                      <div className="flex items-center justify-center gap-2 mb-2">
                          <button 
                            onClick={(e) => handleLike(e, p)}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all",
                                p.is_liked 
                                    ? "bg-red-500/10 border-red-500 text-red-500 shadow-md" 
                                    : "bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100 hover:text-red-500 hover:border-red-500/30"
                            )}
                            title="좋아요"
                          >
                             <Heart size={18} fill={p.is_liked ? "currentColor" : "none"} />
                          </button>
                          <button 
                            onClick={(e) => handleBookmark(e, p)}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all",
                                p.is_bookmarked
                                    ? "bg-blue-500/10 border-blue-500 text-blue-500 shadow-md"
                                    : "bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100 hover:text-blue-500 hover:border-blue-500/30"
                            )}
                            title="컬렉션 저장"
                          >
                             <Bookmark size={18} fill={p.is_bookmarked ? "currentColor" : "none"} />
                          </button>
                          <button 
                            onClick={(e) => handleInquiry(e, p)}
                            className="w-10 h-10 rounded-full bg-chef-panel border border-chef-border flex items-center justify-center text-chef-text opacity-40 hover:opacity-100 hover:text-green-500 hover:border-green-500/30 transition-all"
                            title="1:1 문의"
                          >
                             <Send size={18} />
                          </button>
                      </div>

                      {p.has_rated && isAuthenticated ? (
                        <Button 
                          onClick={() => router.push(`/report/${p.project_id}`)}
                          className="h-14 rounded-2xl bevel-cta bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/10"
                        >
                          {showCumulative ? "평가 결과 리포트" : "내 평가 결과 보기"}
                        </Button>
                      ) : (
                          <Button 
                          onClick={() => {
                             router.push(`/review/viewer?projectId=${p.project_id}`);
                          }}
                          className="h-14 rounded-none bevel-cta bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-600/10"
                        >
                          평가 시작하기
                        </Button>
                      )}
                      
                      {((showCumulative && !p.has_rated) || (p.user_id === user?.id && !p.has_rated)) && (
                         <Button 
                           variant="outline" 
                           onClick={() => router.push(`/report/${p.project_id}`)}
                           className="h-12 rounded-2xl border-chef-border bg-chef-panel text-chef-text opacity-60 hover:opacity-100 font-bold text-[10px] uppercase tracking-widest transition-all"
                         >
                           {p.user_id === user?.id ? "내 프로젝트 통계" : "전체 평가 통계"}
                         </Button>
                      )}

                      {(!p.has_rated || !isAuthenticated) && (
                        <p className="text-[9px] text-center font-bold text-orange-600 opacity-40 uppercase tracking-tighter mt-1 animate-pulse">
                          의견이 필요합니다!
                        </p>
                      )}
                   </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 space-y-6 text-center">
             <div className="w-24 h-24 bg-chef-panel rounded-full flex items-center justify-center border border-chef-border animate-bounce">
                <ChefHat className="w-10 h-10 text-chef-text opacity-20" />
             </div>
             <div className="space-y-2">
                <h3 className="text-3xl font-black text-chef-text italic uppercase">No Audits Found</h3>
                <p className="text-chef-text opacity-40 font-bold">평가를 기다리는 프로젝트가 아직 없습니다. 직접 의뢰를 시작해 보세요.</p>
             </div>
             <Button 
               onClick={() => router.push('/project/upload')}
               className="bg-orange-600 hover:bg-orange-500 text-white font-black px-10 h-14 rounded-full shadow-2xl transition-all hover:scale-105"
             >
               평가 의뢰하기 <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
          </div>
        )}
      </main>


    </div>
  );
}
