"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { RiKakaoTalkFill } from "react-icons/ri";
import { toast } from "sonner";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithKakao } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      // Supabase Signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;

      if (data.user && data.session) {
        toast.success("회원가입이 완료되었습니다! 환영합니다.");
        router.push("/onboarding");
      } else {
        toast.success("인증 메일이 발송되었습니다. 메일함을 확인해주세요!");
        router.push("/login?message=check-email");
      }
      
    } catch (error: any) {
      console.error("[Signup] Error:", error);
      setError(error.message || "회원가입 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // Detect in-app browsers (Naver, Kakao, Instagram, Facebook, etc.)
  const isInAppBrowser = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes('naver') ||
      ua.includes('whale') ||
      ua.includes('kakaotalk') ||
      ua.includes('instagram') ||
      ua.includes('fbav') ||
      ua.includes('fban') ||
      ua.includes('line') ||
      ua.includes('twitter') ||
      (ua.includes('wv') && ua.includes('android')) ||
      (window as any).ReactNativeWebView !== undefined
    );
  };

  const handleGoogleSignup = async () => {
    // Check for in-app browser
    if (isInAppBrowser()) {
      toast.error("인앱 브라우저에서는 구글 로그인이 제한됩니다.", {
        description: "Chrome, Safari 등 외부 브라우저에서 열어주세요.",
        duration: 5000,
        action: {
          label: "URL 복사",
          onClick: () => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("URL이 복사되었습니다. 외부 브라우저에 붙여넣기 해주세요!");
          }
        }
      });
      return;
    }

    try {
      setLoading(true);
      await signInWithGoogle();
      // Redirect handled inside signInWithGoogle or AuthContext
    } catch (error: any) {
      console.error("[Signup] Google Error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen chef-bg-dark selection:bg-orange-500/30">
      <MyRatingIsHeader />
      
      <div className="flex min-h-screen flex-col items-center justify-center py-24 px-6">
        {/* Decorative Ornaments */}
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none select-none">
          <div className="text-[120px] font-black text-white leading-none tracking-tighter">JOIN</div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="rounded-xl border border-white/5 p-10 chef-black-panel shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
            {/* 로고 영역 */}
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
              <h2 className="text-3xl font-black tracking-tighter text-chef-text uppercase italic">
                CREATE ACCOUNT
              </h2>
              <div className="h-1.5 w-10 bg-gradient-to-r from-orange-500 to-orange-600 mx-auto mt-3 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 mb-6 rounded-none text-[10px] font-black uppercase tracking-widest leading-loose">
                 [ {error} ]
              </div>
            )}

            {/* 소셜 회원가입 */}
            <div className="space-y-3 mb-8">
              <Button
                onClick={handleGoogleSignup}
                disabled={loading}
                variant="outline"
                className="w-full h-16 bg-white/5 border-2 border-white/10 text-chef-text hover:bg-white/10 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl group"
              >
                <FcGoogle className="h-7 w-7 mr-4 group-hover:scale-110 transition-transform" />
                Continue with Google
              </Button>

              <Button
                onClick={async () => {
                  try { setLoading(true); await signInWithKakao(); } catch { setLoading(false); }
                }}
                disabled={loading}
                className="w-full h-16 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl group border-0"
              >
                <RiKakaoTalkFill className="h-7 w-7 mr-4 group-hover:scale-110 transition-transform" />
                Continue with Kakao
              </Button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em]">
                <span className="bg-chef-card px-4 text-chef-text opacity-20">또는 이메일 가입</span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleEmailSignup}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[11px] font-black text-chef-text opacity-40 uppercase tracking-[0.2em] ml-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="CHEF@MYRATING.IS"
                    className="w-full h-16 bg-chef-panel/50 border-2 border-white/5 text-chef-text font-bold px-8 rounded-2xl focus:border-orange-500/50 focus:bg-chef-panel outline-none transition-all placeholder:text-chef-text/10 shadow-inner text-lg"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-[11px] font-black text-chef-text opacity-40 uppercase tracking-[0.2em] ml-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-16 bg-chef-panel/50 border-2 border-white/5 text-chef-text font-bold px-8 rounded-2xl focus:border-orange-500/50 focus:bg-chef-panel outline-none transition-all placeholder:text-chef-text/10 shadow-inner text-lg"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password-confirm" className="text-[11px] font-black text-chef-text opacity-40 uppercase tracking-[0.2em] ml-1">
                    Confirm Password
                  </label>
                  <input
                    id="password-confirm"
                    type="password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-16 bg-chef-panel/50 border-2 border-white/5 text-chef-text font-bold px-8 rounded-2xl focus:border-orange-500/50 focus:bg-chef-panel outline-none transition-all placeholder:text-chef-text/10 shadow-inner text-lg"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-18 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:to-orange-700 text-xl font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)] border-t border-white/20 mt-4"
              >
                {loading ? "PROCESSING..." : "JOIN THE KITCHEN"}
              </Button>
            </form>

            <div className="mt-10 text-center space-y-4">
              <p className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-widest leading-relaxed">
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="text-chef-text hover:text-orange-500 underline underline-offset-4 ml-2"
                >
                  로그인하기
                </Link>
              </p>
              
              <p className="text-[8px] font-black text-chef-text opacity-10 uppercase tracking-widest leading-loose max-w-[200px] mx-auto">
                가입 시 <Link href="/policy/terms" className="underline">이용약관</Link> 및 <Link href="/policy/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
