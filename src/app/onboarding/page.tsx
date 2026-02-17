"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GENRE_CATEGORIES_WITH_ICONS, FIELD_CATEGORIES_WITH_ICONS } from "@/lib/ui-constants";

export default function OnboardingPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    gender: "",
    age_group: "",
    occupation: "",
    expertise: [] as string[],
  });

  useEffect(() => {
    // Only redirect if we ARE CERTAIN that there is no user and loading has finished
    if (loading === false && !user) {
        console.log('[Onboarding] ⚠️ No user found after loading, redirecting to login...');
        router.push('/login');
        return;
    }
    
    if (user && formData.nickname === "") {
        setFormData(prev => ({
            ...prev,
            nickname: (userProfile as any)?.nickname || user.user_metadata?.full_name || prev.nickname
        }));
    }
  }, [user, loading, router, userProfile, formData.nickname]);

  const handleNext = () => {
    if (step === 2 && !formData.nickname.trim()) {
        toast.error("닉네임을 입력해주세요.");
        return;
    }
    if (step === 3 && (!formData.gender || !formData.age_group)) {
        toast.error("성별과 연령대를 선택해주세요.");
        return;
    }
    if (step === 4 && !formData.occupation) {
      toast.error("직업을 선택하거나 입력해주세요.");
      return;
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
        nickname: formData.nickname,
        gender: formData.gender,
        age_group: formData.age_group,
        occupation: formData.occupation,
        expertise: { fields: formData.expertise }, 
      };

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) throw new Error('Server update failed');

      localStorage.setItem(`onboarding_skipped_${user.id}`, 'true');
      toast.success("프로필 설정이 완료되었습니다!");
      router.push('/'); 
    } catch (error: any) {
      toast.error("저장 실패: " + (error.message || "오류가 발생했습니다"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpertise = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      expertise: prev.expertise.includes(id) 
        ? prev.expertise.filter((item: string) => item !== id)
        : [...prev.expertise, id]
    }));
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-chef-card border border-chef-border rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]">
        {/* Left Side: Progress & Info */}
        <div className="w-full md:w-1/3 bg-chef-panel border-r border-chef-border p-8 flex flex-col">
            <h1 className="font-black text-2xl italic tracking-tighter text-chef-text mb-8">
                제 평가는요?
            </h1>
            
            <div className="space-y-6">
                {[
                    { step: 1, label: "환영합니다" },
                    { step: 2, label: "닉네임 설정" },
                    { step: 3, label: "기본 정보" },
                    { step: 4, label: "직업 / 소속" },
                    { step: 5, label: "전문 분야" },
                ].map((s) => (
                    <div key={s.step} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                            step >= s.step ? "bg-orange-600 text-white" : "bg-chef-card border border-chef-border text-chef-text opacity-20"
                        }`}>
                            {step > s.step ? <Check className="w-5 h-5" /> : s.step}
                        </div>
                        <span className={`text-base font-bold ${step === s.step ? "text-chef-text" : "text-chef-text opacity-20"}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-8">
                <p className="text-xs text-chef-text opacity-40 leading-relaxed">
                    입력하신 정보는 더 정확한 콘텐츠 추천과<br/>
                    평가 신뢰도 분석에만 활용됩니다.
                </p>
            </div>
        </div>

        {/* Right Side: Main Content */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-chef-card relative">
             <AnimatePresence mode="wait"> 
                {/* STEP 1: WELCOME */}
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="h-full flex flex-col items-center justify-center text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-5xl mb-4">
                            👋
                        </div>
                        <div>
                            <h2 className="text-3xl font-black mb-3">환영합니다!</h2>
                            <p className="text-xl font-bold text-orange-600">
                                {userProfile?.username || "셰프"}님
                            </p>
                        </div>
                        <p className="text-chef-text opacity-40 max-w-sm">
                            공정한 평가와 성장을 위한 플랫폼,<br/>
                            MyRatingIs에 오신 것을 환영합니다.
                        </p>
                        <div className="pt-8">
                            <Button onClick={() => setStep(2)} size="lg" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-12 h-14 rounded-full text-lg shadow-xl shadow-orange-500/20">
                                시작하기 <ChevronRight className="ml-2 w-5 h-5"/>
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: NICKNAME */}
                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-lg mx-auto py-10"
                    >
                        <div>
                            <h2 className="text-2xl font-black mb-2 text-chef-text">닉네임 설정</h2>
                            <p className="text-sm text-chef-text opacity-40">서비스에서 사용하실 이름을 알려주세요.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-base font-bold">닉네임</Label>
                                <input 
                                    type="text" 
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                                    placeholder="멋진 이름을 입력해주세요"
                                    className="w-full h-14 px-4 bg-chef-panel rounded-2xl border-2 border-transparent focus:border-orange-500 outline-none font-bold text-lg text-chef-text transition-all placeholder:text-chef-text/20"
                                    autoFocus
                                />
                                <p className="text-xs text-chef-text opacity-40 pl-2">
                                    * 나중에 언제든지 변경할 수 있습니다.
                                </p>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button onClick={handleNext} disabled={!formData.nickname.trim()} className="w-full h-14 bg-chef-text text-chef-bg hover:opacity-90 text-lg font-bold rounded-2xl transition-all">
                                다음 단계
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: BASIC INFO */}
                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-lg mx-auto py-10"
                    >
                        <div>
                            <h2 className="text-2xl font-black mb-2 text-chef-text">기본 정보</h2>
                            <p className="text-sm text-chef-text opacity-40">보다 정확한 콘텐츠 추천을 위해 필요합니다.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-base font-bold">성별</Label>
                                <div className="flex gap-3">
                                    {['남성', '여성', '기타'].map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setFormData({ ...formData, gender: g })}
                                            className={`flex-1 h-14 rounded-2xl font-bold border-2 transition-all ${formData.gender === g
                                                ? 'bg-orange-500 border-orange-500 text-white'
                                                : 'bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base font-bold">연령대</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['10대', '20대', '30대', '40대', '50대 이상'].map((age) => (
                                        <button
                                            key={age}
                                            onClick={() => setFormData({ ...formData, age_group: age })}
                                            className={`h-12 rounded-2xl font-bold border-2 transition-all ${formData.age_group === age
                                                ? 'bg-orange-500 border-orange-500 text-white'
                                                : 'bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100'
                                                }`}
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button onClick={handleNext} className="w-full h-14 bg-chef-text text-chef-bg hover:opacity-90 text-lg font-bold rounded-2xl transition-all">
                                다음 단계
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 4: OCCUPATION */}
                {step === 4 && (
                    <motion.div 
                        key="step4"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-lg mx-auto py-10"
                    >
                        <div>
                            <h2 className="text-2xl font-black mb-2">직업 / 소속</h2>
                            <p className="text-sm text-chef-text opacity-40">현재 주로 활동하는 분야를 알려주세요.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자', '기타'].map((job) => (
                                <button
                                    key={job}
                                    onClick={() => setFormData({ ...formData, occupation: job === '기타' ? '' : job })}
                                    className={`h-14 rounded-2xl font-bold border-2 transition-all ${
                                        (formData.occupation === job) || (job === '기타' && !['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자'].includes(formData.occupation) && formData.occupation !== "")
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                                        : 'bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100'
                                    }`}
                                >
                                    {job}
                                </button>
                            ))}
                        </div>
                        
                        {!['학생', '직장인', '공무원', '자영업/사업', '프리랜서', '주부', '구직자'].includes(formData.occupation) && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Label className="text-xs font-bold text-orange-500 mb-1 block">직업을 직접 입력해주세요</Label>
                                <input 
                                    type="text" 
                                    value={formData.occupation}
                                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                    placeholder="예: 작가, 아티스트 등"
                                    className="w-full h-14 px-4 border-b-2 border-orange-500 bg-transparent outline-none font-bold text-chef-text placeholder:opacity-20 transition-colors text-lg"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="pt-8">
                            <Button onClick={handleNext} className="w-full h-14 bg-chef-text text-chef-bg hover:opacity-90 text-lg font-bold rounded-2xl transition-all">
                                다음 단계
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 5: EXPERTISE */}
                {step === 5 && (
                    <motion.div 
                        key="step5"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-lg mx-auto py-10"
                    >
                        <div>
                            <h2 className="text-2xl font-black mb-2 text-chef-text">전문 분야 (선택)</h2>
                            <p className="text-sm text-chef-text opacity-40">
                                본인의 전문성을 나타낼 수 있는 분야를 선택하세요.<br/>
                                <span className="text-orange-500 font-bold">* 프로필 뱃지로 표시됩니다.</span>
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 max-h-[50vh] overflow-y-auto p-1 scrollbar-hide">
                            {[...GENRE_CATEGORIES_WITH_ICONS, ...FIELD_CATEGORIES_WITH_ICONS].map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => toggleExpertise(item.value)}
                                    className={`px-5 py-3 rounded-full text-sm font-bold transition-all border-2 ${
                                        formData.expertise.includes(item.value)
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                        : 'bg-chef-panel border-chef-border text-chef-text opacity-40 hover:opacity-100'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="pt-8">
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 bg-orange-600 text-white hover:bg-orange-700 text-lg font-bold rounded-2xl shadow-lg shadow-orange-500/20">
                                {isSubmitting ? "저장 중..." : "설정 완료 및 시작"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
