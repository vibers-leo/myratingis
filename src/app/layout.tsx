import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AutoLogoutProvider } from "@/components/AutoLogoutProvider";
import NextTopLoader from "nextjs-toploader";
import { RootLayoutContent } from "@/components/layout/RootLayoutContent";
import RealtimeListener from "@/components/RealtimeListener";
import { VisitTracker } from "@/components/VisitTracker";
import { headers } from "next/headers";
import { OnboardingModal } from "@/components/auth/OnboardingModal";

export const revalidate = 0; // 메타데이터 실시간 반영을 위해 캐시 끄기

// Optimized font loading with next/font (auto-subset, self-hosted)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevent FOIT
});

import { createClient } from "@supabase/supabase-js";

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "제 평가는요?";
  const defaultDesc = "당신은 오늘, 이 창작물의 운명을 결정할 전문 심사위원으로 초대되었습니다.";
  const defaultOgImage = "/og-image.png";

  let title = defaultTitle;
  let description = defaultDesc;
  let ogImage = defaultOgImage; // Default to our OG image
  let favicon = "/favicon.ico"; 

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "[Layout] Missing Supabase environment variables. using default metadata.",
      );
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from("site_config").select("*");

      if (error) {
        console.error(
          "[Layout] site_config fetch error (ignoring):",
          error.message,
        );
      } else if (data) {
        const config: any = {};
        data.forEach((item: any) => (config[item.key] = item.value));

        if (config.seo_title) title = config.seo_title;
        if (config.seo_description) description = config.seo_description;
        if (config.seo_og_image) ogImage = config.seo_og_image;
        if (config.seo_favicon) favicon = config.seo_favicon;
      }
    }
  } catch (e) {
    console.error("Metadata fetch critical failure:", e);
  }

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "https://myratingis.vercel.app",
    ), 
    title: title,
    description: description,
    keywords: [
      "프로젝트 평가",
      "MVP 평가",
      "흑백요리사",
      "미슐랭 평가",
      "스타트업",
      "디자인 피드백",
    ],
    openGraph: {
      title: title,
      description: description,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [ogImage],
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className="dark">
      <head>
        {/* Preconnect hints for critical third-party origins (saves 300-500ms per origin) */}
        {/* Firebase Auth - Required for authentication */}
        <link rel="preconnect" href="https://myratingis-29082.firebaseapp.com" />
        <link rel="preconnect" href="https://firebase.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        {/* Kakao SDK */}
        <link rel="preconnect" href="https://t1.kakaocdn.net" />
        {/* DNS Prefetch for less critical origins */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Naver Search Advisor */}
        {process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION && (
          <meta
            name="naver-site-verification"
            content={process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION}
          />
        )}
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
            <TooltipProvider>
              <RealtimeListener />
              <OnboardingModal />
              <RootLayoutContent
                isReviewServer={headers().get("host")?.includes("review")}
              >
                {children}
              </RootLayoutContent>
              <Toaster position="top-center" />
              <ScrollToTop />
            </TooltipProvider>
          </AutoLogoutProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
