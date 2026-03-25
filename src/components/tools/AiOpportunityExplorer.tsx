"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  ExternalLink,
  Loader2,
  Calendar,
  Building,
  MapPin,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

const CATEGORIES = [
  { id: 'opportunity', label: '🔭 기회 탐색', desc: '전국의 공모전, 해커톤, 대외활동을 찾아드립니다.', placeholder: '예: 카카오 공모전, 대학생 해커톤...' },
  { id: 'job', label: '💼 AI 채용', desc: '프롬프트 엔지니어, AI 아티스트 등 새로운 기회를 잡으세요.', placeholder: '예: 프롬프트 엔지니어, 영상 편집...' },
  { id: 'trend', label: '📰 트렌드', desc: '놓치면 안 될 최신 AI 기술 뉴스와 인사이트를 요약해드립니다.', placeholder: '예: Sora, ChatGPT 5, LLM 트렌드...' },
  { id: 'recipe', label: '👨‍🍳 레시피', desc: '원하는 스타일의 이미지 생성 프롬프트와 워크플로우를 알려드립니다.', placeholder: '예: 사이버펑크 스타일, 수채화풍 로고...' },
  { id: 'tool', label: '🛠️ 도구 추천', desc: '작업 목적에 딱 맞는 최고의 AI 도구를 추천해드립니다.', placeholder: '예: 배경 제거, 동영상 업스케일링, 목소리 변조...' },
];

interface HistoryItem {
  keyword: string;
  category: string;
  created_at: string;
}

export function AiOpportunityExplorer({ 
  embedded = false, 
  initialCategory, 
  hideTabs = false 
}: { 
  embedded?: boolean; 
  initialCategory?: string; 
  hideTabs?: boolean; 
}) {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState(initialCategory || "opportunity");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]); // [New] History State

  // [New] Update activeTab when initialCategory changes
  useEffect(() => {
    if (initialCategory) {
        setActiveTab(initialCategory);
        setSearched(false);
        setResults([]);
        setKeyword("");
    }
  }, [initialCategory]);

  // [New] Fetch History
  const fetchHistory = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;
        
        const res = await fetch('/api/tools/search-opportunity', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        if(data.history) setHistory(data.history);
    } catch(e) { console.error("History fetch failed", e); }
  };

  useEffect(() => {
      fetchHistory();
  }, []);

  // [New] Helper for chip click
  const handleSearchWithKeyword = async (kw: string, cat: string) => {
      setKeyword(kw);
      if(cat !== activeTab) setActiveTab(cat);
      // State update is async, so pass explicit args to search logic
      executeSearch(kw, cat);
  };

  const executeSearch = async (kw: string, cat: string) => {
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/tools/search-opportunity', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ keyword: kw, category: cat })
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.items);
        fetchHistory(); // Refresh history after search
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!keyword.trim()) return;
    executeSearch(keyword, activeTab);
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSearched(false);
    setResults([]);
    setKeyword(""); 
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeTab);

  return (
    <div className={`w-full ${embedded ? 'h-full flex flex-col' : 'min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4'}`}>
      <div className={`${embedded ? 'w-full' : 'max-w-4xl mx-auto'}`}>
        
        {/* Header Section (Hide if embedded, or show simplified) */}
        {!embedded && (
            <div className="text-center mb-10">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center mb-4"
            >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                <Bot className="w-8 h-8 text-white" />
                </div>
            </motion.div>
            <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl font-bold text-gray-900 mb-2"
            >
                MyRatingIs Intelligence
            </motion.h1>
            </div>
        )}

        {/* Categories (Tabs) */}
        {!embedded && !hideTabs && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {CATEGORIES.map((cat) => (
                    <button
                    key={cat.id}
                    onClick={() => handleTabChange(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                        activeTab === cat.id 
                        ? 'bg-gray-900 text-white shadow-lg transform scale-105' 
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:border-gray-300'
                    }`}
                    >
                    {cat.label}
                    </button>
                ))}
            </div>
        )}

        {/* Embedded Mode Tabs (Simplified) */}
        {embedded && !hideTabs && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleTabChange(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === cat.id 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        )}

        <div className={`text-center mb-6 min-h-[1.5rem] ${embedded ? 'text-left' : ''}`}>
            <p className="text-sm md:text-lg text-gray-700 font-medium animate-fade-in">
                {currentCategory?.desc}
            </p>
        </div>

        {/* History Chips */}
        {history.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 ${embedded ? 'justify-start' : 'justify-center'}`}>
                {history.map((h, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setKeyword(h.keyword);
                            // Set active tab if different? Optional. For now just set keyword.
                            // If we want to switch tab: setActiveTab(h.category);
                            // Then trigger search... but state update is async.
                            // Let's just set keyword and let user click search or enter, OR auto search.
                            // Auto search is better UX.
                            handleSearchWithKeyword(h.keyword, h.category);
                        }}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-full text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors flex items-center gap-1"
                    >
                        <span className="opacity-50 text-[10px]">{CATEGORIES.find(c => c.id === h.category)?.label.split(' ')[0]}</span>
                        {h.keyword}
                    </button>
                ))}
            </div>
        )}

        {/* Search Bar */}
        <Card className={`mb-8 shadow-sm border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 ${embedded ? 'shadow-md border-purple-50 dark:border-purple-900' : ''}`}>
          <CardContent className="p-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={currentCategory?.placeholder}
                  className="pl-10 h-12 text-sm md:text-base bg-transparent border-gray-100 focus:ring-2 focus:ring-purple-500 rounded-xl"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading || !keyword.trim()}
                className="h-12 px-6 text-sm md:text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md transition-all hover:scale-105"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "검색"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className={`space-y-4 ${embedded ? 'flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 max-h-[500px]' : ''}`}>
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm animate-pulse">
                AI가 정보를 수집하고 분석 중입니다...
              </p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <span className="text-4xl mb-2 block">😅</span>
              <h3 className="text-base font-semibold text-gray-900 mb-1">검색 결과가 없습니다</h3>
              <p className="text-xs text-gray-500">
                다른 키워드로 검색해보시는 건 어떨까요?
              </p>
            </div>
          )}

          <AnimatePresence>
            {!loading && results.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {item.title}
                        </h3>
                        <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0">
                            {item.type || activeTab}
                        </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                        {item.company && (
                            <div className="flex items-center gap-1"><Building className="w-3 h-3" /> {item.company}</div>
                        )}
                        {item.date && (
                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</div>
                        )}
                        {item.location && (
                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</div>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="text-[10px] text-gray-300">
                           Source: {item.sourceUrl?.includes('haebojago') ? 'Haebojago MCP' : 'MyRatingIs'}
                        </span>
                        {item.link && (
                            <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                            >
                                자세히 보기 <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
