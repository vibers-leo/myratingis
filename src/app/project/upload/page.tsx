"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faPlus,
  faTrash,
  faGift,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Sparkles, Globe, Link, X, Lock, Eye, ArrowLeft, ArrowRight, Calendar, FileText, Image as ImageIcon, Video, LinkIcon, Wand2, Loader2, Check, ChevronDown } from "lucide-react";
import { Question, QuestionType, normalizeQuestions, createEmptyQuestion, getQuestionTypeLabel } from "@/lib/types/question";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

const STICKER_PRESETS: Record<string, any[]> = {
    professional: [
      { id: 'pr1', label: '당장 런칭하시죠!\n기대되는 결과물!', desc: '시장에 즉시 내놓아도 손색없을 만큼\n압도적인 퀄리티와 가치를 증명한 프로젝트', image_url: '/review/a1.jpeg' },
      { id: 'pr2', label: '좋긴 한데...\n한 끗이 아쉽네요', desc: '기획의 방향은 훌륭하나, 사용자 경험(UX)이나\n디테일한 마감에서 보완이 필요한 상태', image_url: '/review/a2.jpeg' },
      { id: 'pr3', label: '기획부터 다시!\n싹 갈아엎읍시다', desc: '컨셉의 정체성이 모호하거나 핵심 기능에 대한\n전면적인 재검토가 필요한 프로젝트', image_url: '/review/a3.jpeg' }
    ],
  michelin: [
    { id: 'mi1', label: '3스타급 완성도!\n완벽한 미식 경험', desc: '예술성과 상업성을 모두 잡은,\n누구나 소유하고 싶어 할 만큼 가치가 뛰어난 프로젝트', image_url: '/review/a1.jpeg' },
    { id: 'mi2', label: '훌륭한 요리,\n하지만 향신료가 부족함', desc: '기본기는 탄탄하지만 이 프로젝트만의\n확실한 개성(Kick)을 더 보여줄 필요가 있는 상태', image_url: '/review/a2.jpeg' },
    { id: 'mi3', label: '재료 선택부터\n다시 고민해야 할 맛', desc: '타겟과 목적이 불분명하여 근본적인\n기획 의도부터 다시 정립해야 하는 프로젝트', image_url: '/review/a3.jpeg' }
  ],
  mz: [
    { id: 'mz1', label: '폼 미쳤다!\n그대로 입사하세요', desc: '더 이상 설명이 필요 없는 압승!\n즉각적인 실행이 가능한 수준의 고퀄리티', image_url: '/review/a1.jpeg' },
    { id: 'mz2', label: '예쁜데 뭔가...\n묘하게 2% 부족함', desc: '비주얼은 좋으나 사용성이나 실용성 측면에서\n한 단계 업그레이드가 필요한 단계', image_url: '/review/a2.jpeg' },
    { id: 'mz3', label: '길을 잃었습니다...\nGPS 재탐색 필요', desc: '무엇을 말하려는지 잘 모르겠어요.\n핵심 기능과 타겟을 다시 정의해 보세요.', image_url: '/review/a3.jpeg' }
  ]
};

