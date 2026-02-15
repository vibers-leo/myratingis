import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "연결 - 채용 · 공모전 · 이벤트 | 제 평가는요?",
  description: "크리에이터를 위한 채용 공고, 공모전, 이벤트 정보를 한눈에 확인하세요.",
  openGraph: {
    title: "연결 - 채용 · 공모전 · 이벤트 | 제 평가는요?",
    description: "크리에이터를 위한 채용 공고, 공모전, 이벤트 정보를 한눈에 확인하세요.",
  },
};

export default function RecruitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
