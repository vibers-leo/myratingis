"use client";

import clsx from "clsx";
import Link from "next/link";
import { FontAwesomeIcon } from "./FaIcon";
import { faInstagram, faFacebook, faThreads, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { SOCIAL_LINKS } from "@/lib/constants";

import { usePathname } from "next/navigation";

export function Footer({ className }: { className?: string }) {
  const pathname = usePathname();
  const isReviewUrl = typeof window !== 'undefined' && (window.location.host.includes('review') || window.location.pathname.includes('review'));
  
  if (isReviewUrl) return null;
  return (
    <footer className={clsx("w-full pt-8 pb-24 md:pb-8 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#050505] mt-auto", className)}>
      <div className="max-w-[1800px] mx-auto px-2 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex flex-col gap-3 items-center md:items-start">
          {/* 페이지 링크들 */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-secondary-foreground opacity-60">
            <Link href="/about/features" className="hover:text-primary transition-colors">서비스 소개</Link>
            <Link href="/faq" className="hover:text-primary transition-colors">자주 묻는 질문</Link>
            <Link href="/policy/terms" className="hover:text-primary transition-colors">이용약관</Link>
            <Link href="/policy/privacy" className="font-bold hover:text-primary transition-colors">개인정보처리방침</Link>
          </div>
          
          {/* 저작권 문구 */}
          <p className="text-[11px] text-secondary-foreground opacity-40 font-black uppercase tracking-widest">
            © 2026 MYRATINGIS. Beyond the Star.
          </p>
        </div>
        
        {/* 소셜 아이콘 */}
        <div className="flex items-center gap-6 md:mr-20">
          <a 
            href={SOCIAL_LINKS.INSTAGRAM} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-pink-500 transition-colors"
          >
            <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" />
          </a>
          <a 
            href={SOCIAL_LINKS.FACEBOOK} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faFacebook} className="w-5 h-5" />
          </a>
          <a 
            href={SOCIAL_LINKS.THREADS} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faThreads} className="w-5 h-5" />
          </a>
          <a 
            href={SOCIAL_LINKS.YOUTUBE} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <FontAwesomeIcon icon={faYoutube} className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