const uploadImage = async (file: File) => {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${ext}`;
  const { data, error } = await (supabase as any).storage.from('uploads').upload(filename, file);
  if (error) throw error;
  const { data: { publicUrl } } = (supabase as any).storage.from('uploads').getPublicUrl(filename);
  return publicUrl;
};

// Toss-style step definitions
const STEP_LABELS = [
  'AI 자동 분석',
  '프로젝트 제목',
  '프로젝트 소개',
  '평가 대상 미디어',
  '공개 설정',
  '평가 마감일',
  '평가 기준 설정',
  '스티커 투표',
  '심층 질문',
  '보상 설정',
];

export default function ProjectUploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-chef-text font-black animate-pulse">로딩 중...</div>}>
      <ProjectUploadContent />
    </Suspense>
  );
}

function ProjectUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const titleRef = useRef<HTMLInputElement>(null);

  const [selectedRewardItem, setSelectedRewardItem] = useState<any>(null);
  const [rewardItems, setRewardItems] = useState<any[]>([]);
  const [rewardItemsLoading, setRewardItemsLoading] = useState(false);
  const [rewardCategory, setRewardCategory] = useState('all');
  const [recipientCount, setRecipientCount] = useState(10);
  const [distributeMethod, setDistributeMethod] = useState<'fcfs' | 'author'>('fcfs');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [resultVisibility, setResultVisibility] = useState<'public' | 'private'>('public');
  const [auditDeadline, setAuditDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [auditType, setAuditType] = useState<'link' | 'image' | 'video' | 'document'>('link');
  const [mediaData, setMediaData] = useState<string | string[]>("");
  const [customCategories, setCustomCategories] = useState<any[]>([
    { id: 'm1', label: '기획력', desc: '탄탄한 논리와 명확한 문제 해결 전략' },
    { id: 'm2', label: '독창성', desc: '기존의 틀을 깨는 신선하고 개성 있는 시도' },
    { id: 'm3', label: '심미성', desc: '눈을 사로잡는 세련된 디자인과 레이아웃' },
    { id: 'm4', label: '완성도', desc: '작은 디테일까지 놓치지 않은 집요한 마감' },
    { id: 'm5', label: '상업성', desc: '시장의 니즈를 꿰뚫는 가치와 비즈니스 가능성' }
  ]);
  const [selectedPreset, setSelectedPreset] = useState<'professional' | 'michelin' | 'mz'>('professional');
  const [pollOptions, setPollOptions] = useState<any[]>([]);
  const [pollDesc, setPollDesc] = useState("현업 마스터의 냉정한 피드백");
  const [auditQuestions, setAuditQuestions] = useState<Question[]>(() => [
    createEmptyQuestion('textarea'),
    createEmptyQuestion('textarea'),
    createEmptyQuestion('textarea'),
  ].map((q, i) => ({
    ...q,
    text: [
      "이 프로젝트의 가장 큰 장점은 무엇인가요?",
      "이 프로젝트에서 가장 시급하게 보완해야할 점은 무엇인가요?",
      "발전을 위해 조언해 주실 부분이 있다면 자유롭게 말씀해 주세요.",
    ][i],
  })));
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoShapeN, setDemoShapeN] = useState(6);
  const [direction, setDirection] = useState(1); // 1=forward, -1=back
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzePhase, setAnalyzePhase] = useState<'idle' | 'fetching' | 'analyzing' | 'complete'>('idle');
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const totalSteps = isAdmin ? 10 : 9;

  const getDemoData = (n: number) => {
    const shapes = [
      { subject: '항목 A', A: 4, fullMark: 5 },
      { subject: '항목 B', A: 3, fullMark: 5 },
      { subject: '항목 C', A: 5, fullMark: 5 },
      { subject: '항목 D', A: 2, fullMark: 5 },
      { subject: '항목 E', A: 4, fullMark: 5 },
      { subject: '항목 F', A: 3, fullMark: 5 },
    ];
    return shapes.slice(0, n);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("평가 의뢰를 위해 로그인이 필요합니다.");
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!pollOptions.length) setPollOptions(STICKER_PRESETS.professional);
  }, []);

  // Fetch reward catalog when entering step 10
  useEffect(() => {
    if (step === 10 && isAdmin && rewardItems.length === 0) {
      const fetchCatalog = async () => {
        setRewardItemsLoading(true);
        try {
          const res = await fetch('/api/rewards/catalog');
          const data = await res.json();
          if (data.success) setRewardItems(data.items || []);
        } catch (e) {
          console.error('[Catalog]', e);
        } finally {
          setRewardItemsLoading(false);
        }
      };
      fetchCatalog();
    }
  }, [step, isAdmin]);

  const editId = searchParams.get('edit');
  useEffect(() => {
    if (editId) {
      const fetchProject = async () => {
        try {
          const { data: p, error } = await (supabase as any)
            .from('projects').select('*').eq('id', editId).single();
          if (error) throw error;
          if (p) {
            setTitle(p.title || "");
            setSummary(p.summary || "");
            setVisibility(p.visibility as any || 'public');
            if (p.audit_deadline) setAuditDeadline(p.audit_deadline);
            const config = p.custom_data?.audit_config;
            if (config) {
              setAuditType(config.type || 'link');
              setMediaData(config.mediaA || "");
              if (config.categories) setCustomCategories(config.categories);
              if (config.poll) { setPollDesc(config.poll.desc || ""); setPollOptions(config.poll.options || []); }
              if (config.questions) setAuditQuestions(normalizeQuestions(config.questions));
            }
          }
        } catch (e) {
          console.error("Error fetching project:", e);
          toast.error("프로젝트 정보를 불러오지 못했습니다.");
        }
      };
      fetchProject();
    }
  }, [editId]);

  useEffect(() => {
    if (auditType === 'link' && typeof mediaData === 'string' && mediaData.includes('.')) {
      const timer = setTimeout(async () => {
        setIsLoadingPreview(true);
        try {
          const urlToFetch = mediaData.startsWith('http') ? mediaData : `https://${mediaData}`;
          const response = await fetch(`/api/og-preview?url=${encodeURIComponent(urlToFetch)}`);
          if (response.ok) {
            const data = await response.json();
            setLinkPreview(data.title || data.image ? data : null);
          } else { setLinkPreview(null); }
        } catch { setLinkPreview(null); }
        finally { setIsLoadingPreview(false); }
      }, 1000);
      return () => clearTimeout(timer);
    } else { setLinkPreview(null); }
  }, [mediaData, auditType]);

  const handlePresetChange = (preset: 'professional' | 'michelin' | 'mz') => {
    setSelectedPreset(preset);
    setPollOptions(STICKER_PRESETS[preset]);
    setPollDesc(preset === 'professional' ? "[몰입형] 현업 전문가의 리얼한 반응"
               : preset === 'michelin' ? "[미슐랭형] 미식 가이드 컨셉"
               : "[MZ·위트형] 직관적이고 가벼운 반응");
  };

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, totalSteps)); };
  const goPrev = () => { setDirection(-1); setStep(s => Math.max(s - 1, 1)); };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("제목을 입력해주세요.");
    if (customCategories.length < 3) return toast.error("평가 항목은 최소 3개 이상이어야 합니다.");
    if (pollOptions.length < 2) return toast.error("스티커 항목은 최소 2개 이상이어야 합니다.");
    if (auditQuestions.length < 1) return toast.error("종합 의견 질문은 최소 1개 이상이어야 합니다.");
    setIsSubmitting(true);
    try {
      if (!user) { toast.error("로그인이 필요합니다."); router.push("/login?returnTo=/project/upload"); return; }
      const siteUrl = analyzeUrl.trim()
        ? (analyzeUrl.startsWith('http') ? analyzeUrl : `https://${analyzeUrl}`)
        : (auditType === 'link' && typeof mediaData === 'string' && mediaData.trim()
          ? (mediaData.startsWith('http') ? mediaData : `https://${mediaData}`)
          : null);
      const projectData = {
        title, summary: summary || title, content_text: summary || title, description: summary || title,
        category_id: 1, thumbnail_url: customThumbnail || linkPreview?.image || null, visibility, audit_deadline: noDeadline ? null : auditDeadline || null,
        is_growth_requested: true, author_id: user.id, author_email: user.email,
        site_url: siteUrl,
        custom_data: {
          result_visibility: resultVisibility, is_feedback_requested: true,
          audit_config: {
             type: auditType, mediaA: mediaData, categories: customCategories,
             poll: { desc: pollDesc, options: pollOptions }, questions: auditQuestions,
             reward: selectedRewardItem
               ? { type: 'item', item_id: selectedRewardItem.id, item_name: selectedRewardItem.name, price: selectedRewardItem.retail_price, count: recipientCount, method: distributeMethod }
               : { type: 'none' }
          }
        }
      };
      let projectId = editId;
      if (editId) {
        const { error } = await (supabase as any).from('projects').update(projectData).eq('id', editId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any).from('projects').insert([projectData]).select('id').single();
        if (error) throw error;
        projectId = data.id;
      }
      if (selectedRewardItem && projectId) {
        const unitPrice = selectedRewardItem.retail_price;
        const totalCost = unitPrice * recipientCount;
        const platformFee = Math.round(totalCost * 0.1);
        const tax = Math.round((totalCost + platformFee) * 0.1);
        await (supabase as any).from('project_rewards').upsert({
          project_id: projectId, reward_type: 'coupon', reward_item_id: selectedRewardItem.id,
          amount_per_person: unitPrice, total_slots: recipientCount, distribution_method: distributeMethod,
          total_cost: totalCost, platform_fee: platformFee, tax, total_charged: totalCost + platformFee + tax,
          status: distributeMethod === 'lottery' ? 'pending_lottery' : 'active',
        }, { onConflict: 'project_id' });
      }
      toast.success(editId ? "수정이 완료되었습니다!" : "평가 의뢰가 성공적으로 등록되었습니다!");
      router.push(`/project/share/${projectId}`);
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast.error(error.message || "등록 중 오류가 발생했습니다.");
    } finally { setIsSubmitting(false); }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const handleAiAnalyze = async () => {
    if (!analyzeUrl.trim()) return toast.error("URL을 입력해주세요.");
    setIsAnalyzing(true);
    setAnalyzePhase('fetching');
    setAnalyzeProgress(0);

    // Progress simulation
    let progress = 0;
    const interval = setInterval(() => {
      progress += progress < 30 ? Math.random() * 5 + 2
        : progress < 60 ? Math.random() * 3 + 1
        : Math.random() * 1.5 + 0.3;
      if (progress >= 95) { progress = 95; clearInterval(interval); }
      if (progress >= 30 && progress < 60) setAnalyzePhase('analyzing');
      setAnalyzeProgress(progress);
    }, 150);

    try {
      const res = await fetch('/api/ai/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: analyzeUrl.trim() }),
      });
      const data = await res.json();
      clearInterval(interval);

      if (!data.success) {
        setAnalyzeProgress(0);
        setAnalyzePhase('idle');
        toast.error(data.error || 'AI 분석에 실패했습니다.');
        return;
      }

      setAnalyzeProgress(100);
      setAnalyzePhase('complete');

      const { title: aiTitle, summary: aiSummary, categories, questions, ogImage, ogTitle, ogDescription } = data.data;
      if (aiTitle) setTitle(aiTitle);
      if (aiSummary) setSummary(aiSummary);
      if (categories?.length >= 3) setCustomCategories(categories);
      if (questions?.length >= 1) setAuditQuestions(normalizeQuestions(questions));
      // Auto-fill media link
      const urlForMedia = analyzeUrl.startsWith('http') ? analyzeUrl : `https://${analyzeUrl}`;
      setAuditType('link');
      setMediaData(urlForMedia);
      // Set OG preview
      if (ogTitle || ogImage) {
        setLinkPreview({ title: ogTitle, description: ogDescription, image: ogImage });
      }
      setAiApplied(true);

      // Show 100% briefly before navigating
      await new Promise(r => setTimeout(r, 800));
      toast.success('AI가 폼을 자동으로 채웠습니다!');
      goNext();
    } catch (err: any) {
      clearInterval(interval);
      console.error('[AI Analyze]', err);
      toast.error('AI 분석 중 오류가 발생했습니다.');
      setAnalyzeProgress(0);
      setAnalyzePhase('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ========= STEP RENDERERS =========

  const renderStepAiUrl = () => (
    <div className="flex flex-col min-h-[60vh] justify-between">
      <div className="space-y-6 flex-1">
        <p className="text-sm text-chef-text/40 font-medium">Step 1 / {totalSteps}</p>

        {isAnalyzing ? (
          /* Progress UI */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 py-8">
            <div className="w-full h-2 bg-chef-panel rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-600 to-orange-500 rounded-full"
                style={{ width: `${analyzeProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="text-center space-y-3">
              <p className="text-5xl font-black text-chef-text tabular-nums">{Math.round(analyzeProgress)}%</p>
              <AnimatePresence mode="wait">
                <motion.p key={analyzePhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-sm text-chef-text/50">
                  {analyzePhase === 'fetching' && 'URL에 접근하고 있어요...'}
                  {analyzePhase === 'analyzing' && 'AI가 프로젝트를 분석하고 있어요...'}
                  {analyzePhase === 'complete' && 'AI 분석이 완료되었어요!'}
                </motion.p>
              </AnimatePresence>
              {analyzePhase === 'complete' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Sparkles className="w-10 h-10 text-emerald-500 mx-auto" />
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Input UI */
          <>
            <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
              평가받고 싶은 제품의<br />링크가 있나요?
            </h2>
            <p className="text-sm text-chef-text/50">
              URL을 입력하면 AI가 분석해서 폼을 자동으로 채워드려요.<br />
              없으면 건너뛰고 직접 작성할 수 있어요.
            </p>

            <div className="pt-4 space-y-4">
              <input
                autoFocus
                placeholder="my-project.com"
                value={analyzeUrl}
                onChange={e => setAnalyzeUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyzeUrl.trim() && handleAiAnalyze()}
                className="w-full h-16 md:h-20 bg-chef-panel border border-chef-border/30 hover:border-orange-500/50 focus:border-orange-500 text-lg md:text-xl font-black text-chef-text px-4 md:px-6 placeholder:text-chef-text/20 outline-none transition-colors rounded-sm"
              />

              <Button
                onClick={handleAiAnalyze}
                disabled={!analyzeUrl.trim()}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-500 hover:to-orange-400 text-white text-lg font-black transition-all disabled:opacity-30 rounded-sm flex items-center justify-center gap-3"
              >
                <Wand2 className="w-5 h-5" /> AI로 자동 채우기
              </Button>

              {aiApplied && (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
                      <p className="text-sm font-bold text-emerald-500">AI 분석이 완료되었습니다. 각 항목을 확인하고 수정해주세요.</p>
                    </div>
                    <div className="text-xs text-chef-text/40 pl-8 space-y-1">
                      <p>- 입력하신 URL이 <strong className="text-chef-text/60">제품 링크</strong>로 자동 등록됩니다.</p>
                    </div>
                  </div>

                  {/* Thumbnail Upload Section */}
                  <div className="bg-chef-panel border border-chef-border/30 rounded-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-chef-text">프로젝트 썸네일</h4>
                        <p className="text-[11px] text-chef-text/40 font-medium">매력적인 썸네일은 더 많은 평가 참여를 이끌어냅니다.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="relative group">
                        <div className="w-24 h-24 md:w-28 md:h-28 bg-chef-bg border border-chef-border rounded-sm overflow-hidden shrink-0">
                          {(customThumbnail || linkPreview?.image) ? (
                            <img src={customThumbnail || linkPreview?.image} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-chef-text/15">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        {customThumbnail && (
                          <button
                            onClick={() => setCustomThumbnail(null)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className={cn(
                          "flex items-center justify-center gap-2 h-10 border border-dashed border-chef-border rounded-sm cursor-pointer transition-all text-xs font-black text-chef-text/50 hover:text-chef-text hover:border-orange-500/50",
                          thumbnailUploading && "pointer-events-none opacity-50"
                        )}>
                          {thumbnailUploading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...</>
                          ) : (
                            <><FontAwesomeIcon icon={faCamera} className="text-xs" /> 직접 이미지 올리기</>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setThumbnailUploading(true);
                            try {
                              const url = await uploadImage(file);
                              setCustomThumbnail(url);
                              toast.success("썸네일이 등록되었습니다!");
                            } catch {
                              toast.error("이미지 업로드에 실패했습니다.");
                            } finally {
                              setThumbnailUploading(false);
                            }
                          }} />
                        </label>
                        {linkPreview?.image && !customThumbnail && (
                          <p className="text-[11px] text-chef-text/30 font-medium">현재 OG 이미지가 사용됩니다.</p>
                        )}
                        {customThumbnail && (
                          <p className="text-[11px] text-emerald-500 font-bold">직접 올린 이미지가 사용됩니다.</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-sm px-3 py-2.5">
                      <p className="text-[11px] text-orange-600 dark:text-orange-400 font-bold leading-relaxed">
                        💡 좋은 썸네일을 올리면 더 많은 평가위원의 관심을 받을 수 있어요!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {!isAnalyzing && (
        <div className="flex gap-3 pt-8">
          <Button onClick={goNext} variant="ghost" className="h-14 flex-1 text-chef-text opacity-40 hover:opacity-100 text-base font-black transition-all rounded-sm">
            건너뛰기 — 직접 작성할게요
          </Button>
          {analyzeUrl.trim() && (
            <Button onClick={goNext} className="h-14 px-8 bg-chef-text text-chef-bg hover:opacity-90 text-base font-black transition-all rounded-sm">
              다음 <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const renderStepTitle = () => (
    <div className="flex flex-col min-h-[60vh] justify-between">
      <div className="space-y-6 flex-1">
        <p className="text-sm text-chef-text/40 font-medium">Step 2 / {totalSteps}</p>
        <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
          어떤 프로젝트를<br />평가받으시겠어요?
        </h2>
        <p className="text-sm text-chef-text/50">프로젝트의 제목을 입력해주세요.</p>
        <div className="pt-4">
          <input
            ref={titleRef}
            autoFocus
            placeholder="예) 커피 배달 매칭 MVP"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && title.trim() && goNext()}
            className="w-full h-16 md:h-20 bg-chef-panel border border-chef-border/30 hover:border-orange-500/50 focus:border-orange-500 text-xl md:text-2xl font-black text-chef-text px-4 md:px-8 placeholder:text-chef-text/20 outline-none transition-colors rounded-sm"
          />
        </div>
      </div>
      <div className="flex justify-end pt-8">
        <Button onClick={goNext} disabled={!title.trim()} className="h-14 w-full md:w-auto md:px-16 bg-orange-600 hover:bg-orange-700 text-white text-lg font-black transition-all disabled:opacity-30 rounded-sm">
          계속하기 <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderStepSummary = () => (
    <div className="flex flex-col min-h-[60vh] justify-between">
      <div className="space-y-6 flex-1">
        <p className="text-sm text-chef-text/40 font-medium">Step 3 / {totalSteps}</p>
        <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
          프로젝트를<br />간략히 소개해주세요
        </h2>
        <p className="text-sm text-chef-text/50">평가자들이 프로젝트를 이해하는 데 도움이 됩니다.</p>
        <div className="pt-4">
          <textarea
            autoFocus
            placeholder={"예)\n모바일 초대장 - 와요\n사람들이 쉽게 모바일로 초대장을 만들 수 있는 앱입니다.\n냉정한 평가와 많은 관심 부탁드려요."}
            value={summary}
            onChange={e => setSummary(e.target.value)}
            className="w-full min-h-[200px] bg-chef-panel border border-chef-border/30 hover:border-orange-500/50 focus:border-orange-500 text-sm md:text-base font-medium text-chef-text px-4 md:px-6 py-5 placeholder:text-chef-text/20 outline-none transition-colors rounded-sm resize-none leading-relaxed"
          />
        </div>
      </div>
      <StepNav onPrev={goPrev} onNext={goNext} />
    </div>
  );

  const renderStepMedia = () => (
    <div className="flex flex-col min-h-[60vh] justify-between">
      <div className="space-y-6 flex-1">
        <p className="text-sm text-chef-text/40 font-medium">Step 4 / {totalSteps}</p>
        <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
          평가 대상을<br />등록해주세요
        </h2>
        <p className="text-sm text-chef-text/50">링크, 이미지, 영상, 문서 중 선택해서 업로드하세요.</p>

        <div className="grid grid-cols-4 gap-1 pt-2">
          {([
            { type: 'link' as const, label: '웹 링크', icon: LinkIcon },
            { type: 'image' as const, label: '이미지', icon: ImageIcon },
            { type: 'video' as const, label: '유튜브', icon: Video },
            { type: 'document' as const, label: '문서', icon: FileText },
          ]).map(t => (
            <button
              key={t.type}
              onClick={() => { setAuditType(t.type); setMediaData(t.type === 'image' || t.type === 'document' ? [] : ""); }}
              className={cn(
                "h-16 md:h-14 font-black text-[11px] md:text-xs uppercase tracking-widest transition-all border border-chef-border flex flex-col items-center justify-center gap-1",
                auditType === t.type ? "bg-chef-text text-chef-bg" : "bg-chef-bg text-chef-text opacity-40 hover:opacity-100"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 pt-2">
          {auditType === 'image' || auditType === 'document' ? (
             <div
               className="flex flex-col gap-4 p-4 md:p-6 bg-chef-panel border-2 border-dashed border-chef-border min-h-[160px] rounded-sm transition-colors hover:border-orange-500/50"
               onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-orange-500', 'bg-orange-500/5'); }}
               onDragLeave={e => { e.currentTarget.classList.remove('border-orange-500', 'bg-orange-500/5'); }}
               onDrop={async e => {
                 e.preventDefault();
                 e.currentTarget.classList.remove('border-orange-500', 'bg-orange-500/5');
                 const files = e.dataTransfer.files;
                 if (files.length > 0) {
                   toast.info("업로드 중...", { id: 'uploading' });
                   try {
                     const urls = await Promise.all(Array.from(files).map(f => uploadImage(f)));
                     setMediaData([...(Array.isArray(mediaData) ? mediaData : []), ...urls]);
                     toast.success("업로드 완료!", { id: 'uploading' });
                   } catch { toast.error("업로드 실패", { id: 'uploading' }); }
                 }
               }}
             >
               {(!Array.isArray(mediaData) || mediaData.length === 0) && (
                 <div className="flex flex-col items-center justify-center py-6 text-chef-text/30">
                   <ImageIcon className="w-8 h-8 mb-2" />
                   <p className="text-sm font-bold">파일을 여기에 끌어놓으세요</p>
                   <p className="text-xs mt-1">또는 아래 버튼을 클릭하여 선택</p>
                 </div>
               )}
               <div className="flex flex-wrap gap-3">
                 {Array.isArray(mediaData) && mediaData.map((file, i) => (
                   <div key={i} className="relative group">
                     {auditType === 'image' ? (
                        <div className="w-20 h-20 overflow-hidden rounded-sm"><img src={file} className="w-full h-full object-cover" /></div>
                     ) : (
                        <div className="w-24 h-24 bg-chef-card border border-chef-border flex flex-col items-center justify-center p-2 text-center rounded-sm">
                           <div className="text-xl mb-1">📄</div>
                           <span className="text-[11px] font-black text-chef-text opacity-50 truncate w-full">{(file?.split('/')?.pop()?.split('?')?.[0]) || "file"}</span>
                        </div>
                     )}
                     <button onClick={() => setMediaData((mediaData as string[]).filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 text-xs">
                       <FontAwesomeIcon icon={faTrash} size="xs" />
                     </button>
                   </div>
                 ))}
                 <label className="w-20 h-20 border-2 border-dashed border-chef-border flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-chef-text opacity-20 hover:opacity-100 rounded-sm">
                   <FontAwesomeIcon icon={faPlus} className="mb-1" />
                   <span className="text-[11px] font-black">{auditType === 'image' ? '이미지' : '파일'}</span>
                   <input type="file" multiple accept={auditType === 'image' ? "image/*" : ".pdf,.hwp,.doc,.docx"} className="hidden" onChange={async e => {
                     if (e.target.files) {
                       toast.info("업로드 중...", { id: 'uploading' });
                       try {
                         const urls = await Promise.all(Array.from(e.target.files).map(f => uploadImage(f)));
                         setMediaData([...(Array.isArray(mediaData) ? mediaData : []), ...urls]);
                         toast.success("업로드 완료!", { id: 'uploading' });
                       } catch { toast.error("업로드 실패", { id: 'uploading' }); }
                     }
                   }} />
                 </label>
               </div>
             </div>
          ) : (
            <div className="space-y-3">
              <input
                autoFocus
                value={typeof mediaData === 'string' ? mediaData : ''}
                onChange={e => setMediaData(e.target.value)}
                placeholder={auditType === 'link' ? "https://wayo.co.kr" : "YouTube 영상 주소..."}
                className="w-full h-14 md:h-16 bg-chef-panel border border-chef-border/30 hover:border-orange-500/50 focus:border-orange-500 text-chef-text font-black px-4 md:px-6 text-base md:text-lg placeholder:text-chef-text/30 outline-none transition-colors rounded-sm"
              />
              {linkPreview && (
                 <div className="bg-chef-panel border border-chef-border p-4 space-y-2 animate-in fade-in slide-in-from-top-2 rounded-sm">
                   <div className="flex gap-4 items-center">
                     {linkPreview.image && <img src={linkPreview.image} className="w-16 h-16 object-cover rounded-sm shrink-0 border border-chef-border" />}
                     <div className="space-y-0.5 min-w-0">
                        <h5 className="text-base font-black text-chef-text leading-tight truncate">{linkPreview.title || "링크 미리보기"}</h5>
                        <p className="text-[11px] font-medium text-chef-text opacity-40 line-clamp-1">{linkPreview.description || ""}</p>
                     </div>
                   </div>
                 </div>
              )}

              {/* Thumbnail upload in media step */}
              <div className="bg-chef-panel/50 border border-chef-border/20 rounded-sm p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-chef-bg border border-chef-border rounded-sm overflow-hidden shrink-0 relative group">
                    {(customThumbnail || linkPreview?.image) ? (
                      <img src={customThumbnail || linkPreview?.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-chef-text/15">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    {customThumbnail && (
                      <button onClick={() => setCustomThumbnail(null)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-black text-chef-text">프로젝트 썸네일</p>
                    <label className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-chef-border rounded-sm cursor-pointer transition-all text-[11px] font-black text-chef-text/50 hover:text-chef-text hover:border-orange-500/50",
                      thumbnailUploading && "pointer-events-none opacity-50"
                    )}>
                      {thumbnailUploading ? <><Loader2 className="w-3 h-3 animate-spin" /> 업로드 중...</> : <><FontAwesomeIcon icon={faCamera} className="text-[11px]" /> 이미지 변경</>}
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setThumbnailUploading(true);
                        try {
                          const url = await uploadImage(file);
                          setCustomThumbnail(url);
                          toast.success("썸네일이 등록되었습니다!");
                        } catch {
                          toast.error("이미지 업로드에 실패했습니다.");
                        } finally {
                          setThumbnailUploading(false);
                        }
                      }} />
                    </label>
                    <p className="text-[11px] text-orange-500/70 font-bold">좋은 썸네일 = 더 많은 평가 참여!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <StepNav onPrev={goPrev} onNext={goNext} />
    </div>
  );

  const renderStepVisibility = () => (
    <div className="flex flex-col min-h-[60vh] justify-between">
      <div className="space-y-8 flex-1">
        <p className="text-sm text-chef-text/40 font-medium">Step 5 / {totalSteps}</p>
        <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
          공개 범위를<br />설정해주세요
        </h2>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-black text-chef-text opacity-40 uppercase tracking-widest">프로젝트 참여 권한</Label>
            <div className="flex gap-3">
              <button onClick={() => setVisibility('public')} className={cn(
                "flex-1 py-5 md:py-6 rounded-sm border-2 transition-all flex flex-col items-center justify-center gap-2",
                visibility === 'public' ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100"
              )}>
                <Globe size={22} />
                <span className="text-xs font-black">전체 공개</span>
                <span className="text-[11px] font-medium opacity-70">누구나 참여</span>
              </button>
              <button onClick={() => setVisibility('private')} className={cn(
                "flex-1 py-5 md:py-6 rounded-sm border-2 transition-all flex flex-col items-center justify-center gap-2",
                visibility === 'private' ? "bg-indigo-500/10 border-indigo-500 text-indigo-500" : "bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100"
              )}>
                <Link size={22} />
                <span className="text-xs font-black">링크 공개</span>
                <span className="text-[11px] font-medium opacity-70">링크를 가진 사람만</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black text-chef-text opacity-40 uppercase tracking-widest">결과 리포트 공개</Label>
            <div className="flex gap-3">
              <button onClick={() => setResultVisibility('public')} className={cn(
                "flex-1 py-5 md:py-6 rounded-sm border-2 transition-all flex flex-col items-center justify-center gap-2",
                resultVisibility === 'public' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100"
              )}>
                <Eye size={22} />
                <span className="text-xs font-black">전체 공개</span>
                <span className="text-[11px] font-medium opacity-70">참여자 누구나 확인</span>
              </button>
              <button onClick={() => setResultVisibility('private')} className={cn(
                "flex-1 py-5 md:py-6 rounded-sm border-2 transition-all flex flex-col items-center justify-center gap-2",
                resultVisibility === 'private' ? "bg-red-500/10 border-red-500 text-red-500" : "bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100"
              )}>
                <Lock size={22} />
                <span className="text-xs font-black">의뢰자만</span>
                <span className="text-[11px] font-medium opacity-70">본인 결과만 확인</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <StepNav onPrev={goPrev} onNext={goNext} />
    </div>
  );

  const [noDeadline, setNoDeadline] = useState(false);

  const renderStepDeadline = () => (
    <div className="flex flex-col min-h-[60vh] justify-between">
      <div className="space-y-6 flex-1">
        <p className="text-sm text-chef-text/40 font-medium">Step 6 / {totalSteps}</p>
        <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
          평가 마감일을<br />설정해주세요
        </h2>
        <p className="text-sm text-chef-text/50">마감일이 지나면 새로운 평가를 받을 수 없습니다.</p>
        <div className="pt-4 flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
          {/* 마감일 없음 토글 */}
          <button
            onClick={() => { setNoDeadline(!noDeadline); if (!noDeadline) setAuditDeadline(''); }}
            className={cn(
              "w-full flex items-center justify-between px-5 py-4 rounded-sm border-2 transition-all",
              noDeadline
                ? "border-orange-500 bg-orange-500/10"
                : "border-chef-border/30 bg-chef-panel hover:border-chef-border"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all", noDeadline ? "border-orange-500 bg-orange-500" : "border-chef-border")}>
                {noDeadline && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={cn("text-sm font-black", noDeadline ? "text-orange-500" : "text-chef-text/60")}>마감일 없이 상시 평가 받기</span>
            </div>
          </button>

          {/* 날짜 선택 */}
          <div className={cn("w-full transition-all", noDeadline && "opacity-30 pointer-events-none")}>
            <div className="flex items-center gap-4 bg-chef-panel border border-chef-border/30 hover:border-orange-500/50 focus-within:border-orange-500 rounded-sm px-5 py-4 transition-colors">
              <Calendar className="w-6 h-6 text-orange-500 shrink-0" />
              <input
                type="date"
                value={auditDeadline}
                onChange={e => setAuditDeadline(e.target.value)}
                className="flex-1 bg-transparent text-chef-text font-black text-xl outline-none cursor-pointer"
                disabled={noDeadline}
              />
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 rounded-sm px-5 py-4 w-full">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
              <p className="text-xs text-chef-text/60 font-medium">
                비회원도 평가에 참여할 수 있으며, 추후 가입 시 데이터가 자동 통합됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
      <StepNav onPrev={goPrev} onNext={goNext} />
    </div>
  );

  const renderStepCategories = () => (
    <div className="flex flex-col min-h-[60vh] justify-between">
      <div className="space-y-5 flex-1">
        <p className="text-sm text-chef-text/40 font-medium">Step 7 / {totalSteps}</p>
        <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
          평가 기준을<br />설정해주세요
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-chef-text/50">항목 수에 따라 다각형 차트가 변합니다.</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-chef-text opacity-20">{customCategories.length}/10</span>
            <Button variant="outline" size="sm" onClick={() => setCustomCategories([...customCategories, { id: `cat-${Date.now()}`, label: "", desc: "" }])} disabled={customCategories.length >= 10} className="h-8 text-[11px] font-black border-chef-border bg-transparent text-chef-text hover:bg-black/5 dark:hover:bg-white/5 uppercase tracking-widest">
              <FontAwesomeIcon icon={faPlus} className="mr-1" /> 추가
            </Button>
          </div>
        </div>

        {/* Polygon shape preview */}
        <div className="bg-chef-panel border border-chef-border/50 rounded-sm p-3">
          <p className="text-[11px] font-bold text-chef-text/40 mb-2">평가 기준 예시보기</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { n: 3, s: '삼각형', svg: <polygon points="20,4 36,32 4,32" fill="none" stroke="currentColor" strokeWidth="2" /> },
              { n: 4, s: '사각형', svg: <rect x="4" y="4" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" /> },
              { n: 5, s: '오각형', svg: <polygon points="20,3 36,15 30,34 10,34 4,15" fill="none" stroke="currentColor" strokeWidth="2" /> },
              { n: 6, s: '육각형', svg: <polygon points="20,2 35,10 35,28 20,36 5,28 5,10" fill="none" stroke="currentColor" strokeWidth="2" /> },
            ].map(d => (
              <button key={d.n} onClick={() => { setDemoShapeN(d.n); setDemoModalOpen(true); }}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-2 rounded-sm border transition-all",
                  customCategories.length === d.n
                    ? "border-orange-500 bg-orange-500/10 text-orange-500"
                    : "border-transparent hover:border-chef-border text-chef-text/40 hover:text-chef-text/70"
                )}>
                <svg viewBox="0 0 40 38" className="w-7 h-7">{d.svg}</svg>
                <span className="text-[11px] font-black">{d.n}개</span>
                <span className="text-[11px] font-medium opacity-60">{d.s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
          {customCategories.map((cat, idx) => (
            <div key={idx} className="bg-chef-panel border border-chef-border/50 p-4 rounded-sm relative group hover:border-orange-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-chef-bg text-chef-text opacity-30 flex items-center justify-center rounded-sm shrink-0 font-black text-[11px]">{idx+1}</div>
                <div className="flex-1 space-y-1 min-w-0">
                  <input value={cat.label} onChange={e => {
                    const next = [...customCategories]; next[idx].label = e.target.value; setCustomCategories(next);
                  }} className="font-black text-chef-text outline-none w-full bg-transparent text-base placeholder:text-chef-text/15" placeholder="평가 항목명" />
                  <input value={cat.desc} onChange={e => {
                    const next = [...customCategories]; next[idx].desc = e.target.value; setCustomCategories(next);
                  }} className="text-[11px] text-chef-text opacity-40 outline-none w-full bg-transparent font-bold placeholder:text-chef-text/10" placeholder="설명 입력..." />
                </div>
                {customCategories.length > 3 && (
                  <button onClick={() => setCustomCategories(customCategories.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 text-chef-text hover:text-red-500 transition-all p-1 shrink-0">
                    <FontAwesomeIcon icon={faTrash} size="xs" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <StepNav onPrev={goPrev} onNext={goNext} />
    </div>
  );

  const renderStepPoll = () => (
    <div className="flex flex-col min-h-[60vh] justify-between">
      <div className="space-y-5 flex-1">
        <p className="text-sm text-chef-text/40 font-medium">Step 8 / {totalSteps}</p>
        <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
          스티커 투표를<br />설정해주세요
        </h2>
        <p className="text-sm text-chef-text/50">평가자가 선택할 수 있는 스티커 옵션을 설정합니다. 이미지와 설명을 추가하면 더 직관적인 투표가 가능합니다.</p>

        {/* Preset */}
        <div className="flex gap-1 bg-chef-panel p-1 rounded-sm overflow-x-auto no-scrollbar">
          {[
            { key: 'professional' as const, label: '전문가' },
            { key: 'michelin' as const, label: '미슐랭' },
            { key: 'mz' as const, label: 'MZ세대' },
          ].map(p => (
            <button key={p.key} onClick={() => handlePresetChange(p.key)} className={cn(
              "flex-1 px-3 py-2 text-[11px] font-black uppercase transition-all rounded-sm whitespace-nowrap",
              selectedPreset === p.key ? "bg-chef-text text-chef-bg shadow" : "text-chef-text opacity-40 hover:opacity-100"
            )}>{p.label}</button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-chef-text opacity-20">{pollOptions.length}/6</span>
          <Button size="sm" variant="outline" onClick={() => setPollOptions([...pollOptions, { id: `p-${Date.now()}`, label: "", desc: "", image_url: "" }])} disabled={pollOptions.length >= 6} className="h-8 text-[11px] font-black border-chef-border bg-transparent text-chef-text hover:bg-black/5 dark:hover:bg-white/5 uppercase tracking-widest">
            <FontAwesomeIcon icon={faPlus} className="mr-1" /> 추가
          </Button>
        </div>

        <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
          {pollOptions.map((opt, idx) => (
            <div key={idx} className="bg-chef-panel border border-chef-border rounded-sm overflow-hidden relative group">
              <div className="flex gap-3 p-3">
                <label htmlFor={`sticker-upload-${idx}`} className="w-20 h-20 md:w-24 md:h-24 bg-chef-bg border border-chef-border flex items-center justify-center cursor-pointer overflow-hidden shrink-0 rounded-sm">
                  {opt.image_url ? (
                    <img src={opt.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={faCamera} className="text-chef-text opacity-10 text-xl" />
                  )}
                </label>
                <input id={`sticker-upload-${idx}`} type="file" className="hidden" accept="image/*" onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const toastId = toast.loading(`이미지 업로드 중...`);
                    try {
                      const url = await uploadImage(file);
                      const next = [...pollOptions]; next[idx].image_url = url; setPollOptions(next);
                      toast.success("완료!", { id: toastId });
                    } catch (err: any) { toast.error("실패", { id: toastId }); }
                  }
                }} />
                <div className="flex-1 space-y-2 min-w-0">
                  <textarea value={opt.label} onChange={e => { const next = [...pollOptions]; next[idx].label = e.target.value; setPollOptions(next); }}
                    className="w-full font-black text-chef-text outline-none bg-transparent text-sm placeholder:text-chef-text/15 resize-none h-10 leading-tight" placeholder="메뉴 명칭" rows={2} />
                  <textarea value={opt.desc} onChange={e => { const next = [...pollOptions]; next[idx].desc = e.target.value; setPollOptions(next); }}
                    className="w-full text-[11px] text-chef-text opacity-40 bg-transparent resize-none outline-none font-bold h-10 placeholder:text-chef-text/10 leading-relaxed" placeholder="설명 입력..." rows={2} />
                </div>
              </div>
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[11px]">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <StepNav onPrev={goPrev} onNext={goNext} />
    </div>
  );

  const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string; desc: string }[] = [
    { value: 'textarea', label: '서술형', desc: '자유롭게 의견을 작성' },
    { value: 'short_text', label: '단답형', desc: '한 줄로 간결하게 응답' },
    { value: 'single_choice', label: '단일 선택', desc: '하나만 선택 (라디오)' },
    { value: 'multiple_choice', label: '복수 선택', desc: '여러 개 선택 (체크박스)' },
    { value: 'likert', label: '만족도 척도', desc: '1~5점 또는 1~7점 스케일' },
  ];

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setAuditQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };

  const changeQuestionType = (idx: number, newType: QuestionType) => {
    setAuditQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      const updated: Question = { ...q, type: newType };
      if ((newType === 'single_choice' || newType === 'multiple_choice') && !updated.options?.length) {
        updated.options = ['', ''];
      }
      if (newType === 'likert') {
        if (!updated.likertScale) updated.likertScale = 5;
        if (!updated.likertLabels) updated.likertLabels = ['매우 불만족', '매우 만족'];
      }
      if (newType === 'textarea' || newType === 'short_text') {
        delete updated.options;
        delete updated.likertScale;
        delete updated.likertLabels;
      }
      return updated;
    }));
  };

  const renderStepQuestions = () => {
    const isLastStep = !isAdmin;
    return (
      <div className="flex flex-col min-h-[60vh] justify-between">
        <div className="space-y-5 flex-1">
          <p className="text-sm text-chef-text/40 font-medium">Step 9 / {totalSteps}</p>
          <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
            평가자에게 물어볼<br />질문을 작성해주세요
          </h2>
          <p className="text-sm text-chef-text/50">다양한 질문 유형을 조합하여 깊이 있는 인사이트를 수집하세요.</p>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {auditQuestions.map((q, idx) => (
              <div key={q.id} className="bg-chef-panel border border-chef-border p-4 rounded-sm relative group">
                {/* 헤더: 질문 번호 + 유형 선택 + 필수 토글 + 삭제 */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest shrink-0">Q{idx+1}</span>
                  <div className="relative">
                    <select
                      value={q.type}
                      onChange={e => changeQuestionType(idx, e.target.value as QuestionType)}
                      className="appearance-none bg-chef-bg border border-chef-border text-chef-text text-xs font-bold px-3 py-1.5 pr-7 rounded-sm outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      {QUESTION_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-chef-text/40 pointer-events-none" />
                  </div>
                  <label className="flex items-center gap-1.5 ml-auto cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={e => updateQuestion(idx, { required: e.target.checked })}
                      className="w-3.5 h-3.5 accent-orange-500"
                    />
                    <span className="text-[11px] text-chef-text/50 font-bold">필수</span>
                  </label>
                  {auditQuestions.length > 1 && (
                    <button onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))} className="text-chef-text opacity-20 hover:text-red-400 hover:opacity-100 transition-all p-1">
                      <FontAwesomeIcon icon={faTrash} size="xs" />
                    </button>
                  )}
                </div>

                {/* 질문 텍스트 입력 */}
                <textarea
                  value={q.text}
                  onChange={e => updateQuestion(idx, { text: e.target.value })}
                  className="w-full min-h-[48px] bg-white/5 border border-chef-border focus:border-orange-500 text-chef-text font-bold text-sm p-3 placeholder:text-chef-text/10 outline-none transition-all resize-none leading-relaxed rounded-sm"
                  placeholder="평가받고 싶은 질문을 입력하세요."
                  rows={2}
                />

                {/* 단일선택 / 복수선택 - 선택지 편집 */}
                {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                  <div className="mt-3 space-y-2">
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <div className={cn(
                          "w-4 h-4 border-2 border-chef-border shrink-0",
                          q.type === 'single_choice' ? "rounded-full" : "rounded-sm"
                        )} />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...(q.options || [])];
                            newOpts[oi] = e.target.value;
                            updateQuestion(idx, { options: newOpts });
                          }}
                          className="flex-1 bg-white/5 border border-chef-border focus:border-orange-500 text-chef-text text-sm px-3 py-1.5 outline-none transition-all rounded-sm"
                          placeholder={`선택지 ${oi + 1}`}
                        />
                        {(q.options || []).length > 2 && (
                          <button
                            onClick={() => updateQuestion(idx, { options: (q.options || []).filter((_, i) => i !== oi) })}
                            className="text-chef-text/20 hover:text-red-400 transition-colors p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {(q.options || []).length < 8 && (
                      <button
                        onClick={() => updateQuestion(idx, { options: [...(q.options || []), ''] })}
                        className="text-xs font-bold text-chef-text/30 hover:text-orange-500 transition-colors flex items-center gap-1 mt-1"
                      >
                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> 선택지 추가
                      </button>
                    )}
                  </div>
                )}

                {/* 리커트 척도 설정 */}
                {q.type === 'likert' && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-chef-text/50 shrink-0">척도</span>
                      <div className="flex gap-2">
                        {([5, 7] as const).map(scale => (
                          <button
                            key={scale}
                            onClick={() => updateQuestion(idx, { likertScale: scale })}
                            className={cn(
                              "px-3 py-1 text-xs font-black rounded-sm border transition-all",
                              q.likertScale === scale
                                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                                : "border-chef-border text-chef-text/40 hover:border-chef-text/30"
                            )}
                          >
                            {scale}점
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={q.likertLabels?.[0] || ''}
                        onChange={e => updateQuestion(idx, { likertLabels: [e.target.value, q.likertLabels?.[1] || '매우 만족'] })}
                        className="flex-1 bg-white/5 border border-chef-border focus:border-orange-500 text-chef-text text-xs px-3 py-1.5 outline-none transition-all rounded-sm text-center"
                        placeholder="왼쪽 라벨 (예: 매우 불만족)"
                      />
                      <span className="text-chef-text/20 text-xs">~</span>
                      <input
                        type="text"
                        value={q.likertLabels?.[1] || ''}
                        onChange={e => updateQuestion(idx, { likertLabels: [q.likertLabels?.[0] || '매우 불만족', e.target.value] })}
                        className="flex-1 bg-white/5 border border-chef-border focus:border-orange-500 text-chef-text text-xs px-3 py-1.5 outline-none transition-all rounded-sm text-center"
                        placeholder="오른쪽 라벨 (예: 매우 만족)"
                      />
                    </div>
                    {/* 미리보기 */}
                    <div className="flex items-center justify-center gap-1 py-2">
                      <span className="text-[11px] text-chef-text/30 mr-2">{q.likertLabels?.[0] || '매우 불만족'}</span>
                      {Array.from({ length: q.likertScale || 5 }, (_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-chef-border flex items-center justify-center text-xs font-black text-chef-text/30">
                          {i + 1}
                        </div>
                      ))}
                      <span className="text-[11px] text-chef-text/30 ml-2">{q.likertLabels?.[1] || '매우 만족'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Button variant="ghost" onClick={() => setAuditQuestions([...auditQuestions, createEmptyQuestion('textarea')])} disabled={auditQuestions.length >= 10} className="w-full h-12 border border-dashed border-chef-border text-chef-text opacity-20 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 font-black uppercase tracking-widest transition-all text-xs rounded-sm">
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> 질문 추가 (최대 10개)
            </Button>
          </div>
        </div>
        <div className="flex gap-3 pt-8">
          <Button variant="ghost" onClick={goPrev} className="h-14 px-6 font-black text-chef-text opacity-40 hover:opacity-100 text-sm">
            <ArrowLeft className="mr-1 w-4 h-4" /> 이전
          </Button>
          <Button onClick={() => isLastStep ? handleSubmit() : goNext()} disabled={isSubmitting} className={cn(
            "h-14 flex-1 text-lg font-black transition-all rounded-sm",
            isLastStep ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-chef-text text-chef-bg hover:opacity-90"
          )}>
            {isSubmitting ? "게시 중..." : isLastStep ? <><ChefHat className="w-5 h-5 mr-2" /> 평가 의뢰 게시하기</> : <>계속하기 <ArrowRight className="ml-2 w-5 h-5" /></>}
          </Button>
        </div>
      </div>
    );
  };

  const REWARD_CATEGORIES = [
    { key: 'all', label: '전체' },
    { key: 'coffee', label: '☕ 커피' },
    { key: 'convenience', label: '🏪 편의점' },
    { key: 'chicken', label: '🍗 치킨' },
    { key: 'etc', label: '🎁 기타' },
  ];

  const filteredRewardItems = rewardCategory === 'all'
    ? rewardItems
    : rewardItems.filter(item => item.category === rewardCategory);

  const renderStepReward = () => {
    const unitPrice = selectedRewardItem?.retail_price || 0;
    const totalCost = unitPrice * recipientCount;
    const platformFee = Math.round(totalCost * 0.1);
    const tax = Math.round((totalCost + platformFee) * 0.1);
    const totalCharged = totalCost + platformFee + tax;

    return (
      <div className="flex flex-col min-h-[60vh] justify-between">
        <div className="space-y-5 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-chef-text/40 font-medium">Step 10 / {totalSteps}</p>
            <span className="px-3 py-1 bg-chef-panel border border-chef-border text-[11px] font-black text-orange-500 uppercase tracking-widest rounded-full animate-pulse">유료 플랜 (베타)</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-chef-text leading-tight tracking-tight">
            평가자에게 줄<br />보상을 선택하세요
          </h2>
          <p className="text-sm text-chef-text/50">평가에 참여한 분들에게 기프티콘을 보상으로 제공할 수 있어요.</p>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {REWARD_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setRewardCategory(cat.key)}
                className={cn(
                  "px-3 py-2 text-xs font-black whitespace-nowrap transition-all rounded-sm border",
                  rewardCategory === cat.key
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-chef-panel border-chef-border text-chef-text/50 hover:text-chef-text"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          {rewardItemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <span className="ml-2 text-sm text-chef-text/40 font-bold">상품 불러오는 중...</span>
            </div>
          ) : filteredRewardItems.length === 0 ? (
            <div className="text-center py-12 text-chef-text/30 text-sm font-bold">
              등록된 상품이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[35vh] overflow-y-auto pr-1">
              {filteredRewardItems.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedRewardItem(selectedRewardItem?.id === item.id ? null : item)}
                  className={cn(
                    "p-3 border-2 transition-all text-left rounded-sm flex flex-col gap-2",
                    selectedRewardItem?.id === item.id
                      ? "border-orange-500 bg-orange-500/5"
                      : "border-chef-border bg-chef-panel hover:border-chef-text/20"
                  )}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-20 object-contain rounded-sm bg-white" />
                  ) : (
                    <div className="w-full h-20 bg-chef-bg border border-chef-border rounded-sm flex items-center justify-center">
                      <FontAwesomeIcon icon={faGift} className="text-chef-text/15 text-2xl" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-chef-text leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-[11px] text-chef-text/40 font-medium line-clamp-1">{item.description}</p>
                    <p className="text-sm font-black text-orange-500">{item.retail_price?.toLocaleString()}원</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected item details + recipient count */}
          {selectedRewardItem && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/20 rounded-sm px-4 py-3">
                <FontAwesomeIcon icon={faGift} className="text-orange-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-chef-text truncate">{selectedRewardItem.name}</p>
                  <p className="text-xs text-chef-text/40">{selectedRewardItem.retail_price?.toLocaleString()}원 × {recipientCount}명</p>
                </div>
                <button onClick={() => setSelectedRewardItem(null)} className="text-chef-text/30 hover:text-red-500 transition-colors p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-chef-text opacity-30 uppercase tracking-widest">보상 인원</Label>
                <div className="flex items-center gap-2">
                  {[5, 10, 20, 50].map(n => (
                    <button key={n} onClick={() => setRecipientCount(n)} className={cn(
                      "flex-1 h-10 text-xs font-black border transition-all rounded-sm",
                      recipientCount === n ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-chef-border text-chef-text/40 hover:text-chef-text"
                    )}>{n}명</button>
                  ))}
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="bg-chef-card border border-chef-border rounded-sm p-4 space-y-2">
                <h4 className="text-xs font-black text-chef-text flex items-center gap-2">
                  <FontAwesomeIcon icon={faCoins} className="text-orange-500" /> 예상 비용
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-chef-text font-medium"><span className="opacity-40">상품 비용</span><span>{totalCost.toLocaleString()}원</span></div>
                  <div className="flex justify-between text-chef-text font-medium"><span className="opacity-40">수수료 (10%)</span><span className="text-orange-500">+{platformFee.toLocaleString()}원</span></div>
                  <div className="flex justify-between text-chef-text font-medium"><span className="opacity-40">부가세 (10%)</span><span className="text-orange-500">+{tax.toLocaleString()}원</span></div>
                  <div className="border-t border-chef-border pt-2 flex justify-between items-end">
                    <span className="text-[11px] font-black text-chef-text opacity-40">합계</span>
                    <span className="text-xl font-black text-chef-text">{totalCharged.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-6">
          <div className="flex gap-3">
            <Button variant="ghost" onClick={goPrev} className="h-14 px-6 font-black text-chef-text opacity-40 hover:opacity-100 text-sm">
              <ArrowLeft className="mr-1 w-4 h-4" /> 이전
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !selectedRewardItem} className="h-14 flex-1 bg-orange-600 hover:bg-orange-700 text-white text-lg font-black transition-all rounded-sm disabled:opacity-30">
              {isSubmitting ? "게시 중..." : <><ChefHat className="w-5 h-5 mr-2" /> 게시 완료</>}
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => { setSelectedRewardItem(null); handleSubmit(); }}
            disabled={isSubmitting}
            className="h-12 w-full text-chef-text/30 hover:text-chef-text/60 text-sm font-bold transition-all rounded-sm"
          >
            건너뛰기 — 보상 없이 등록할게요
          </Button>
        </div>
      </div>
    );
  };

  const stepRenderers = [
    renderStepAiUrl,      // 1
    renderStepTitle,      // 2
    renderStepSummary,    // 3
    renderStepMedia,      // 4
    renderStepVisibility, // 5
    renderStepDeadline,   // 6
    renderStepCategories, // 7
    renderStepPoll,       // 8
    renderStepQuestions,  // 9
    renderStepReward,     // 10
  ];

  return (
    <div className="min-h-screen bg-chef-bg font-pretendard">
      <MyRatingIsHeader />

      {/* Progress Bar */}
      <div className="fixed top-20 left-0 right-0 z-40 h-1 bg-chef-border/30">
        <motion.div
          className="h-full bg-orange-500"
          initial={false}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 md:px-6 pt-28 pb-20">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {stepRenderers[step - 1]?.()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Demo Preview Modal */}
      <AnimatePresence>
        {demoModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setDemoModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-chef-card border border-chef-border w-full max-w-sm rounded-xl p-6 relative shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setDemoModalOpen(false)} className="absolute top-4 right-4 text-chef-text/40 hover:text-chef-text transition-colors"><X size={20} /></button>
              <div className="text-center space-y-1 mb-6">
                <h3 className="text-xl font-black text-chef-text italic">
                  {demoShapeN === 3 && "삼각형"}{demoShapeN === 4 && "사각형"}{demoShapeN === 5 && "오각형"}{demoShapeN === 6 && "육각형"}
                </h3>
                <p className="text-xs font-bold text-chef-text/40 uppercase tracking-widest">{demoShapeN}개 지표 예시</p>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getDemoData(demoShapeN)}>
                    <PolarGrid stroke="currentColor" strokeOpacity={0.1} className="text-chef-text" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--chef-text, #888)', fontSize: 11, fontWeight: 'bold', fillOpacity: 0.6 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar name="Demo" dataKey="A" stroke="#ea580c" strokeWidth={3} fill="#ea580c" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable navigation buttons
function StepNav({ onPrev, onNext, nextLabel = "계속하기" }: { onPrev: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="flex gap-3 pt-8">
      <Button variant="ghost" onClick={onPrev} className="h-14 px-6 font-black text-chef-text opacity-40 hover:opacity-100 text-sm rounded-sm">
        <ArrowLeft className="mr-1 w-4 h-4" /> 이전
      </Button>
      <Button onClick={onNext} className="h-14 flex-1 bg-chef-text text-chef-bg hover:opacity-90 text-lg font-black transition-all rounded-sm">
        {nextLabel} <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
}
