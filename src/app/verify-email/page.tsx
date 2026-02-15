"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mail, Clock, CheckCircle2, AlertCircle, ChevronLeft, SendHorizontal } from "lucide-react";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown, searchParams]);

  const handleResendEmail = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("이메일을 입력해주세요");
      return;
    }

    if (cooldown > 0) {
      toast.error(`${cooldown}초 후에 다시 시도해주세요`);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      setResendCount(resendCount + 1);
      setCooldown(60);
      
      toast.success("인증 이메일이 재전송되었습니다!", {
        description: "이메일을 확인해주세요. 스팸함도 확인해보세요.",
        duration: 5000,
      });

    } catch (error: any) {
      console.error("[Verify Email] Resend error:", error);
      
      if (error.message?.includes("Email rate limit exceeded") || error.message?.includes("security purposes")) {
        toast.error("너무 많은 요청을 보냈습니다", {
          description: "잠시 후 (약 1~2분 뒤) 다시 시도해주세요. 만약 계속 실패한다면 관리자에게 문의바랍니다.",
        });
        setCooldown(60); 
      } else if (error.message?.includes("invalid") || error.code === 'validation_failed') {
        toast.error("유효하지 않은 이메일 형식입니다.", {
          description: "이메일 주소에 공백이나 오타가 없는지 확인해주세요.",
        });
      } else {
        toast.error("이메일 전송 실패", {
           description: "이미 인증되었거나 가입되지 않은 이메일일 수 있습니다. 로그인이나 '비밀번호 찾기'를 시도해보세요.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen chef-bg-dark selection:bg-orange-500/30">
      <MyRatingIsHeader />
      
      <div className="flex min-h-screen flex-col items-center justify-center py-24 px-6 relative overflow-hidden">
        {/* Decorative Ornaments */}
        <div className="absolute top-0 left-0 p-20 opacity-5 pointer-events-none select-none">
          <div className="text-[120px] font-black text-white leading-none tracking-tighter uppercase italic">Verify</div>
        </div>

        <div className="w-full max-w-lg relative z-10">
          <div className="rounded-xl p-10 chef-black-panel shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-2 border-white/5 backdrop-blur-3xl">
            {/* Logo Area */}
            <div className="flex justify-center mb-10">
              <Image
                src="/myratingis-logo.png"
                alt="MyRatingIs"
                width={360}
                height={108}
                quality={100}
                className="h-9 w-auto invert brightness-0"
              />
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/10 border-2 border-orange-500/20 mb-6 group">
                <Mail className="w-10 h-10 text-orange-500 group-hover:scale-110 transition-transform" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-chef-text uppercase italic">
                VERIFY EMAIL
              </h2>
              <div className="h-1.5 w-10 bg-gradient-to-r from-orange-500 to-orange-600 mx-auto mt-3 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
              <p className="mt-4 text-chef-text/60 font-bold text-sm tracking-tight break-keep">
                가입하신 이메일 <span className="text-orange-500">{email}</span> 로<br />
                인증 링크를 보내드렸습니다.
              </p>
            </div>

            {/* Instruction Guidelines */}
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
                <div>
                   <p className="text-sm font-black text-chef-text tracking-tight mb-1">받은편지함 확인</p>
                   <p className="text-xs text-chef-text/40 font-bold leading-relaxed">전송된 링크를 클릭하면 즉시 주방(서비스)으로 입장하실 수 있습니다.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <AlertCircle className="w-5 h-5 text-orange-500/50 mt-1 shrink-0" />
                <div>
                   <p className="text-sm font-black text-chef-text tracking-tight mb-1">메일이 보이지 않는다면?</p>
                   <p className="text-xs text-chef-text/40 font-bold leading-relaxed">스팸함(특히 네이버/Gmail 프로모션)을 확인해주세요. 전송에 최대 3분이 소요될 수 있습니다.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-chef-text opacity-40 uppercase tracking-[0.2em] ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="CHEF@MYRATING.IS"
                    className="w-full h-16 bg-[#1a1a1a] border-2 border-white/5 text-white font-bold px-8 rounded-2xl focus:border-orange-500/50 focus:bg-[#222] outline-none transition-all placeholder:text-white/10 shadow-inner text-lg"
                    disabled={loading}
                  />
               </div>

               <Button
                  onClick={handleResendEmail}
                  disabled={loading || cooldown > 0}
                  className={cn(
                    "w-full h-18 text-white text-xl font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg border-t border-white/20",
                    cooldown > 0 ? "bg-white/10 opacity-50" : "bg-gradient-to-br from-orange-500 to-orange-600 hover:to-orange-700 shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)]"
                  )}
               >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      전송 중...
                    </div>
                  ) : cooldown > 0 ? (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5" />
                      {cooldown}초 후 재시도
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <SendHorizontal className="w-5 h-5" />
                      인증 메일 재전송하기
                    </div>
                  )}
               </Button>

               {resendCount > 0 && (
                 <p className="text-center text-[10px] font-black text-orange-500/50 uppercase tracking-widest">
                   Email Resent {resendCount} times
                 </p>
               )}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4">
               <button 
                  onClick={() => router.push("/login")}
                  className="flex items-center justify-center gap-2 text-chef-text/40 hover:text-chef-text transition-colors text-xs font-black uppercase tracking-widest"
               >
                  <ChevronLeft className="w-4 h-4" /> Back to Login
               </button>
               
               <p className="text-center text-[10px] font-black text-chef-text opacity-20 uppercase tracking-[0.2em]">
                  계속 문제가 발생하나요? <Link href="/contact" className="text-orange-500 underline underline-offset-4">헬프데스크 문의</Link>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen chef-bg-dark flex items-center justify-center text-white font-black animate-pulse uppercase tracking-[0.5em]">Authenticating...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
