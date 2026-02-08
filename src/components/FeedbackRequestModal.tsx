"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Megaphone, MessageSquare, CheckCircle2, AlertTriangle, Trophy, Link, Copy, Target } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

export function FeedbackRequestModal({ open, onOpenChange, projectId, projectTitle }: FeedbackRequestModalProps) {
  const [step, setStep] = useState<"intro" | "options">("intro");
  const [loading, setLoading] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [options, setOptions] = useState({
    detailedFeedback: true, 
    publicFeedback: true,   
    showMichelin: true,     
    showStickers: true,     
    showProposal: true,     
    isABMode: false,        
    url2: "",               
    aiAnalysis: false,
    targetExpertise: [] as string[]
  });

  useEffect(() => {
    if (open) {
      fetchUserPoints();
    }
  }, [open]);

  const fetchUserPoints = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
      setUserPoints(profile?.points || 0); 
    }
  };

  const calculatedCost = useMemo(() => {
    // [Viral Phase] Points disabled for now
    return 0;
  }, []);

  const requirementMet = true;

  const handlePromote = async () => {
    if (!requirementMet) {
        toast.error("내공이 부족합니다.");
        return;
    }
    setLoading(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("로그인이 필요합니다.");

        // API Call to promote
        const res = await fetch(`/api/projects/${projectId}/promote`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              options // Send options if backend supports
            })
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "요청 실패");
        
        toast.success("피드백 요청이 등록되었습니다!");
        onOpenChange(false);
    } catch(err: any) {
        toast.error(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
                <Megaphone size={32} className="text-white fill-white/20" />
            </div>
            <DialogTitle className="text-3xl font-black mb-2">피드백 요청하기</DialogTitle>
            <DialogDescription className="text-orange-100 text-lg font-medium">
                더 많은 사람들에게 프로젝트를 노출하고,<br/>건설적인 피드백을 받아보세요!
            </DialogDescription>
        </div>

        <div className="p-8 space-y-8">
            {step === "intro" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex items-center gap-3">
                             <Trophy className={userPoints >= 500 ? "text-yellow-500" : "text-slate-400"} size={24} />
                             <div className="text-left">
                                 <p className="text-sm font-bold text-slate-500">나의 내공</p>
                                 <p className={`text-xl font-black ${userPoints >= 500 ? "text-green-600" : "text-red-500"}`}>
                                     {userPoints}점
                                 </p>
                             </div>
                         </div>
                         <div className="text-right">
                             <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50 animate-pulse">
                               🔥 출시 기념 무료 프로모션 중
                             </Badge>
                         </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                            어떤 효과가 있나요?
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-slate-100 hover:border-orange-200 transition-colors">
                                <Badge className="bg-orange-500 hover:bg-orange-600 mb-2">FEEDBACK Badge</Badge>
                                <p className="text-sm text-slate-600">리스트에서 눈에 띄는<br/>전용 뱃지가 부착됩니다.</p>
                            </div>
                            <div className="p-4 rounded-2xl border border-slate-100 hover:border-orange-200 transition-colors">
                                <div className="flex items-center gap-1 text-slate-900 font-bold mb-2">
                                    <MessageSquare size={16} className="text-blue-500"/> 피드백 우선 노출
                                </div>
                                <p className="text-sm text-slate-600">피드백을 원하는 유저들에게<br/>우선적으로 추천됩니다.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-indigo-900 flex items-center gap-2 text-sm">
                                <Link size={16} /> 전용 평가 페이지 주소
                            </h4>
                            <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-500 bg-white">
                                ID: {projectId}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white border border-indigo-200 px-3 py-2 rounded-xl text-xs font-mono text-indigo-600 truncate">
                                myratingis.vercel.app/project/{projectId}
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="shrink-0 rounded-xl bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600 gap-1.5"
                                onClick={() => {
                                    navigator.clipboard.writeText(`myratingis.vercel.app/project/${projectId}`);
                                    toast.success("링크가 복사되었습니다!");
                                }}
                            >
                                <Copy size={14} /> 복사
                            </Button>
                        </div>
                        <p className="text-[10px] text-indigo-400 font-medium">이 주소를 통해 로그인 없이도 누구나 평가에 참여할 수 있습니다.</p>
                    </div>
                </div>
            )}

            {step === "options" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className={cn(
                                "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                options.showMichelin ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-white"
                            )}>
                                <Checkbox 
                                    checked={options.showMichelin} 
                                    onCheckedChange={(c) => setOptions({...options, showMichelin: !!c})} 
                                />
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">미슐랭 평점</p>
                                    <p className="text-[10px] text-slate-500">5가지 항목 정밀 평가</p>
                                </div>
                            </label>

                            <label className={cn(
                                "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                options.showStickers ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-white"
                            )}>
                                <Checkbox 
                                    checked={options.showStickers} 
                                    onCheckedChange={(c) => setOptions({...options, showStickers: !!c})} 
                                />
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">스티커 투표</p>
                                    <p className="text-[10px] text-slate-500">간편한 반응 수집</p>
                                </div>
                            </label>

                            <label className={cn(
                                "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                options.showProposal ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-white"
                            )}>
                                <Checkbox 
                                    checked={options.showProposal} 
                                    onCheckedChange={(c) => setOptions({...options, showProposal: !!c})} 
                                />
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">시크릿 평가평</p>
                                    <p className="text-[10px] text-slate-500">1:1 비공개 피드백</p>
                                </div>
                            </label>

                            <label className={cn(
                                "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                options.isABMode ? "border-purple-200 bg-purple-50/50" : "border-slate-200 bg-white"
                            )}>
                                <Checkbox 
                                    checked={options.isABMode} 
                                    onCheckedChange={(c) => setOptions({...options, isABMode: !!c})} 
                                />
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">A/B 테스트</p>
                                    <p className="text-[10px] text-slate-500">두 가지 시안 비교</p>
                                </div>
                            </label>
                        </div>

                        {options.isABMode && (
                            <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 animate-in slide-in-from-top-2 space-y-3">
                                <p className="text-xs font-bold text-purple-700 underline decoration-purple-200 underline-offset-4">A/B 테스트 상세 설정</p>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">대조군(B안) URL</p>
                                    <input 
                                        type="url"
                                        placeholder="https://example.com/version-b"
                                        className="w-full bg-white border border-purple-200 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 ring-purple-500/20 font-medium"
                                        value={options.url2}
                                        onChange={(e) => setOptions({...options, url2: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2">
                                <Target size={14} className="text-red-500" /> 희망 평가 위원 (전문 분야)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {['UI/UX 디자인', '기획/전략', '프론트엔드', '백엔드', '비즈니스', '데이터/AI'].map((field) => (
                                    <button
                                        key={field}
                                        type="button"
                                        onClick={() => {
                                            const current = options.targetExpertise;
                                            const next = current.includes(field) 
                                                ? current.filter(f => f !== field)
                                                : [...current, field];
                                            setOptions({...options, targetExpertise: next});
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border",
                                            options.targetExpertise.includes(field)
                                                ? "bg-slate-900 text-white border-slate-900"
                                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        {field}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="space-y-2">
                            <label className="flex items-center gap-3 px-1 cursor-pointer group">
                                <Checkbox 
                                    checked={options.publicFeedback} 
                                    onCheckedChange={(c) => setOptions({...options, publicFeedback: !!c})} 
                                />
                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">피드백 내용을 커뮤니티에 공개합니다.</span>
                            </label>
                        </div>

                        <div className="pt-4 p-5 bg-slate-950 rounded-[2rem] text-white">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-slate-400">최종 소요 내공</p>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-green-400">FREE</p>
                                    <p className="text-[10px] text-slate-500 line-through">총 {options.isABMode ? 700 + (options.targetExpertise.length * 50) : 500 + (options.targetExpertise.length * 50)}점</p>
                                </div>
                            </div>
                            <div className="space-y-1.5 border-t border-white/10 pt-3 opacity-80">
                                <div className="flex justify-between text-[10px] font-medium text-green-400">
                                    <span>출시 기념 이벤트</span>
                                    <span>-100% 할인</span>
                                </div>
                            </div>
                        </div>

                        {!requirementMet && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold animate-pulse">
                                <AlertTriangle size={16} />
                                내공이 부족하여 요청할 수 없습니다. (부족: {calculatedCost - userPoints}점)
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
             {step === "intro" ? (
                 <Button 
                    className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 rounded-xl"
                    onClick={() => setStep("options")}
                 >
                    다음 단계로
                 </Button>
             ) : (
                 <div className="flex gap-3 w-full">
                     <Button variant="ghost" className="h-12 flex-1 rounded-xl" onClick={() => setStep("intro")}>이전</Button>
                     <Button 
                        className="h-12 flex-[2] text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl shadow-lg shadow-green-100"
                        onClick={handlePromote}
                        disabled={loading || !requirementMet}
                     >
                        {loading ? "처리중..." : "무료로 피드백 요청하기"}
                     </Button>
                 </div>
             )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
