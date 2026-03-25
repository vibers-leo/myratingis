import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 | 제 평가는요?",
  description: "제 평가는요?에 로그인하여 프로젝트 평가 기능을 경험하세요.",
  openGraph: {
    title: "로그인 | 제 평가는요?",
    description: "제 평가는요?에 로그인하여 프로젝트 평가 기능을 경험하세요.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
