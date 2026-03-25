"use client";

import { useState, useEffect, useCallback } from "react";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "recent" | "popular" | "category";
}

const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT = 10;

/**
 * 검색 자동완성 훅
 */
export function useSearchSuggestions() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 최근 검색어 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // 최근 검색어 저장
  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setRecentSearches((prev) => {
      // 중복 제거 후 맨 앞에 추가
      const filtered = prev.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT);

      // localStorage 저장
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }

      return updated;
    });
  }, []);

  // 최근 검색어 삭제
  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== query);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // 모든 최근 검색어 삭제
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  }, []);

  // 검색어 기반 제안 생성
  const getSuggestions = useCallback(
    (query: string): SearchSuggestion[] => {
      if (!query.trim()) {
        // 빈 검색어일 때 최근 검색어 반환
        return recentSearches.map((text, i) => ({
          id: `recent_${i}`,
          text,
          type: "recent" as const,
        }));
      }

      const lowerQuery = query.toLowerCase();
      const results: SearchSuggestion[] = [];

      // 최근 검색어 중 매칭되는 것
      recentSearches.forEach((text, i) => {
        if (text.toLowerCase().includes(lowerQuery)) {
          results.push({
            id: `recent_${i}`,
            text,
            type: "recent",
          });
        }
      });

      // 인기 카테고리 제안
      const popularCategories = [
        "UI/UX 디자인",
        "일러스트",
        "3D 모델링",
        "웹 개발",
        "모션 그래픽",
        "브랜딩",
        "포토그래피",
        "AI 아트",
      ];

      popularCategories.forEach((cat, i) => {
        if (cat.toLowerCase().includes(lowerQuery)) {
          results.push({
            id: `cat_${i}`,
            text: cat,
            type: "category",
          });
        }
      });

      return results.slice(0, 8); // 최대 8개
    },
    [recentSearches]
  );

  // 쿼리 변경 시 제안 업데이트
  const updateSuggestions = useCallback(
    (query: string) => {
      setIsLoading(true);
      // 디바운싱 효과를 위해 약간의 딜레이
      setTimeout(() => {
        setSuggestions(getSuggestions(query));
        setIsLoading(false);
      }, 100);
    },
    [getSuggestions]
  );

  return {
    recentSearches,
    suggestions,
    isLoading,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    updateSuggestions,
  };
}
