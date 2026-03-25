// src/app/search/SearchPageContent.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageCard } from "@/components/ImageCard";

interface Project {
  id: string;
  title?: string;
  urls: {
    full: string;
    regular: string;
  };
  user: {
    username: string;
    profile_image: {
      small: string;
      large: string;
    };
  };
  likes: number;
  views?: number;
  description: string | null;
  alt_description: string | null;
  created_at: string;
  width: number;
  height: number;
  category: string;
  tags?: string[];
}

export default function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // 검색 실행
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        let url = '/api/projects?';
        
        if (searchQuery.trim()) {
          url += `search=${encodeURIComponent(searchQuery)}&`;
        }
        
        if (selectedCategory && selectedCategory !== 'all') {
          url += `category=${selectedCategory}&`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.projects) {
          // API 데이터를 기존 형식으로 변환
          const formattedProjects = data.projects.map((p: any) => ({
            id: p.project_id.toString(),
            title: p.title,
            urls: {
              full: p.thumbnail_url || '/placeholder.jpg',
              regular: p.thumbnail_url || '/placeholder.jpg',
            },
            user: {
              username: p.User?.nickname || 'Unknown',
              profile_image: {
                small: p.User?.profile_image_url || '/globe.svg',
                large: p.User?.profile_image_url || '/globe.svg',
              },
            },
            likes: p.likes_count || 0,
            views: p.views_count || 0,
            description: p.content_text,
            alt_description: p.title,
            created_at: p.created_at,
            width: 400,
            height: 300,
            category: p.Category?.name || 'korea',
            tags: [],
          }));

          setSearchResults(formattedProjects);
        }
      } catch (error) {
        console.error('검색 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [searchQuery, selectedCategory]);



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // URL 업데이트
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const categories = [
    { value: "all", label: "전체" },
    { value: "korea", label: "전체" },
    { value: "ai", label: "AI" },
    { value: "video", label: "영상/모션그래픽" },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-14 md:top-16 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-secondary hover:text-primary mb-4"
          >
            <ArrowLeft size={20} />
            뒤로 가기
          </Button>

          {/* 검색 폼 */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center border border-gray-300 px-4 py-3 rounded-lg bg-white focus-within:border-black transition-colors">
                <Search size={20} className="text-gray-400 mr-3" />
                <Input
                  type="text"
                  placeholder="프로젝트 검색 (제목, 설명, 태그)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-none focus-visible:ring-0 p-0 text-lg"
                />
              </div>
              <Button type="submit" className="btn-primary px-8">
                검색
              </Button>
            </div>
          </form>

          {/* 카테고리 필터 */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Filter size={18} className="text-gray-400 mr-2" />
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.value
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary mb-2">
              "{searchQuery}" 검색 결과
            </h2>
            <p className="text-secondary">
              {searchResults.length}개의 프로젝트를 찾았습니다
            </p>
          </div>
        )}

        {searchResults.length > 0 ? (
          <div className="masonry-grid">
            {searchResults.map((project) => (
              <ImageCard key={project.id} props={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Search size={64} className="text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">
              {searchQuery
                ? "검색 결과가 없습니다"
                : "검색어를 입력하세요"}
            </h2>
            <p className="text-secondary mb-8">
              {searchQuery
                ? "다른 검색어로 시도해보세요"
                : "프로젝트 제목, 설명, 태그로 검색할 수 있습니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
