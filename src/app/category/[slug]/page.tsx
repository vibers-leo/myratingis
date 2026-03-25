// src/app/category/[slug]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ImageCard } from "@/components/ImageCard";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// 카테고리 정보
const CATEGORIES: Record<string, { name: string; description: string; icon: string }> = {
  "video": {
    name: "영상/모션그래픽",
    description: "영상 편집, 모션 그래픽, 애니메이션 작품",
    icon: "🎬"
  },
  "graphic-design": {
    name: "그래픽 디자인",
    description: "포스터, 브로슈어, 광고 디자인",
    icon: "🎨"
  },
  "brand": {
    name: "브랜딩/편집",
    description: "브랜드 아이덴티티, 편집 디자인",
    icon: "📐"
  },
  "ui": {
    name: "UI/UX",
    description: "웹/앱 인터페이스 디자인",
    icon: "💻"
  },
  "illustration": {
    name: "일러스트레이션",
    description: "디지털/전통 일러스트",
    icon: "✏️"
  },
  "digital-art": {
    name: "디지털 아트",
    description: "디지털 페인팅, 컨셉 아트",
    icon: "🖼️"
  },
  "ai": {
    name: "AI",
    description: "AI 생성 이미지, AI 활용 작품",
    icon: "🤖"
  },
  "cartoon": {
    name: "캐릭터 디자인",
    description: "캐릭터 일러스트, 만화",
    icon: "👾"
  },
  "product-design": {
    name: "제품/패키지 디자인",
    description: "제품 디자인, 패키징",
    icon: "📦"
  },
  "photography": {
    name: "포토그래피",
    description: "사진 작품",
    icon: "📷"
  },
  "typography": {
    name: "타이포그래피",
    description: "폰트 디자인, 레터링",
    icon: "🔤"
  },
  "craft": {
    name: "공예",
    description: "수공예, 공예품",
    icon: "🎭"
  },
  "art": {
    name: "파인아트",
    description: "회화, 조각, 순수 미술",
    icon: "🎨"
  }
};

interface ImageDialogProps {
  id: string;
  urls: { full: string; regular: string };
  user: {
    username: string;
    profile_image: { small: string; large: string };
  };
  likes: number;
  description: string | null;
  alt_description: string | null;
  created_at: string;
  width: number;
  height: number;
  category: string;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const category = CATEGORIES[slug];

  const [projects, setProjects] = useState<ImageDialogProps[]>([]);
  const [selectedProject, setSelectedProject] = useState<ImageDialogProps | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 프로젝트 불러오기
    const loadProjects = () => {
      try {
        const savedProjects = localStorage.getItem("projects");
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects);
          // 해당 카테고리 프로젝트만 필터링
          const filtered = parsedProjects.filter(
            (p: ImageDialogProps) => p.category === slug
          );
          setProjects(filtered);
        }
      } catch (error) {
        console.error("프로젝트 로딩 실패:", error);
      }
    };

    loadProjects();
  }, [slug]);

  const handleCardClick = (project: ImageDialogProps) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            카테고리를 찾을 수 없습니다
          </h1>
          <Link href="/">
            <Button>
              <ArrowLeft size={18} className="mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            뒤로 가기
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{category.icon}</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {category.name}
              </h1>
              <p className="text-lg text-gray-600">
                {category.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{projects.length}개의 프로젝트</span>
          </div>
        </div>
      </div>

      {/* 프로젝트 그리드 */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500 mb-4">
              아직 등록된 프로젝트가 없습니다
            </p>
            <p className="text-gray-400">
              첫 번째 프로젝트를 등록해보세요!
            </p>
          </div>
        ) : (
          <div className="masonry-grid">
            {projects.map((project, index) => (
              <ImageCard
                key={index}
                props={project}
                onClick={() => handleCardClick(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 프로젝트 상세 모달 */}
      <ProjectDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        project={selectedProject}
      />
    </div>
  );
}
