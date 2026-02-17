"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { ChefHat, User, LogOut, Sun, Moon, ArrowRight } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function MyRatingIsHeader() {
  const router = useRouter();
  const { user, userProfile, signOut, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Supabase fallback for profile data
  const displayName = userProfile?.nickname || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Guest";
  const displayImage = userProfile?.profile_image_url || user?.user_metadata?.avatar_url || "/globe.svg";

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] shadow-2xl backdrop-blur-md bg-white/90 dark:bg-black/90 border-b border-chef-border">
      <div className="w-full px-2 md:px-10 h-14 md:h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0 flex justify-start">
          <Link href="/" className="flex items-center gap-2 group">
              {!mounted ? (
                <div className="h-5 md:h-6 w-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded" />
              ) : theme === 'dark' ? (
                <Image src="/logo-white.png" alt="제 평가는요?" width={140} height={56} quality={100} className="h-5 md:h-6 w-auto object-contain transition-all duration-300 group-hover:scale-105" />
              ) : (
                <Image src="/myratingis-logo.png" alt="제 평가는요?" width={140} height={56} quality={100} className="h-5 md:h-6 w-auto object-contain transition-all duration-300 group-hover:scale-105 brightness-0" />
              )}
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-12">
           <Link href="/about/features" className="text-[13px] font-black text-chef-text opacity-50 hover:opacity-100 uppercase tracking-[0.2em] transition-all group relative py-2">
              서비스 소개
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
           </Link>
           <Link href="/projects" className="text-[13px] font-black text-chef-text opacity-80 hover:opacity-100 uppercase tracking-[0.2em] transition-all group relative flex items-center gap-1.5 py-2">
              평가 참여하기
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
           </Link>
           <Link href="/growth" className="text-[13px] font-black text-chef-text opacity-50 hover:opacity-100 uppercase tracking-[0.2em] transition-all group relative flex items-center gap-2 py-2">
              명예의 전당
              <span className="bg-orange-500/10 text-orange-500 text-[11px] px-1.5 py-0.5 rounded-md font-bold border border-orange-500/20">준비중</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
           </Link>
           <Link href="/faq" className="text-[13px] font-black text-chef-text opacity-50 hover:opacity-100 uppercase tracking-[0.2em] transition-all group relative py-2">
              자주 묻는 질문
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full" />
           </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex-shrink-0 hidden md:flex items-center justify-end gap-5">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-chef-text active:scale-95"
          >
            {!mounted ? <div className="w-5 h-5 bg-gray-100 dark:bg-white/5 rounded-full" /> : theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>

          {!mounted || loading ? (
            <div className="w-24 h-10 bg-gray-100 dark:bg-white/5 animate-pulse rounded-xl" />
          ) : isAuthenticated && user ? (
            <>
               <Button
                onClick={() => router.push("/project/upload?mode=audit")}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-12 font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-orange-600/20 hover:scale-105 transition-transform"
              >
                <ChefHat className="w-5 h-5" />
                평가 의뢰하기
              </Button>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-inner">
                    <span className="text-white font-black text-xs">
                      {((userProfile as any)?.nickname || userProfile?.username || "U").charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-chef-text opacity-90">
                    {(userProfile as any)?.nickname || userProfile?.username || "CHEF"}
                  </span>
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-4 w-60 bg-chef-card border border-chef-border py-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-chef-border/50 mb-2 bg-chef-panel/30">
                        <p className="text-[10px] font-black text-chef-text opacity-30 uppercase tracking-widest mb-1">내 계정</p>
                        <p className="text-sm font-black text-chef-text truncate">{(userProfile as any)?.nickname || userProfile?.username || user?.user_metadata?.full_name || "Chef"}</p>
                        <p className="text-[10px] font-bold text-chef-text opacity-40 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push("/mypage");
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-orange-600/10 flex items-center gap-4 text-[13px] font-black text-chef-text group transition-all"
                    >
                      <div className="w-8 h-8 rounded-xl bg-chef-panel flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <span>마이페이지</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-red-500/10 flex items-center gap-4 text-[13px] font-black text-red-500 group transition-all"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
               <Link href="/login">
                <Button variant="ghost" className="text-chef-text opacity-70 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/5 px-6 h-12 font-bold text-sm uppercase tracking-widest transition-all rounded-xl">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-orange-600 text-white hover:bg-orange-700 px-8 h-12 font-bold text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-orange-600/20 rounded-xl hover:scale-105 active:scale-95">
                  시작하기
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-chef-text relative z-[120]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="w-6 h-5 flex flex-col justify-between items-center relative">
            <motion.span
              animate={isMenuOpen ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
              className="w-full h-0.5 bg-current rounded-full origin-center transition-all duration-300"
            />
            <motion.span
              animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-full h-0.5 bg-current rounded-full transition-all duration-300"
            />
            <motion.span
              animate={isMenuOpen ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
              className="w-full h-0.5 bg-current rounded-full origin-center transition-all duration-300"
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-chef-bg md:hidden overflow-y-auto w-full h-[100dvh]"
          >
            <div className="flex flex-col pt-16 px-4 pb-20 min-h-full">
              
              {/* User Section */}
              {isAuthenticated && user ? (
                 <div className="mb-10 space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-chef-panel border border-chef-border shadow-inner">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xl font-black text-white shadow-lg shrink-0">
                           {userProfile?.username?.charAt(0) || "U"}
                        </div>
                        <div className="overflow-hidden">
                           <p className="text-base font-black text-chef-text truncate">{(userProfile as any)?.nickname || userProfile?.username || user?.user_metadata?.full_name || "CHEF"}</p>
                           <p className="text-xs text-chef-text/40 font-bold truncate">{user.email}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                         <Button
                          onClick={() => {
                            router.push("/project/upload?mode=audit");
                            setIsMenuOpen(false);
                          }}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-600/20 col-span-2"
                        >
                          <ChefHat className="w-5 h-5 mr-2" />
                          평가 의뢰하기
                        </Button>
                        <Button
                          onClick={() => {
                            router.push("/mypage");
                            setIsMenuOpen(false);
                          }}
                          variant="outline"
                          className="w-full rounded-2xl h-12 font-bold text-chef-text border-chef-border bg-chef-panel"
                        >
                          마이페이지
                        </Button>
                         <Button
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          variant="outline"
                          className="w-full rounded-2xl h-12 font-bold text-red-500 border-chef-border bg-chef-panel hover:bg-red-500/10"
                        >
                          로그아웃
                        </Button>
                    </div>
                 </div>
              ) : (
                 <div className="mb-10 space-y-3">
                    <div className="text-center mb-6">
                        <p className="text-sm text-chef-text/50 font-medium">로그인하고 모든 기능을 이용해보세요.</p>
                    </div>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                       <Button variant="outline" className="w-full rounded-2xl h-14 font-black text-chef-text bg-chef-panel border border-chef-border text-sm uppercase tracking-widest mb-3">
                        로그인
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                       <Button className="w-full rounded-2xl h-14 font-black text-chef-bg bg-chef-text text-sm uppercase tracking-widest shadow-lg">
                        회원가입
                      </Button>
                    </Link>
                 </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-4 flex-1">
                 {[
                   { href: "/about/features", label: "서비스 소개" },
                   { href: "/projects", label: "평가 참여하기", highlight: true },
                   { href: "/growth", label: "명예의 전당" },
                   { href: "/faq", label: "자주 묻는 질문" },
                 ].map((link, i) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}>
                       <motion.div 
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.1 * i }}
                         className={cn(
                           "group flex items-center justify-between p-4 rounded-xl border transition-all active:scale-95",
                           link.highlight
                             ? "bg-orange-600 border-orange-500 shadow-[0_10px_30px_rgba(234,88,12,0.3)]"
                             : "bg-chef-panel border-chef-border hover:bg-chef-card"
                         )}
                       >
                          <div>
                             <p className={cn("text-lg font-black italic tracking-tighter", link.highlight ? "text-white" : "text-chef-text")}>{link.label}</p>
                          </div>
                          <ArrowRight className={cn("opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300", link.highlight ? "text-white" : "text-chef-text/40")} />
                       </motion.div>
                    </Link>
                 ))}
              </div>

               {/* Footer / Theme Toggle */}
               <div className="mt-10 pt-6 border-t border-chef-border flex items-center justify-between">
                  <span className="text-[10px] font-black text-chef-text/40 uppercase tracking-widest">테마 설정</span>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-chef-panel border border-chef-border text-xs font-bold text-chef-text hover:bg-chef-card"
                  >
                    {theme === 'dark' ? <Sun size={14} className="text-orange-400" /> : <Moon size={14} />}
                    {theme === 'dark' ? '다크 모드' : '라이트 모드'}
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default MyRatingIsHeader;
