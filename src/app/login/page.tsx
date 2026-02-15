"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { RiKakaoTalkFill } from "react-icons/ri";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import Image from "next/image";
import { cn } from "@/lib/utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      let returnTo = searchParams.get("returnTo") || "/";
      // Ensure same-origin absolute URLs are converted to relative paths for router
      if (typeof window !== 'undefined' && returnTo.startsWith(window.location.origin)) {
          returnTo = returnTo.replace(window.location.origin, '');
      }
      router.push(returnTo);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam);
      setError(decodedError);
      toast.error("로그인 오류", { description: decodedError });
    }
  }, [searchParams]);

  const { signInWithGoogle, signInWithKakao, signInWithEmail } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  // Detect in-app browsers (Naver, Kakao, Instagram, Facebook, etc.)
  const isInAppBrowser = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes('naver') ||
      ua.includes('whale') ||
      ua.includes('kakaotalk') ||
      ua.includes('instagram') ||
      ua.includes('fbav') || // Facebook App
      ua.includes('fban') ||
      ua.includes('line') ||
      ua.includes('twitter') ||
      // Generic in-app browser detection
      (ua.includes('wv') && ua.includes('android')) || // Android WebView
      (window as any).ReactNativeWebView !== undefined
    );
  };

  const handleGoogleLogin = async () => {
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
    
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Router push is handled by the AuthContext or the useEffect above
    } catch (error: any) {
      toast.error("Google 로그인 실패", { description: error.message });
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(formData.email, formData.password);
      // Success handled by AuthContext router push
    } catch (error: any) {
      console.error(error);
      let msg = error.message || "이메일 또는 비밀번호를 확인해주세요.";
      toast.error("로그인 실패", { description: msg, duration: 5000 });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen chef-bg-dark selection:bg-orange-500/30">
      <MyRatingIsHeader />
      
      <div className="flex min-h-screen flex-col items-center justify-center py-24 px-6">
        {/* Decorative Ornaments */}
        <div className="absolute top-0 left-0 p-20 opacity-5 pointer-events-none select-none">
          <div className="text-[120px] font-black text-white leading-none tracking-tighter">STAGE</div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div 
            className="rounded-[2.5rem] p-10 chef-black-panel shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-2 border-white/5 backdrop-blur-3xl"
          >
            {/* 로고 영역 */}
            <div className="flex justify-center mb-10">
              <div className="relative group">
                <Image
                  src="/myratingis-logo.png"
                  alt="MyRatingIs"
                  width={360}
                  height={108}
                  quality={100}
                  className="h-9 w-auto invert brightness-0"
                />
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-black tracking-tighter text-chef-text uppercase italic">
                LOG IN
              </h2>
              <div className="h-1.5 w-10 bg-gradient-to-r from-orange-500 to-orange-600 mx-auto mt-3 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
            </div>

            <form className="space-y-6" onSubmit={handleEmailLogin}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-none text-[10px] font-black uppercase tracking-widest leading-loose">
                   [ Error : {error} ]
                   {error.includes("Email not confirmed") && (
                     <div className="mt-2 pt-2 border-t border-red-500/20">
                        <Link 
                          href={`/verify-email?email=${encodeURIComponent(formData.email)}`}
                          className="text-orange-500 hover:text-orange-400 underline underline-offset-4"
                        >
                          인증 메일 재전송하기 →
                        </Link>
                     </div>
                   )}
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email-address" className="text-[11px] font-black text-chef-text opacity-40 uppercase tracking-[0.2em] ml-1">
                    Email Address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="CHEF@MYRATING.IS"
                    className="w-full h-16 bg-[#1a1a1a] border-2 border-white/5 text-white font-bold px-8 rounded-2xl focus:border-orange-500/50 focus:bg-[#222] outline-none transition-all placeholder:text-white/10 shadow-inner text-lg autofill:shadow-[0_0_0_1000px_#1a1a1a_inset] autofill:text-fill-white"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-[11px] font-black text-chef-text opacity-40 uppercase tracking-[0.2em] ml-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-16 bg-[#1a1a1a] border-2 border-white/5 text-white font-bold px-8 rounded-2xl focus:border-orange-500/50 focus:bg-[#222] outline-none transition-all placeholder:text-white/10 shadow-inner text-lg autofill:shadow-[0_0_0_1000px_#1a1a1a_inset] autofill:text-fill-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="relative">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-4 h-4 border border-white/20 rounded-none bg-white/5 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                  </div>
                  <label htmlFor="remember-me" className="text-[10px] font-black text-chef-text opacity-40 uppercase tracking-widest cursor-pointer group-hover:opacity-60 transition-colors">
                    로그인 유지
                  </label>
                </div>

                <Link href="/forgot-password" className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors">
                  비밀번호 찾기
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-18 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:to-orange-700 text-xl font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)] border-t border-white/20"
              >
                {loading ? "AUTHENTICATING..." : "SIGN IN"}
              </Button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em]">
                <span className="bg-chef-card px-4 text-chef-text opacity-20">또는 소셜 로그인</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGoogleLogin}
                disabled={googleLoading || kakaoLoading || loading}
                variant="outline"
                className="w-full h-16 bg-white/5 border-2 border-white/10 text-chef-text hover:bg-white/10 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl group"
              >
                {googleLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    Redirecting...
                  </div>
                ) : (
                  <>
                    <FcGoogle className="h-7 w-7 mr-4 group-hover:scale-110 transition-transform" />
                    Continue with Google
                  </>
                )}
              </Button>

              <Button
                onClick={async () => {
                  setKakaoLoading(true);
                  try { await signInWithKakao(); } catch { setKakaoLoading(false); }
                }}
                disabled={googleLoading || kakaoLoading || loading}
                className="w-full h-16 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl group border-0"
              >
                {kakaoLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-[#191919] border-t-transparent rounded-full animate-spin" />
                    Redirecting...
                  </div>
                ) : (
                  <>
                    <RiKakaoTalkFill className="h-7 w-7 mr-4 group-hover:scale-110 transition-transform" />
                    Continue with Kakao
                  </>
                )}
              </Button>
            </div>

            <div className="mt-12 text-center">
              <p className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-widest">
                계정이 없으신가요?{" "}
                <Link
                  href="/signup"
                  className="text-orange-500 hover:text-orange-400 underline underline-offset-4 ml-2"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-black animate-pulse">로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
