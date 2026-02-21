import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";
import NextTopLoader from "nextjs-toploader";
import { RootLayoutContent } from "@/components/layout/RootLayoutContent";
import dynamic from "next/dynamic";
import { VisitTracker } from "@/components/VisitTracker";
import { OnboardingModal } from "@/components/auth/OnboardingModal";

const RealtimeListener = dynamic(() => import("@/components/RealtimeListener"), { ssr: false });

// Optimized font loading with next/font (auto-subset, self-hosted)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevent FOIT
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://myratingis.kr",
  ),
  title: "제 평가는요?",
  description: "당신은 오늘, 이 창작물의 운명을 결정할 전문 심사위원으로 초대되었습니다.",
  keywords: [
    "프로젝트 평가",
    "MVP 평가",
    "흑백요리사",
    "미슐랭 평가",
    "스타트업",
    "디자인 피드백",
  ],
  openGraph: {
    title: "제 평가는요?",
    description: "당신은 오늘, 이 창작물의 운명을 결정할 전문 심사위원으로 초대되었습니다.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "제 평가는요?" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "제 평가는요?",
    description: "당신은 오늘, 이 창작물의 운명을 결정할 전문 심사위원으로 초대되었습니다.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Preconnect hints for critical third-party origins */}
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        {/* Kakao SDK */}
        <link rel="preconnect" href="https://t1.kakaocdn.net" />
        {/* DNS Prefetch for less critical origins */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Naver Search Advisor */}
        <meta name="naver-site-verification" content="789d8371a26d4018307031798eb808bc19db1326" />
        {/* RSS Feed */}
        <link rel="alternate" type="application/rss+xml" title="제 평가는요? RSS" href="/rss.xml" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen custom-scrollbar overscroll-none`}
      >
        {/* Kakao SDK - Load lazily (not needed for initial render) */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          strategy="lazyOnload"
        />
        {/* Google Analytics (GA4) - Load after page is interactive */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        <VisitTracker />
        <NextTopLoader color="#000000" showSpinner={false} />
        <ClientProviders>
          <AutoLogoutProvider>
            <RealtimeListener />
            <OnboardingModal />
            <RootLayoutContent>
              {children}
            </RootLayoutContent>
            <Toaster position="top-center" />
            <ScrollToTop />
          </AutoLogoutProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
