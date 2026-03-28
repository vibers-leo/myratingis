'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Globe, ExternalLink, ArrowLeft, CheckCircle, XCircle, Code, FileText } from 'lucide-react';

const SITE_URL = 'https://myratingis.kr';
const SITE_NAME = '제 평가는요?';

interface SiteMeta {
  title: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  description: string;
  naverVerification: string;
  canonical: string;
  jsonLd: boolean;
  jsonLdType: string | null;
}

export default function AdminSeoPage() {
  const [liveMeta, setLiveMeta] = useState<SiteMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [llmsTxt, setLlmsTxt] = useState<boolean | null>(null);

  const fetchMeta = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/site-meta?url=${encodeURIComponent(SITE_URL)}`);
      const data = await res.json();
      if (data.success) {
        setLiveMeta(data.meta);
      } else {
        setError(data.error || '불러오기 실패');
      }
    } catch (e: any) {
      setError(e.message || '네트워크 오류');
    }
    setLoading(false);
  };

  const handleFetch = async () => {
    await fetchMeta();
    try {
      const res = await fetch(`${SITE_URL}/llms.txt`, { signal: AbortSignal.timeout(5000) });
      setLlmsTxt(res.ok);
    } catch {
      setLlmsTxt(false);
    }
  };

  const statusItems = liveMeta ? [
    { ok: !!liveMeta.ogTitle, label: 'OG 타이틀', value: liveMeta.ogTitle },
    { ok: !!liveMeta.ogDescription, label: 'OG 설명', value: liveMeta.ogDescription },
    { ok: !!liveMeta.ogImage, label: 'OG 이미지', value: liveMeta.ogImage ? '설정됨' : '' },
    { ok: !!liveMeta.naverVerification, label: '네이버 인증', value: liveMeta.naverVerification || '' },
    { ok: !!liveMeta.description, label: 'Meta Description', value: liveMeta.description },
    { ok: !!liveMeta.canonical, label: 'Canonical URL', value: liveMeta.canonical },
  ] : [];

  const seoTools = [
    { name: '네이버 서치어드바이저', url: 'https://searchadvisor.naver.com' },
    { name: '구글 서치콘솔', url: 'https://search.google.com/search-console' },
    { name: 'OG 미리보기 테스트', url: `https://www.opengraph.xyz/url/${encodeURIComponent(SITE_URL)}` },
    { name: 'Google PageSpeed', url: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SITE_URL)}` },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SEO 관리</h1>
          <p className="text-sm text-slate-500">{SITE_NAME} — 검색엔진 최적화 현황</p>
        </div>
      </div>

      {/* 사이트 정보 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-4">사이트 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400">도메인</p>
            <p className="text-sm font-medium text-slate-900">{SITE_URL.replace('https://', '')}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">프로젝트</p>
            <p className="text-sm font-medium text-slate-900">{SITE_NAME}</p>
          </div>
        </div>
      </div>

      {/* 라이브 체크 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase">
            실시간 SEO 현황
            <span className="ml-2 text-[10px] font-normal text-blue-500 normal-case">라이브 체크</span>
          </h3>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '체크 중...' : '현재 상태 불러오기'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}

        {liveMeta ? (
          <div className="space-y-4">
            {/* OG 미리보기 카드 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              {liveMeta.ogImage ? (
                <img src={liveMeta.ogImage} alt="OG" className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                  <p className="text-xs text-slate-400">OG 이미지 없음</p>
                </div>
              )}
              <div className="p-4">
                <p className="text-[10px] text-slate-400">{SITE_URL.replace('https://', '')}</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{liveMeta.ogTitle || liveMeta.title || '(타이틀 없음)'}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{liveMeta.ogDescription || liveMeta.description || '(설명 없음)'}</p>
              </div>
            </div>

            {/* 상태 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {statusItems.map((item) => (
                <div key={item.label} className={`p-3 rounded-xl border ${item.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${item.ok ? 'text-green-700' : 'text-red-600'}`}>
                    {item.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {item.label}
                  </div>
                  {item.value && (
                    <p className="text-[10px] text-slate-500 mt-1 truncate">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* AEO 상태 */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase">AEO 상태 (AI 검색 최적화)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${liveMeta.jsonLd ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${liveMeta.jsonLd ? 'text-green-700' : 'text-red-600'}`}>
                    {liveMeta.jsonLd ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <Code className="w-3 h-3" />
                    JSON-LD
                  </div>
                  {liveMeta.jsonLdType && (
                    <p className="text-[10px] text-slate-500 mt-1">@type: {liveMeta.jsonLdType}</p>
                  )}
                </div>
                <div className={`p-3 rounded-xl border ${llmsTxt ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${llmsTxt ? 'text-green-700' : 'text-yellow-600'}`}>
                    {llmsTxt ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <FileText className="w-3 h-3" />
                    llms.txt
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{llmsTxt ? '존재함' : '없음'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-xs text-slate-400">&quot;현재 상태 불러오기&quot; 버튼으로 사이트의 OG/SEO 상태를 확인하세요.</p>
          </div>
        )}
      </div>

      {/* SEO 도구 링크 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">SEO 도구</h3>
        <div className="grid grid-cols-2 gap-3">
          {seoTools.map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-slate-700"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              {tool.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
