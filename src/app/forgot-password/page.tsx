"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/client";
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { Loader2, Mail, ArrowLeft, Lightbulb } from "lucide-react";
import Link from "next/link";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Check sign-in methods first
      const methods = await fetchSignInMethodsForEmail(auth, email);
      
      // DEBUG: Show exact status to user
      if (methods.length === 0) {
          setError(`[확인 결과] 가입된 정보가 없습니다.\n(Firebase에 '${email}' 계정이 없음)\n회원가입을 새로 해주세요!`);
          setLoading(false);
          return;
      }

      // If registered, show methods and try sending email
      console.log("Registered methods:", methods);
      
      if (methods.includes('google.com')) {
          setError(`[확인 결과] 구글 소셜 로그인 계정입니다.\n비밀번호가 없으니 구글 로그인을 이용해주세요.`);
          setLoading(false);
          return;
      }

      // Try sending password reset
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      setError(`[확인 결과] 가입된 계정입니다 (${methods.join(', ')})\n메일이 발송되었습니다.`); // Only visible if setSubmitted is false, but we switch to submitted view.
      
    } catch (err: any) {
      console.error("Password reset error:", err);
      let msg = `오류: ${err.code || err.message}`;
      if (err.code === 'auth/user-not-found') {
          msg = "가입되지 않은 이메일입니다. \n이전 사용자는 [회원가입]을 진행해주시면 기존 데이터가 자동으로 연동됩니다!";
      }
      if (err.code === 'auth/invalid-email') msg = "유효하지 않은 이메일 형식입니다.";
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen chef-bg-dark selection:bg-orange-500/30">
      <MyRatingIsHeader />
      
      <div className="flex min-h-screen flex-col items-center justify-center py-24 px-6">
        {/* Decorative Background Text */}
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none select-none overflow-hidden">
             <div className="text-[120px] font-black text-white leading-none tracking-tighter">RESET</div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="rounded-[2.5rem] p-10 chef-black-panel shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-2 border-white/5 backdrop-blur-3xl">
            
            {/* Logo Area */}
            <div className="flex justify-center mb-10">
                <Image
                  src="/myratingis-logo.png"
                  alt="MyRatingIs"
                  width={300}
                  height={90}
                  quality={100}
                  className="h-8 w-auto invert brightness-0 opacity-80"
                />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black tracking-tighter text-chef-text uppercase italic mb-2">
                {submitted ? "Check Your Email" : "Recovery"}
              </h2>
              <p className="text-[11px] font-bold text-chef-text opacity-40 leading-relaxed">
                 {submitted ? "재설정 링크를 발송했습니다." : "가입하신 이메일 주소를 입력해주세요."}
              </p>
            </div>

            {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
                       [ Error : {error} ]
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[10px] font-black text-chef-text opacity-40 uppercase tracking-[0.2em] ml-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="CHEF@MYRATING.IS"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 bg-[#1a1a1a] border-2 border-white/5 text-white font-bold px-6 rounded-2xl focus:border-orange-500/50 focus:bg-[#222] outline-none transition-all placeholder:text-white/10 shadow-inner text-md"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:to-orange-700 text-lg font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)] border-t border-white/20 mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                         <Loader2 className="w-5 h-5 animate-spin" />
                         TYPE..
                      </div>
                    ) : (
                      "SEND LINK"
                    )}
                  </Button>
                </form>
            ) : (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20 animate-pulse">
                    <Mail className="w-8 h-8 text-orange-500" />
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
                      <p className="text-white font-bold text-sm mb-1">{email}</p>
                      <p className="text-chef-text opacity-40 text-xs">위 주소로 메일을 확인해주세요.</p>
                  </div>

                  <p className="text-[10px] text-orange-500 font-bold mb-8 px-2 leading-relaxed bg-orange-500/5 py-4 rounded-xl border border-orange-500/10">
                    ※ 메일이 오지 않는다면 <span className="underline">구글 소셜 로그인</span> 가입자입니다.<br/>
                    로그인 페이지에서 구글 로그인을 시도해주세요.
                  </p>

                  <Button 
                     onClick={() => router.push('/login')} 
                     variant="outline" 
                     className="w-full h-14 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-xs"
                  >
                    Back to Login
                  </Button>
                </div>
            )}

            {!submitted && (
                <div className="mt-8 text-center">
                    <Link href="/login" className="text-[10px] font-black text-chef-text opacity-30 hover:opacity-100 hover:text-orange-500 uppercase tracking-widest transition-all inline-flex items-center gap-2">
                    <ArrowLeft size={12} />
                    Back to Login
                    </Link>
                </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
