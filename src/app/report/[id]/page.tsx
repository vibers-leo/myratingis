"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Users, 
  Star, 
  MessageSquare, 
  Share2,
  ChefHat,
  Trophy,
  Rocket,
  Download,
  ChevronRight,
  Printer,
  FileText,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MyRatingIsHeader } from '@/components/MyRatingIsHeader';
// Remove unused constants if not used elsewhere, or keep them.
import { GENRE_CATEGORIES, FIELD_CATEGORIES } from '@/lib/constants';

import { useAuth } from "@/lib/auth/AuthContext";

// Pre-map labels for fast lookup
const ALL_LABELS: Record<string, string> = {};
[...GENRE_CATEGORIES, ...FIELD_CATEGORIES].forEach(c => {
    ALL_LABELS[c.id] = c.label;
    ALL_LABELS[c.id] = c.label;
});

const VOTE_LABEL_MAP: Record<string, string> = {
    'launch': '당장 계약하시죠! 탐나는 결과물',
    'invest': '좋긴 한데... 한 끗이 아쉽네요',
    'reboot': '기획부터 다시! 싹 갈아엎읍시다',
};

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth(); // Auth Info
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view');
  const [myRating, setMyRating] = useState<any>(null);

  useEffect(() => {
    if (ratings.length > 0 && user) {
        setMyRating(ratings.find((r: any) => r.user_uid === user.id || r.user_id === user.id));
    }
  }, [ratings, user]);

  const handleDownloadCSV = () => {
    if (!ratings || ratings.length === 0) return toast.error("다운로드할 데이터가 없습니다.");

    // CSV Header
    const headers = ["User", "Job", "Score", "Date", "Review Details"];
    
    // CSV Rows
    const rows = ratings.map(r => {
       const name = r.user_nickname || r.username || "Anonymous";
       const job = r.user_job || r.expertise?.[0] || "";
       const score = r.score || 0;
       const date = new Date(r.created_at).toLocaleDateString();
       const proposal = (r.proposal || "").replace(/"/g, '""'); // Escape quotes
       const answers = Object.entries(r.custom_answers || {})
           .map(([q, a]) => `${q}: ${a}`)
           .join(" | ")
           .replace(/"/g, '""');

       return `"${name}","${job}","${score}","${date}","Proposal: ${proposal} / Answers: ${answers}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${project?.title || 'project'}_evaluation_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
      window.print();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get auth session for API calls
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        // 1. Fetch detailed report via API (includes project + feedbacks)
        const reportRes = await fetch(`/api/projects/${projectId}/report`, { headers });
        const reportData = await reportRes.json();

        if (!reportRes.ok || !reportData.success) {
          // If 403 (access denied for private project), show access denied
          if (reportRes.status === 403) {
            const projectData = reportData.project || {};
            if (typeof projectData.custom_data === 'string') {
              try { projectData.custom_data = JSON.parse(projectData.custom_data); } catch (e) { projectData.custom_data = {}; }
            }
            setProject(projectData);
            setRatings([]);
            setLoading(false);
            return;
          }

          // Try fallback: fetch basic data from rating API
          const ratingRes = await fetch(`/api/projects/${projectId}/rating`, { headers });
          const ratingData = await ratingRes.json();
          if (ratingData.success && ratingData.project) {
            const pd = { ...ratingData.project };
            if (typeof pd.custom_data === 'string') {
              try { pd.custom_data = JSON.parse(pd.custom_data); } catch (e) { pd.custom_data = {}; }
            }
            setProject(pd);
          } else {
            toast.error("프로젝트를 찾을 수 없습니다.");
          }
          setRatings([]);
          setLoading(false);
          return;
        }

        // 2. Set project data
        const projectData = reportData.project || {};
        if (typeof projectData.custom_data === 'string') {
          try { projectData.custom_data = JSON.parse(projectData.custom_data); } catch (e) { projectData.custom_data = {}; }
        }
        setProject(projectData);

        // 3. Map feedbacks to ratings format
        const auditConfig = projectData.custom_data?.audit_config;
        const categories = auditConfig?.categories || [
          { id: 'score_1' }, { id: 'score_2' }, { id: 'score_3' },
          { id: 'score_4' }, { id: 'score_5' }, { id: 'score_6' }
        ];

        const feedbacks = reportData.report?.feedbacks || [];
        const fetchedRatings = feedbacks.map((f: any) => {
          // Reconstruct scores object from score_1..6
          const scores: Record<string, number> = {};
          categories.forEach((cat: any, idx: number) => {
            const val = Number(f[`score_${idx + 1}`]) || Number(f[cat.id]) || 0;
            scores[cat.id] = val;
          });

          const scoreValues = Object.values(scores).filter(v => v > 0);
          const calculatedScore = scoreValues.length > 0
            ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
            : (f.score || 0);

          return {
            id: f.id,
            user_uid: f.user_id,
            user_id: f.user_id,
            user_email: null,
            user_nickname: f.username,
            username: f.username,
            user_job: f.occupation || (f.expertise?.length > 0 ? f.expertise[0] : null),
            expertise: Array.isArray(f.expertise) ? f.expertise : [],
            occupation: f.occupation,
            age_group: f.age_group,
            gender: f.gender,
            scores,
            score: calculatedScore,
            vote_type: f.vote_type,
            proposal: f.proposal,
            custom_answers: f.custom_answers || {},
            created_at: f.created_at || new Date().toISOString(),
          };
        });

        console.log(`[ReportPage] Loaded ${fetchedRatings.length} evaluations from API.`);
        setRatings(fetchedRatings);

      } catch (err) {
        console.error("Fetch report error:", err);
        toast.error("데이터 로드 중 오류 발생");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Share Handler
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("리포트 링크가 복사되었습니다!");
  };

  const reportStats = useMemo(() => {
    if (!project) return null;

    // --- Access Control Logic ---
    // --- Access Control Logic ---
    const isOwner = user?.id && (
        user.id === project.user_id ||
        user.id === project.author_id ||
        user.id === project.author_uid ||
        user.id === project.userId
    );
    // Check 'result_visibility' in custom_data (Default to public if undefined)
    const resultVisibility = project.custom_data?.result_visibility || 'public';
    const isResultPublic = resultVisibility === 'public';

    // Check if current user has participated
    const myRating = ratings.find(r => r.user_uid === user?.id); 
    
    // Determine which ratings to show
    let targetRatings = ratings;
    let accessDenied = false;
    let isPersonalView = false;

    if (!isResultPublic && !isOwner) {
        if (myRating) {
            // Evaluator viewing Private Report -> Show ONLY their rating (Personal View)
            targetRatings = [myRating];
            isPersonalView = true;
        } else {
            // Unauthorized (Private Report, Not Owner, Not Evaluated)
            accessDenied = true;
        }
    }

    if (accessDenied) return { accessDenied: true };

    const auditConfig = project.custom_data?.audit_config;
    // Default 6 categories fallback
    const categories = auditConfig?.categories || [
      { id: 'score_1', label: '기획력' },
      { id: 'score_2', label: '독창성' },
      { id: 'score_3', label: '심미성' },
      { id: 'score_4', label: '완성도' },
      { id: 'score_5', label: '상업성' },
      { id: 'score_6', label: '편의성' },
    ];

    // Client-side Calculation with Robust Fallback
    const radarData = categories.map((cat: any, index: number) => {
      // 1. Calculate Average
      const sum = targetRatings.reduce((acc, curr) => {
          let val = 0;
          if (curr.scores?.[cat.id] !== undefined) val = curr.scores[cat.id];
          else if (curr[cat.id] !== undefined) val = curr[cat.id];
          
          if (val === 0 && curr.scores) {
              const values = Object.values(curr.scores);
              // Assuming values are numbers, try to grab by index
              if (values[index] !== undefined && typeof values[index] === 'number') {
                  val = values[index] as number;
              }
          }
          return acc + val;
      }, 0);

      const avg = targetRatings.length > 0 ? (sum / targetRatings.length).toFixed(1) : 0;
      
      // 2. Calculate My Score (if exists)
      let myVal = 0;
      if (myRating) {
          if (myRating.scores?.[cat.id] !== undefined) myVal = myRating.scores[cat.id];
          else if (myRating[cat.id] !== undefined) myVal = myRating[cat.id];
          if (myVal === 0 && myRating.scores) {
               const values = Object.values(myRating.scores);
               if (values[index] !== undefined && typeof values[index] === 'number') {
                   myVal = values[index] as number;
               }
          }
      }

      return {
        subject: cat.label,
        value: Number(avg),
        myValue: Number(myVal),
        fullMark: 5
      };
    });

    const stickerOptions = auditConfig?.poll?.options || [
        { id: 'launch', label: '출시 강추! 당장 계약하시죠!', color: '#10b981' },
        { id: 'more', label: '보류합니다. 한 끗이 아쉽네요', color: '#f59e0b' },
        { id: 'research', label: '다시 기획! 싹 갈아엎읍시다', color: '#ef4444' },
    ];
    
    const polls: Record<string, number> = {};
    // Collect all vote_type values from ratings for debugging
    const allVoteTypes: string[] = [];
    
    targetRatings.forEach(r => {
      if (r.vote_type) {
        allVoteTypes.push(r.vote_type);
        // Count votes by the exact vote_type value
        polls[r.vote_type] = (polls[r.vote_type] || 0) + 1;
      }
    });
    
    console.log("[ReportPage] All vote_type values:", allVoteTypes);
    console.log("[ReportPage] Vote counts:", polls);
    console.log("[ReportPage] Sticker options:", stickerOptions);

    // Determine My Vote
    let myVoteId: string | null = null;
    if (myRating && myRating.vote_type) {
        myVoteId = myRating.vote_type;
    }

    // Map votes to sticker options with multiple matching strategies
    const barData = stickerOptions.map((opt: any, index: number) => {
      let count = 0;
      
      // Strategy 1: Direct ID match
      if (polls[opt.id]) {
        count = polls[opt.id];
      }
      
      // Strategy 2: Label match (if someone stored label as vote_type)
      if (count === 0 && polls[opt.label]) {
        count = polls[opt.label];
      }
      
      // Strategy 3: Index-based fallback (poll_1, poll_2, poll_3 or legacy variations)
      if (count === 0) {
        const genericIds = [
          `poll_${index + 1}`,
          // Launch variations for index 0
          ...(index === 0 ? ['launch', 'so-good', 'approve', 'accept'] : []),
          // More/Hold variations for index 1
          ...(index === 1 ? ['more', 'good', 'hold', 'invest', 'pending'] : []),
          // Research/Reject variations for index 2
          ...(index === 2 ? ['research', 'bad', 'reject', 'develop', 'decline'] : []),
        ];
        
        for (const gid of genericIds) {
          if (polls[gid]) {
            count += polls[gid];
          }
        }
      }
      
      // Check if this option matches my vote
      const isMyChoice = myVoteId !== null && (
        myVoteId === opt.id || 
        myVoteId === opt.label ||
        (index === 0 && ['launch', 'so-good', 'poll_1', 'approve', 'accept'].includes(myVoteId)) ||
        (index === 1 && ['more', 'good', 'poll_2', 'hold', 'invest', 'pending'].includes(myVoteId)) ||
        (index === 2 && ['research', 'bad', 'poll_3', 'reject', 'develop', 'decline'].includes(myVoteId))
      );

      return {
        name: opt.label,
        value: count,
        color: opt.color || '#f59e0b',
        isMyChoice
      };
    });

    // Calculate Overall Average from all radar values
    const totalSum = radarData.reduce((acc: number, curr: any) => acc + curr.value, 0);
    const overallAvg = radarData.length > 0 ? (totalSum / radarData.length).toFixed(1) : "0.0";

    // Calculate Distributions
    const expertiseDistribution: Record<string, number> = {};
    const occupationDistribution: Record<string, number> = {};

    targetRatings.forEach(r => {
        const job = r.user_job || r.occupation || (r.expertise && r.expertise.length > 0 ? r.expertise[0] : null) || '미설정';
        expertiseDistribution[job] = (expertiseDistribution[job] || 0) + 1;
        if (r.user_job) occupationDistribution[r.user_job] = (occupationDistribution[r.user_job] || 0) + 1;
    });

    // Sort Ratings: My Rating Top
    const sortedRatings = [...targetRatings].sort((a, b) => {
        if (myRating && a.id === myRating.id) return -1;
        if (myRating && b.id === myRating.id) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const isComparisonAvailable = isResultPublic && !!myRating && targetRatings.length > 1;

    return { 
      radarData, 
      barData, 
      stickerOptions, 
      overallAvg, 
      participantCount: targetRatings.length,
      totalParticipantCount: ratings.length,
      categories,
      expertiseDistribution,
      occupationDistribution,
      accessDenied,
      isPersonalView,
      sortedRatings,
      isComparisonAvailable,
      isOwner,
      isResultPublic
    };
  }, [project, ratings, user]);
  
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTableRatings = useMemo(() => {
    if (!reportStats?.sortedRatings) return [];
    const data = [...reportStats.sortedRatings];
    if (sortConfig) {
      data.sort((a, b) => {
        let aValue: any = '', bValue: any = '';
        switch (sortConfig.key) {
           case 'no': // Sort by Date as a proxy for sequential ID
             aValue = new Date(a.created_at).getTime();
             bValue = new Date(b.created_at).getTime();
             break; 
           case 'info':
             aValue = a.user_nickname || 'Z'; 
             bValue = b.user_nickname || 'Z';
             break;
           case 'score':
             aValue = a.score || 0;
             bValue = b.score || 0;
             break;
           case 'specialty':
             const getExp = (r: any) => (r.expertise && r.expertise.length > 0 ? r.expertise.join('') : (r.user_job || ''));
             aValue = getExp(a);
             bValue = getExp(b);
             break;
           case 'date':
             aValue = new Date(a.created_at).getTime();
             bValue = new Date(b.created_at).getTime();
             break;
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [reportStats, sortConfig]);

  const currentTableData = sortedTableRatings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-foreground rounded-full animate-spin" /></div>;
  if (!project) return null;

  if (reportStats?.accessDenied) {
      return (
          <div className="min-h-screen bg-background text-foreground font-pretendard flex flex-col">
              <MyRatingIsHeader />
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-6 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Rocket className="w-8 h-8 text-muted-foreground/60" /> {/* Should be Lock icon really, using Rocket as placeholder or import Lock */}
                  </div>
                  <h1 className="text-3xl font-black">비공개 리포트입니다</h1>
                  <p className="text-muted-foreground max-w-sm leading-relaxed">
                      이 프로젝트의 평가 결과는 비공개로 설정되어 있습니다.<br/>
                      프로젝트 소유자이거나, 평가에 참여한 경우에만<br/>본인의 결과를 확인할 수 있습니다.
                  </p>
                  <Button onClick={() => router.push(`/review/viewer?projectId=${projectId}`)} className="h-14 px-8 rounded-lg bg-orange-600 hover:bg-orange-700 font-bold text-white uppercase tracking-widest mt-4">
                      평가 참여하기
                  </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-pretendard">
      <MyRatingIsHeader />

      <main className="max-w-7xl mx-auto px-2 md:px-6 pt-24 md:pt-32 pb-16 md:pb-24 space-y-12 md:space-y-20">
         {/* My Evaluation Section (Only in 'mine' view) */}
         {viewMode === 'mine' && (
            <motion.section 
                initial={{ y: -20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-4 md:p-8 rounded-xl border border-indigo-500/30 mb-12 relative overflow-hidden ring-1 ring-inset ring-white/10"
            >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                 
                 <div className="relative z-10">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                             <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 ring-1 ring-inset ring-indigo-500/40">
                                 <Users size={24} />
                             </div>
                             <div>
                                 <h2 className="text-xl md:text-2xl font-black text-foreground">나의 평가 리포트</h2>
                                 <p className="text-sm font-bold text-indigo-300 opacity-60">MY EVALUATION LOG</p>
                             </div>
                        </div>
                        <Button onClick={() => router.push(`/report/${projectId}`)} variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-white/10 rounded-full h-10 px-4 text-xs font-bold uppercase tracking-widest">
                            <ArrowLeft className="w-4 h-4 mr-2" /> 전체 통계로 돌아가기
                        </Button>
                     </div>
                     
                     {myRating ? (
                         <div className="space-y-8">
                             {/* Score & Sticker */}
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="bg-gray-100 dark:bg-black/40 p-4 md:p-8 rounded-2xl border border-border flex flex-col items-center justify-center text-center backdrop-blur-sm">
                                     <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">My Score</div>
                                     <div className="text-4xl md:text-6xl font-black text-foreground tracking-tighter">{myRating.score?.toFixed(1) || "0.0"}</div>
                                 </div>
                                 <div className="bg-gray-100 dark:bg-black/40 p-4 md:p-8 rounded-2xl border border-border flex flex-col items-center justify-center text-center col-span-2 backdrop-blur-sm relative overflow-hidden group">
                                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                     <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">My Vote</div>
                                     <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight break-keep">
                                        "{VOTE_LABEL_MAP[myRating.vote_type] || myRating.vote_type || "투표 없음"}"
                                     </div>
                                 </div>
                             </div>
                             
                             {/* Proposal */}
                             <div className="bg-gray-100 dark:bg-black/40 p-4 md:p-8 rounded-2xl border border-border backdrop-blur-sm">
                                 <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">한줄 코멘트 / 제안</span>
                                 </div>
                                 <p className="text-base md:text-lg text-foreground font-bold leading-relaxed whitespace-pre-wrap">
                                    {myRating.proposal || "남긴 코멘트가 없습니다."}
                                 </p>
                             </div>

                             {/* Custom Answers */}
                             {myRating.custom_answers && Object.keys(myRating.custom_answers).length > 0 && (
                                 <div className="bg-gray-100 dark:bg-black/40 p-4 md:p-8 rounded-2xl border border-border backdrop-blur-sm">
                                     <div className="flex items-center gap-2 mb-6">
                                        <FileText className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">상세 답변</span>
                                     </div>
                                     <div className="grid gap-6">
                                         {Object.entries(myRating.custom_answers).map(([q, a], idx) => (
                                             <div key={idx} className="space-y-2">
                                                 <p className="text-indigo-300 font-bold text-sm">Q. {q}</p>
                                                 <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-border text-foreground/80 font-medium">
                                                    {String(a)}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                     ) : (
                         <div className="py-20 text-center">
                             <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-muted-foreground/60" />
                             </div>
                             <h3 className="text-xl font-bold text-foreground mb-2">내 평가 기록이 없습니다</h3>
                             <p className="text-muted-foreground text-sm">이 프로젝트에 참여한 기록을 찾을 수 없습니다.</p>
                         </div>
                     )}
                </div>
            </motion.section>
         )}

         {/* Hero Title */}
         <section className="text-center space-y-6 relative">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-center">
               <div className="px-4 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <ChefHat size={14} /> 
                   {reportStats?.isPersonalView
                      ? "개인 평가 리포트"
                      : (!reportStats?.isResultPublic && reportStats?.isOwner
                          ? "🔒 비공개 리포트 (의뢰자 전용)"
                          : "종합 평가 리포트")}
               </div>
            </motion.div>
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-2xl md:text-5xl font-black tracking-tighter">
               {project?.title} <span className="text-muted-foreground/60">평가 결과</span>
            </motion.h1>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-6">
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto font-medium break-keep">
                   {reportStats?.isPersonalView ? (
                       <>이 프로젝트는 의뢰자가 평가 결과를 <span className="text-orange-500 font-bold">비공개</span>로 설정하였습니다.<br/>따라서 셰프님께서 작성하신 <span className="text-foreground font-bold">본인의 평가 기록만 확인</span>하실 수 있습니다.</>
                   ) : (!reportStats?.isResultPublic && reportStats?.isOwner ? (
                       <>비공개로 설정된 리포트입니다.<br/>
                       <span className="text-orange-500 font-bold">프로젝트 소유자 권한</span>으로 전체 결과를 열람하고 있습니다.</>
                   ) : (
                       <>누적 {reportStats?.totalParticipantCount}명의 전문가 시선으로 분석된<br/>미슐랭 5성 프로젝트 리포트입니다.</>
                   ))}
                </p>
                <style>{`
                    @media print {
                        @page { margin: 1cm; }
                        body { background: white !important; color: black !important; }
                        .no-print, header, footer, button { display: none !important; }
                        .print-break-inside { break-inside: avoid; }
                    }
                `}</style>
                <div className="flex flex-wrap justify-center gap-3">
                    <Button onClick={handleShare} variant="outline" className="rounded-full border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground gap-2 h-10 px-6 no-print">
                        <Share2 size={14} /> 리포트 공유하기
                    </Button>
                    
                    {reportStats?.isOwner && (
                        <>
                            <Button onClick={handleDownloadCSV} variant="outline" className="rounded-full border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground gap-2 h-10 px-6 no-print">
                                <FileText size={14} /> CSV 저장
                            </Button>
                            <Button onClick={handlePrint} variant="outline" className="rounded-full border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground gap-2 h-10 px-6 no-print">
                                <Printer size={14} /> PDF 저장
                            </Button>
                        </>
                    )}
                </div>
            </motion.div>
         </section>

         {/* Charts Grid */}
         <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Michelin Radar */}
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-gray-100 dark:bg-white/5 border border-border p-4 md:p-10 rounded-2xl space-y-8 flex flex-col">
               <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-orange-600 rounded-full" /> 평점 평가 분석
               </h3>
               <div className="h-[280px] md:h-[400px] w-full min-h-[280px] md:min-h-[400px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={reportStats?.radarData}>
                      <PolarGrid stroke="var(--chef-border)" radialLines={false} gridType="polygon" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--chef-text)', opacity: 0.4, fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar
                        name="전체 평균"
                        dataKey="value"
                        stroke="#ea580c"
                        fill="#ea580c"
                        fillOpacity={0.4}
                      />
                      {reportStats?.isComparisonAvailable && (
                        <Radar
                          name="내 점수"
                          dataKey="myValue"
                          stroke="#818cf8"
                          fill="#818cf8"
                          fillOpacity={0.4}
                        />
                      )}
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--chef-card-bg)', border: '1px solid var(--chef-border)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {reportStats?.radarData.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-white/5 rounded-lg border border-border">
                       <span className="text-xs font-bold text-muted-foreground">{d.subject}</span>
                       <span className="text-lg font-black text-orange-500">{d.value}</span>
                    </div>
                  ))}
               </div>
            </motion.div>

            {/* Sticker Decisions */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-gray-100 dark:bg-white/5 border border-border p-4 md:p-10 rounded-2xl space-y-8 flex flex-col">
               <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" /> 스티커 투표 현황
               </h3>
               <div className="grid grid-cols-1 gap-4">
                  {reportStats?.barData.map((d: any, i: number) => (
                    <div key={i} className={cn(
                        "relative p-5 rounded-lg border transition-all flex items-center justify-between group overflow-hidden",
                        d.isMyChoice 
                            ? "bg-gray-100 dark:bg-white/10 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]" 
                            : "bg-gray-100 dark:bg-white/5 border-border hover:bg-gray-200 dark:hover:bg-white/[0.08]"
                    )}>
                       {d.isMyChoice && (
                           <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500 text-white text-[11px] font-black uppercase rounded-bl-xl z-20 shadow-lg">내 투표</div>
                       )}
                       
                       <div className="flex items-center gap-4 z-10 mr-4">
                           {/* Sticker Circle */}
                           <div 
                             className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-black text-lg shadow-lg"
                             style={{ backgroundColor: d.color, color: 'rgba(0,0,0,0.4)', textShadow: '0 1px 0 rgba(255,255,255,0.2)' }}
                           >
                              {i+1}
                           </div>
                           
                           <div className="flex flex-col min-w-0">
                              <span className={cn("text-sm font-bold leading-tight break-keep", d.isMyChoice ? "text-foreground" : "text-muted-foreground")}>
                                  {d.name}
                              </span>
                           </div>
                       </div>

                       <div className="flex flex-col items-end z-10 shrink-0">
                          <span className="text-2xl font-black">{d.value}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">투표</span>
                       </div>
                       
                       {/* Background Fill for Progress visualization */}
                       <div 
                         className="absolute inset-y-0 left-0 bg-gray-100 dark:bg-white/5 z-0 transition-all duration-1000" 
                         style={{ width: `${(d.value / (reportStats?.totalParticipantCount || 1)) * 100}%` }} 
                       />
                    </div>
                  ))}
               </div>
            </motion.div>

            {/* Expert Participation by Field */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-gray-100 dark:bg-white/5 border border-border p-4 md:p-10 rounded-2xl space-y-8 lg:col-span-2">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-blue-600 rounded-full" /> 분야별 전문가 참여 현황
                  </h3>
                  <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">참여 분석</div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="h-[180px] md:h-[250px] w-full min-h-[180px] md:min-h-[250px] relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(reportStats?.expertiseDistribution || {}).map(([id, count]) => ({
                           name: ALL_LABELS[id] || id,
                           value: count
                        }))}>
                           <XAxis dataKey="name" tick={{ fill: 'var(--chef-text)', opacity: 0.4, fontSize: 10 }} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <Tooltip
                               cursor={{ fill: 'transparent' }}
                               contentStyle={{ backgroundColor: 'var(--chef-card-bg)', border: '1px solid var(--chef-border)', borderRadius: '16px' }}
                               itemStyle={{ color: '#fff' }}
                           />
                           <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]}>
                              {(Object.entries(reportStats?.expertiseDistribution || {})).map((_, index) => (
                                 <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 content-center items-center h-full">
                     {Object.entries(reportStats?.expertiseDistribution || {}).map(([id, count], i) => (
                        <div key={i} className="px-5 py-3 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 flex items-center gap-4 hover:border-blue-500/50 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">분야 전문가</span>
                              <span className="text-sm font-bold text-foreground/80">{ALL_LABELS[id] || id}</span>
                           </div>
                           <div className="h-8 w-px bg-gray-100 dark:bg-white/10 mx-1" />
                           <span className="text-xl font-black text-blue-400">{count as any}</span>
                        </div>
                     ))}
                     {Object.keys(reportStats?.expertiseDistribution || {}).length === 0 && (
                        <div className="w-full p-8 text-center bg-gray-100 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                           <p className="text-muted-foreground/60 font-bold italic">참여 전문가의 전문 분야 통계가 아직 집계되지 않았습니다.</p>
                        </div>
                     )}
                  </div>
               </div>
            </motion.div>
         </section>

         {/* Summary Stats */}
         <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '참여 전문가', value: reportStats?.participantCount || 0, icon: Users, color: 'text-blue-400' },
              { label: '종합 평점', value: reportStats?.overallAvg || '0.0', icon: Star, color: 'text-orange-400' },
              { label: '최고 평가 항목', value: reportStats?.radarData ? [...reportStats.radarData].sort((a:any, b:any) => b.value - a.value)[0]?.subject : '-', icon: Trophy, color: 'text-amber-300' },
              { label: '바이럴 점수', value: 'TOP 5%', icon: Rocket, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i*0.1 }} className="bg-gray-100 dark:bg-white/5 border border-border p-4 md:p-8 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors group">
                 <stat.icon className={cn("w-6 h-6 mb-4", stat.color)} />
                 <p className="text-muted-foreground text-[10px] font-black mb-1 uppercase tracking-widest">{stat.label}</p>
                 <h3 className="text-2xl md:text-3xl font-black">{stat.value}</h3>
              </motion.div>
            ))}
         </section>

         {/* Detailed Evaluation Table */}
         <section className="space-y-6 md:space-y-10">
            <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-emerald-600 rounded-full" /> 평가 기록
                </h3>
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest italic">최신순</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border bg-gray-100 dark:bg-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                            <th onClick={() => handleSort('no')} className="px-3 py-3 md:px-6 md:py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-20 cursor-pointer hover:text-foreground transition-colors select-none group">
                                <div className="flex items-center">No.{sortConfig?.key === 'no' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-50"/>}</div>
                            </th>
                            <th onClick={() => handleSort('info')} className="px-3 py-3 md:px-6 md:py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground transition-colors select-none group">
                                <div className="flex items-center">참여자 정보{sortConfig?.key === 'info' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-50"/>}</div>
                            </th>
                            <th onClick={() => handleSort('specialty')} className="px-3 py-3 md:px-6 md:py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground transition-colors select-none group">
                                <div className="flex items-center">전문분야{sortConfig?.key === 'specialty' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-50"/>}</div>
                            </th>
                            <th onClick={() => handleSort('score')} className="px-3 py-3 md:px-6 md:py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground transition-colors select-none group">
                                <div className="flex items-center">평가 결과{sortConfig?.key === 'score' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-50"/>}</div>
                            </th>
                            <th onClick={() => handleSort('date')} className="px-3 py-3 md:px-6 md:py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right text-xs cursor-pointer hover:text-foreground transition-colors select-none group">
                                <div className="flex items-center justify-end">일시{sortConfig?.key === 'date' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-orange-500"/> : <ChevronDown className="w-3 h-3 ml-1 text-orange-500"/>) : <ChevronsUpDown className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-50"/>}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                         {currentTableData && currentTableData.length > 0 ? (
                          currentTableData.map((r, i) => {
                            const isMyReview = r.user_uid === user?.id;
                            const displayNo = (currentPage - 1) * itemsPerPage + i + 1;
                            const demographics = [r.age_group, r.gender, (r.occupation || r.user_job)].filter(Boolean).join(' · ');

                            return (
                              <tr key={i} className={cn(
                                  "border-b border-border transition-colors", 
                                  isMyReview ? "bg-indigo-500/10 hover:bg-indigo-500/20" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                              )}>
                                  <td className={cn("px-3 py-3 md:px-6 md:py-4 text-sm font-black", isMyReview ? "text-indigo-400" : "text-muted-foreground/60")}>
                                      {isMyReview ? "ME" : displayNo.toString().padStart(2, '0')}
                                  </td>
                                  <td className="px-3 py-3 md:px-6 md:py-4">
                                      <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-3">
                                              <div className={cn(
                                                  "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border uppercase tracking-tighter shrink-0",
                                                  r.user_id 
                                                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                                                    : "bg-gray-100 dark:bg-white/5 text-muted-foreground border-gray-200 dark:border-white/10"
                                              )}>
                                                  {isMyReview ? "ME" : (r.user_id ? "Pro" : "G")}
                                              </div>
                                              <span className={cn("text-sm font-bold", isMyReview ? "text-indigo-300" : "text-foreground")}>
                                                  {isMyReview ? (r.user_nickname || "나의 평가") : (r.user_nickname || r.username || (r.user_id ? '익명의 전문가' : '비회원 게스트'))}
                                              </span>
                                          </div>
                                          {demographics && (
                                              <div className="pl-11 text-[11px] font-medium text-muted-foreground">
                                                  {demographics}
                                              </div>
                                          )}
                                      </div>
                                  </td>
                                  <td className="px-3 py-3 md:px-6 md:py-4">
                                      {r.expertise && r.expertise.length > 0 ? (
                                           <div className="flex flex-wrap gap-1">
                                               {r.expertise.map((exp: string, idx: number) => (
                                                   <span key={idx} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20">
                                                       {exp}
                                                   </span>
                                               ))}
                                           </div>
                                      ) : (
                                          <span className="text-muted-foreground/60 text-[10px]">-</span>
                                      )}
                                  </td>
                                  <td className="px-3 py-3 md:px-6 md:py-4">
                                      <div className="flex items-center gap-3">
                                           <span className={cn("font-black text-lg leading-none", isMyReview ? "text-indigo-400" : "text-orange-500")}>
                                               {r.score ? r.score.toFixed(1) : '-'}
                                           </span>
                                           {r.vote_type && (
                                               <span className="text-[11px] font-bold text-muted-foreground pl-3 border-l border-gray-200 dark:border-white/10 line-clamp-1">
                                                   {reportStats?.stickerOptions?.find((o: any) => o.id === r.vote_type || o.label === r.vote_type)?.label || VOTE_LABEL_MAP[r.vote_type] || r.vote_type}
                                               </span>
                                           )}
                                      </div>
                                  </td>
                                  <td className="px-3 py-3 md:px-6 md:py-4 text-xs text-muted-foreground/60 font-medium text-right font-mono">
                                      {new Date(r.created_at).toLocaleDateString()}
                                  </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground/60 font-bold uppercase tracking-widest">접수된 내역이 없습니다.</td>
                          </tr>
                        )}
                    </tbody>
                </table>
            </div>
         </section>

         {/* Reviews List */}
         <section className="space-y-6 md:space-y-10">
            <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
               <MessageSquare className="text-orange-600" /> 상세 평가 의견 리포트
            </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 print-break-inside">
                {reportStats?.sortedRatings && reportStats.sortedRatings.length > 0 ? (
                  reportStats.sortedRatings
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((r, i) => {
                    const hasCustomAnswers = r.custom_answers && Object.keys(r.custom_answers).length > 0;
                    const hasProposal = !!r.proposal;
                    const hasAnyFeedback = hasCustomAnswers || hasProposal;

                    return (
                      <motion.div 
                        key={i} 
                        initial={{ y: 20, opacity: 0 }} 
                        whileInView={{ y: 0, opacity: 1 }} 
                        viewport={{ once: true }}
                        className="p-4 md:p-8 rounded-lg bg-gray-100 dark:bg-white/5 border border-border hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all flex flex-col gap-8 h-full break-inside-avoid"
                      >
                         {/* ... (keep existing card content same as before, just copying structure for context match if needed, but since we are replacing the block container, we need to provide full content or use precise targeting) */}
                         <div className="flex items-center justify-between shrink-0">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-black text-xs text-muted-foreground border border-gray-200 dark:border-white/10 uppercase tracking-tighter shadow-sm">
                                     {(r.user_nickname || r.username || 'A').substring(0, 1)}
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-sm font-black text-foreground">{r.user_nickname || r.username || '익명 평가위원'}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {r.user_job && (
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-[11px] font-bold text-emerald-400 rounded border border-emerald-500/10 uppercase tracking-tighter">
                                                {r.user_job}
                                            </span>
                                        )}
                                        {!r.user_job && (r.expertise || []).map((exp: string, idx: number) => (
                                            <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-[11px] font-bold text-muted-foreground rounded border border-gray-200 dark:border-white/10">
                                                #{ALL_LABELS[exp] || exp}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                             </div>
                             <div className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-[10px] font-black text-orange-400 border border-orange-500/20 shadow-lg shrink-0">
                                AVG {r.score?.toFixed(1) || '0.0'}
                             </div>
                          </div>
                         
                         <div className="space-y-6 flex-1">
                            {/* Custom Answers */}
                            {project.custom_data?.audit_config?.questions && Array.isArray(project.custom_data.audit_config.questions) && project.custom_data.audit_config.questions.length > 0 ? (
                                project.custom_data.audit_config.questions.map((q: string, qIdx: number) => {
                                    const a = r.custom_answers?.[q];
                                    if (!a) return null; // Skip if no answer for this specific question
                                    
                                    return (
                                        <div key={qIdx} className="space-y-2 group/q">
                                           <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest px-2 py-0.5 bg-orange-500/5 rounded border border-orange-500/10">질문 {qIdx + 1}</span>
                                              <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                                           </div>
                                           <p className="text-xs font-bold text-muted-foreground leading-relaxed italic group-hover/q:text-foreground transition-colors">"{q}"</p>
                                           <div className="bg-gray-100 dark:bg-white/5 border border-border p-3 md:p-5 rounded-lg">
                                              <p className="text-sm font-medium text-foreground leading-relaxed">{String(a)}</p>
                                           </div>
                                        </div>
                                    );
                                })
                            ) : hasCustomAnswers ? (
                                Object.entries(r.custom_answers || {}).map(([q, a], qIdx) => (
                                    <div key={qIdx} className="space-y-2 group/q">
                                       <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest px-2 py-0.5 bg-orange-500/5 rounded border border-orange-500/10">질문 {qIdx + 1}</span>
                                          <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                                       </div>
                                       <p className="text-xs font-bold text-muted-foreground leading-relaxed italic group-hover/q:text-foreground transition-colors">"{q}"</p>
                                       <div className="bg-gray-100 dark:bg-white/5 border border-border p-3 md:p-5 rounded-lg">
                                          <p className="text-sm font-medium text-foreground leading-relaxed">{a as string}</p>
                                       </div>
                                    </div>
                                ))
                            ) : !hasProposal ? (
                                <div className="h-full flex flex-col items-center justify-center py-12 space-y-3 opacity-50">
                                   <MessageSquare size={32} />
                                   <p className="text-xs font-bold uppercase tracking-widest">상세 코멘트가 없습니다</p>
                                </div>
                            ) : null}

                            {/* Final Proposal */}
                            {hasProposal && (
                                <div className="space-y-4 pt-4">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest px-2 py-0.5 bg-blue-400/5 rounded border border-blue-400/10">종합 평가 의견</span>
                                      <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                                   </div>
                                   <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/5 dark:to-white/[0.02] p-4 md:p-6 rounded-xl text-sm font-medium leading-relaxed italic text-orange-900 dark:text-orange-100 border border-gray-200 dark:border-white/10 shadow-inner">
                                     "{r.proposal}"
                                   </div>
                                </div>
                            )}
                         </div>

                         <div className="pt-4 border-t border-border flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                            <span>전문가 검증 레벨 A+</span>
                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                         </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center text-muted-foreground/60">
                     <MessageSquare size={48} className="mx-auto mb-4" />
                     <p className="font-bold">아직 수집된 의견이 없습니다.</p>
                  </div>
                )}
             </div>
             
             {/* Pagination Controls */}
             {reportStats?.sortedRatings && reportStats.sortedRatings.length > itemsPerPage && (
                <div className="flex justify-center gap-2 mt-12 no-print">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="rounded-full w-10 h-10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-foreground disabled:opacity-50"
                    >
                        <ArrowLeft size={16} />
                    </Button>
                    {Array.from({ length: Math.ceil(reportStats.sortedRatings.length / itemsPerPage) }, (_, i) => i + 1).map(p => (
                        <button 
                            key={p} 
                            onClick={() => setCurrentPage(p)}
                            className={cn(
                                "w-10 h-10 rounded-full font-bold text-sm transition-all",
                                currentPage === p 
                                    ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                                    : "bg-gray-100 dark:bg-white/5 text-muted-foreground hover:bg-gray-200 dark:hover:bg-white/10 hover:text-foreground"
                            )}
                        >
                            {p}
                        </button>
                    ))}
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={currentPage === Math.ceil(reportStats.sortedRatings.length / itemsPerPage)}
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(reportStats.sortedRatings.length / itemsPerPage), p + 1))}
                        className="rounded-full w-10 h-10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-foreground disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
             )}
         </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-2 md:py-20 md:px-6 text-center text-muted-foreground/60">
         <div className="flex flex-col items-center gap-6">
            <ChefHat size={32} />
            <p className="text-xs font-black uppercase tracking-[0.4em]">제 평가는요? 평가 시스템 &copy; 2026</p>
         </div>
      </footer>
    </div>
  );
}
