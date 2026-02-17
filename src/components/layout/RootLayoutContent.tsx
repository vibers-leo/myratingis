"use client";

import { usePathname } from "next/navigation";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { Footer } from "@/components/Footer";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export function RootLayoutContent({
  children,
  isReviewServer = false
}: {
  children: React.ReactNode;
  isReviewServer?: boolean;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [maxWaitReached, setMaxWaitReached] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Maximum 2 seconds for auth loading screen
    const timer = setTimeout(() => setMaxWaitReached(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const isAdminPage = pathname?.startsWith('/admin');
  const isReviewPath = pathname?.includes('review');
  
  // These checks might differ between server and client, so we gate them with 'mounted'
  const isReviewSubdomain = mounted && typeof window !== 'undefined' && (window.location.hostname.includes('review') || window.location.host.includes('review'));
  
  const isReport = pathname?.startsWith('/report');
  
  const { loading: authLoading } = useAuth();

  // Only hide the global layout for very specific specialized views (review viewer, reports, admin)
  const hideLayout = isAdminPage || isReviewPath || isReviewSubdomain || isReviewServer || isReport;

  // Prevent flash or mismatch during hydration
  if (!mounted) {
    return <div className="min-h-screen flex flex-col relative w-full overflow-x-hidden bg-background">{children}</div>;
  }

  // Show blank screen briefly while auth loads, but never more than 2 seconds
  if (authLoading && !maxWaitReached && !hideLayout && pathname !== '/login' && pathname !== '/signup') {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen flex-col relative w-full overflow-x-hidden">
      {!hideLayout && <MyRatingIsHeader />}
      <main className={`flex-1 w-full max-w-[1920px] mx-auto ${hideLayout ? "" : "pt-20 pb-20"} fade-in`}>
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
